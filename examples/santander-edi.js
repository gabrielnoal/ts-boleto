const fs = require('fs')
const path = require('path')

const ediParser = require('../dist/index').EdiParser

console.log(ediParser.parse('santander', fs.readFileSync(path.join(__dirname, '/retorno.txt')).toString()))
