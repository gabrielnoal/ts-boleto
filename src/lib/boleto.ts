import * as ejs from 'ejs'
import * as path from 'path'
import type { MomentInput } from 'moment'
import moment from 'moment'
import QRCode from 'qrcode'
import type { BankRegistry, BoletoInstance, BoletoOptionsInput } from '../types'
import * as barcode from './barcode'
import * as formatters from './formatters'

let banks: BankRegistry | null = null

function hashString (str: string): number {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return hash
}

interface BoletoConstructor {
  new (options: BoletoOptionsInput): BoletoInstance
  barcodeRenderEngine: 'img' | 'bmp'
  prototype: {
    _calculate: (this: BoletoInstance) => void
    renderHTML: (this: BoletoInstance, callback: (html: string) => void) => void
  }
}

function Boleto (this: BoletoInstance, options: BoletoOptionsInput | undefined): void {
  if (!options) {
    throw 'No options provided initializing Boleto.'
  }
  if (!banks) {
    throw new Error('Boleto factory not initialized.')
  }

  const bank = banks[options.banco]
  this.bank = bank
  if (!this.bank) {
    throw 'Invalid bank.'
  }

  if (!options.data_emissao) {
    options.data_emissao = moment().utc()
  } else {
    options.data_emissao = moment(moment(options.data_emissao as MomentInput).utc().format('YYYY-MM-DD'))
  }

  if (!options.data_vencimento) {
    options.data_vencimento = moment().utc().add('5', 'days')
  } else {
    options.data_vencimento = moment(moment(options.data_vencimento as MomentInput).utc().format('YYYY-MM-DD'))
  }

  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      ;(this as Record<string, unknown>)[key] = (options as Record<string, unknown>)[key]
    }
  }

  this.pagador = formatters.htmlString(this.pagador as string | undefined) as string | undefined
  this.instrucoes = formatters.htmlString(this.instrucoes as string | undefined) as string | undefined

  if (!this.local_de_pagamento) {
    this.local_de_pagamento =
      `Até o vencimento, preferencialmente no Banco ${formatters.capitalize(String(this.banco))}`
  }

  Boleto.prototype._calculate.call(this as BoletoInstance)
}

Boleto.prototype._calculate = function (this: BoletoInstance): void {
  const opt = this.bank.options!
  this.codigo_banco = `${opt.codigo}-${formatters.mod11(opt.codigo)!}`
  this.nosso_numero_dv = formatters.mod11(String(this.nosso_numero))!
  this.barcode_data = this.bank.barcodeData!(this)
  this.linha_digitavel = this.bank.linhaDigitavel!(this.barcode_data as string)
}

Boleto.prototype.renderHTML = function (this: BoletoInstance, callback: (html: string) => void): void {
  const self = this

  const renderOptions: Record<string, unknown> = { ...self.bank.options! }
  renderOptions.boleto = self

  for (const key in formatters) {
    if (Object.prototype.hasOwnProperty.call(formatters, key)) {
      renderOptions[key] = (formatters as Record<string, unknown>)[key]
    }
  }

  renderOptions.barcode_render_engine = (Boleto as unknown as BoletoConstructor).barcodeRenderEngine
  renderOptions.barcode_height = '50'

  const engine = (Boleto as unknown as BoletoConstructor).barcodeRenderEngine
  if (engine === 'bmp') {
    renderOptions.barcode_data = barcode.bmpLineForBarcodeData(self.barcode_data as string)
  } else if (engine === 'img') {
    renderOptions.barcode_data = barcode.binaryRepresentationForBarcodeData(self.barcode_data as string)
  }

  const linha = String((renderOptions.boleto as BoletoInstance).linha_digitavel)
  ;(renderOptions.boleto as BoletoInstance).linha_digitavel_hash = hashString(linha).toString()

  const pixPayload = self.pix_copia_cola ?? self.pixCopiaCola
  const shouldRenderPixQr = self.banco === 'bradesco' &&
    typeof pixPayload === 'string' &&
    pixPayload.trim().length > 0

  const renderLayout = (): void => {
    ejs.renderFile(
      path.join(__dirname, '../../assets/layout.ejs'),
      renderOptions,
      { cache: true },
      function (err: Error | null | undefined, html?: string) {
        if (err) {
          throw new Error(String(err))
        }
        if (html === undefined) {
          throw new Error('EJS returned empty HTML.')
        }
        callback(html)
      }
    )
  }

  if (shouldRenderPixQr) {
    QRCode.toDataURL((pixPayload as string).trim(), {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 120
    }, function (_err: Error | null | undefined, dataUrl: string | undefined) {
      if (!_err && dataUrl) {
        renderOptions.pix_qr_data_url = dataUrl
      }
      renderLayout()
    })
  } else {
    renderLayout()
  }
}

;(Boleto as unknown as BoletoConstructor).barcodeRenderEngine = 'img'

export = function createBoleto (_banks: BankRegistry): BoletoConstructor {
  banks = _banks
  return Boleto as unknown as BoletoConstructor
}
