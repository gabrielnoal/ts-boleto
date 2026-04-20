import type { BankRegistry, EdiParserApi } from '../types'

export = function createEdiParser (banks: BankRegistry): EdiParserApi {
  return {
    parse (bankName: string, fileContent: string): unknown {
      return banks[bankName].parseEDIFile(fileContent)
    }
  }
}
