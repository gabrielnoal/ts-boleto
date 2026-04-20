import moment from 'moment-timezone'
import type { BankModule, BoletoInstance } from '../../types'
import * as ediHelper from '../../lib/edi-helper'
import * as formatters from '../../lib/formatters'

const bradescoBank: BankModule = {
  options: {
    logoURL: 'https://assets.pagar.me/boleto/images/bradesco.jpg',
    codigo: '237'
  },

  dvBarra (barra: string): number {
    const resto2 = formatters.mod11(barra, 9, 1)!
    return (resto2 === 0 || resto2 === 1 || resto2 === 10) ? 1 : 11 - resto2
  },

  barcodeData (boleto: BoletoInstance): string {
    const codigoBanco = this.options!.codigo
    const numMoeda = '9'

    const fatorVencimento = formatters.fatorVencimento(moment(boleto.data_vencimento as moment.Moment).utc().format())

    const agencia = formatters.addTrailingZeros(String(boleto.agencia), 4)

    const valor = formatters.addTrailingZeros(String(boleto.valor), 10)
    const carteira = String(boleto.carteira)
    const codigoCedente = formatters.addTrailingZeros(String(boleto.codigo_cedente), 7)

    const nossoNumero = carteira + formatters.addTrailingZeros(String(boleto.nosso_numero), 11)

    const barra = codigoBanco + numMoeda + fatorVencimento + valor + agencia + nossoNumero + codigoCedente + '0'

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
      const parsedFile: Record<string, unknown> & { boletos: Record<string, unknown>[] } = {
        boletos: []
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const registro = line.substring(0, 1)

        if (registro === '0') {
          parsedFile.razao_social = line.substring(46, 76)
          parsedFile.data_arquivo = ediHelper.dateFromEdiDate(line.substring(94, 100))
        } else if (registro === '1') {
          const boleto: Record<string, unknown> = {}

          parsedFile.cnpj = formatters.removeTrailingZeros(line.substring(3, 17))
          parsedFile.carteira = formatters.removeTrailingZeros(line.substring(22, 24))
          parsedFile.agencia_cedente = formatters.removeTrailingZeros(line.substring(24, 29))
          parsedFile.conta_cedente = formatters.removeTrailingZeros(line.substring(29, 37))

          boleto.codigo_ocorrencia = line.substring(108, 110)

          const ocorrenciasStr = line.substring(318, 328)
          const motivosOcorrencia: string[] = []
          let isPaid = (parseInt(String(boleto.valor_pago), 10) >= parseInt(String(boleto.valor), 10) || boleto.codigo_ocorrencia === '06')

          for (let j = 0; j < ocorrenciasStr.length; j += 2) {
            const ocorrencia = ocorrenciasStr.substr(j, 2)
            motivosOcorrencia.push(ocorrencia)

            if (ocorrencia !== '00') {
              isPaid = false
            }
          }

          boleto.motivos_ocorrencia = motivosOcorrencia
          boleto.data_ocorrencia = ediHelper.dateFromEdiDate(line.substring(110, 116))
          boleto.data_credito = ediHelper.dateFromEdiDate(line.substring(295, 301))
          boleto.vencimento = ediHelper.dateFromEdiDate(line.substring(110, 116))
          boleto.valor = formatters.removeTrailingZeros(line.substring(152, 165))
          boleto.banco_recebedor = formatters.removeTrailingZeros(line.substring(165, 168))
          boleto.agencia_recebedora = formatters.removeTrailingZeros(line.substring(168, 173))
          boleto.paid = isPaid
          boleto.edi_line_number = i
          boleto.edi_line_checksum = ediHelper.calculateLineChecksum(line)
          boleto.edi_line_fingerprint = `${boleto.edi_line_number}:${boleto.edi_line_checksum}`
          boleto.nosso_numero = formatters.removeTrailingZeros(line.substring(70, 81))

          boleto.juros_operacao_em_atraso = formatters.removeTrailingZeros(line.substring(201, 214))
          boleto.iof_devido = formatters.removeTrailingZeros(line.substring(214, 227))
          boleto.abatimento_concedido = formatters.removeTrailingZeros(line.substring(227, 240))
          boleto.desconto_concedido = formatters.removeTrailingZeros(line.substring(240, 253))
          boleto.valor_pago = formatters.removeTrailingZeros(line.substring(253, 266))
          boleto.juros_mora = formatters.removeTrailingZeros(line.substring(266, 279))
          boleto.outros_creditos = formatters.removeTrailingZeros(line.substring(279, 292))
          boleto.raw_line = line

          parsedFile.boletos.push(boleto)
        }
      }

      return parsedFile
    } catch (e) {
      console.log(e)
      return null
    }
  }
}

export = bradescoBank
