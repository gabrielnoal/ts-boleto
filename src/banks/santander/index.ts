import moment from 'moment-timezone'
import type { BankModule, BoletoInstance } from '../../types'
import * as ediHelper from '../../lib/edi-helper'
import * as formatters from '../../lib/formatters'
import * as helper from './helper'

const santanderBank: BankModule = {
  options: {
    logoURL: 'https://assets.pagar.me/boleto/images/santander.png',
    codigo: '033'
  },

  dvBarra (barra: string): number {
    const resto2 = formatters.mod11(barra, 9, 1)!
    return (resto2 === 0 || resto2 === 1 || resto2 === 10) ? 1 : 11 - resto2
  },

  barcodeData (boleto: BoletoInstance): string {
    const codigoBanco = this.options!.codigo
    const numMoeda = '9'
    const fixo = '9'
    const ios = '0'

    const fatorVencimento = formatters.fatorVencimento(moment(boleto.data_vencimento as moment.Moment).utc().format())

    const valor = formatters.addTrailingZeros(String(boleto.valor), 10)
    const carteira = String(boleto.carteira)
    const codigoCedente = formatters.addTrailingZeros(String(boleto.codigo_cedente), 7)

    const nossoNumero = formatters.addTrailingZeros(String(boleto.nosso_numero), 12) + String(formatters.mod11(String(boleto.nosso_numero)))

    const barra = codigoBanco + numMoeda + fatorVencimento + valor + fixo + codigoCedente + nossoNumero + ios + carteira

    const dv = this.dvBarra!.call(this, barra)
    const lineData = barra.substring(0, 4) + dv + barra.substring(4, barra.length)

    return lineData
  },

  linhaDigitavel (barcodeDataStr: string): string {
    const campos: string[] = []

    let campo = barcodeDataStr.substring(0, 3) + barcodeDataStr.substring(3, 4) + barcodeDataStr.substring(19, 20) + barcodeDataStr.substring(20, 24)
    campo = campo + String(formatters.mod10(campo))
    campo = campo.substring(0, 5) + '.' + campo.substring(5, campo.length)
    campos.push(campo)

    campo = barcodeDataStr.substring(24, 34)
    campo = campo + String(formatters.mod10(campo))
    campo = campo.substring(0, 5) + '.' + campo.substring(5, campo.length)
    campos.push(campo)

    campo = barcodeDataStr.substring(34, 44)
    campo = campo + String(formatters.mod10(campo))
    campo = campo.substring(0, 5) + '.' + campo.substring(5, campo.length)
    campos.push(campo)

    campo = barcodeDataStr.substring(4, 5)
    campos.push(campo)

    campo = barcodeDataStr.substring(5, 9) + barcodeDataStr.substring(9, 19)
    campos.push(campo)

    return campos.join(' ')
  },

  parseEDIFile (fileContent: string): unknown {
    try {
      const lines = fileContent.split('\n')
      const parsedFile: Record<string, unknown> & {
        boletos: Record<string, Record<string, unknown>>
      } = {
        boletos: {}
      }

      let currentNossoNumero: string | null = null

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const registro = line.substring(7, 8)

        if (registro === '0') {
          parsedFile.cnpj = line.substring(17, 32)
          parsedFile.razao_social = line.substring(72, 102)
          parsedFile.agencia_cedente = line.substring(32, 36)
          parsedFile.conta_cedente = line.substring(37, 47)
          parsedFile.data_arquivo = helper.dateFromEdiDate(line.substring(143, 152))
        } else if (registro === '3') {
          const segmento = line.substring(13, 14)

          if (segmento === 'T') {
            const boleto: Record<string, unknown> = {}

            boleto.codigo_ocorrencia = line.substring(15, 17)
            boleto.vencimento = formatters.dateFromEdiDate(line.substring(69, 77))
            boleto.valor = formatters.removeTrailingZeros(line.substring(77, 92))
            boleto.tarifa = formatters.removeTrailingZeros(line.substring(193, 208))
            boleto.banco_recebedor = formatters.removeTrailingZeros(line.substring(92, 95))
            boleto.agencia_recebedora = formatters.removeTrailingZeros(line.substring(95, 100))

            currentNossoNumero = formatters.removeTrailingZeros(line.substring(40, 52))
            parsedFile.boletos[currentNossoNumero] = boleto
          } else if (segmento === 'U') {
            const entry = parsedFile.boletos[currentNossoNumero!]
            entry.valor_pago = formatters.removeTrailingZeros(line.substring(77, 92))

            let paid = String(entry.valor_pago) >= String(entry.valor)
            paid = paid && entry.codigo_ocorrencia === '17'

            const boleto = entry
            boleto.pago = paid
            boleto.edi_line_number = i
            boleto.edi_line_checksum = ediHelper.calculateLineChecksum(line)
            boleto.edi_line_fingerprint = `${boleto.edi_line_number}:${boleto.edi_line_checksum}`

            currentNossoNumero = null
          }
        }
      }

      return parsedFile
    } catch (_e) {
      return null
    }
  }
}

export = santanderBank
