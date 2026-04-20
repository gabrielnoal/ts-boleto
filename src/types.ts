import type { Moment } from 'moment-timezone'

/**
 * Input fields accepted when constructing a {@link BoletoConstructor}.
 * Additional bank-specific keys are allowed.
 */
export interface BoletoOptionsInput {
  banco: string
  data_emissao?: string | number | Date | Moment
  data_vencimento?: string | number | Date | Moment
  valor: number | string
  nosso_numero: number | string
  numero_documento?: string
  cedente?: string
  cedente_cnpj?: string
  agencia?: string
  codigo_cedente?: string
  carteira?: string
  pagador?: string
  instrucoes?: string
  local_de_pagamento?: string
  pix_copia_cola?: string
  pixCopiaCola?: string
  [key: string]: unknown
}

export interface BankOptions {
  logoURL: string
  codigo: string
}

/** Runtime boleto instance (constructor assigns all option keys onto `this`). */
export interface BoletoInstance {
  bank: BankModule
  banco: string
  data_emissao: Moment
  data_vencimento: Moment
  valor: number | string
  nosso_numero: number | string
  codigo_banco?: string
  nosso_numero_dv?: number
  barcode_data?: string
  linha_digitavel?: string
  pagador?: string
  instrucoes?: string
  local_de_pagamento?: string
  pix_copia_cola?: string
  pixCopiaCola?: string
  [key: string]: unknown
}

/**
 * Banks that support `Boleto` emission expose `options` and barcode helpers.
 * Caixa currently only implements `parseEDIFile` (EDI retorno).
 */
export interface BankModule {
  options?: BankOptions
  dvBarra?: (this: BankModule, barra: string) => number
  barcodeData?: (this: BankModule, boleto: BoletoInstance) => string
  linhaDigitavel?: (barcodeData: string) => string
  parseEDIFile: (fileContent: string) => unknown
}

export type BankRegistry = Record<string, BankModule>

export interface BoletoConstructor {
  new (options: BoletoOptionsInput): BoletoInstance
  barcodeRenderEngine: 'img' | 'bmp'
  prototype: {
    _calculate: () => void
    renderHTML: (callback: (html: string) => void) => void
  }
}

export interface EdiParserApi {
  parse: (bankName: string, fileContent: string) => unknown
}
