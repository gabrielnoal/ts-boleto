import fs from 'fs'
import path from 'path'
import type { BankRegistry, BoletoConstructor, EdiParserApi } from './types'
import createBoleto = require('./lib/boleto')
import createEdiParser = require('./lib/edi-parser')

const banks: BankRegistry = {}
const banksDir = path.join(__dirname, 'banks')
for (const name of fs.readdirSync(banksDir)) {
  banks[name] = require(path.join(banksDir, name, 'index')) as BankRegistry[string]
}

const Boleto = createBoleto(banks) as BoletoConstructor
const EdiParser = createEdiParser(banks) as EdiParserApi

export = { Boleto, EdiParser }
