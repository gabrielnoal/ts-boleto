const fs = require('fs')
const path = require('path')

// Load banks
const banks = {}
const banksFolders = fs.readdirSync(path.join(__dirname, '/banks/'))
for (let i = 0; i < banksFolders.length; i++) {
  const name = banksFolders[i]
  banks[name] = require(path.join(__dirname, '/banks/', name, '/index.js'))
}

exports.Boleto = require('./lib/boleto')(banks)
exports.EdiParser = require('./lib/edi-parser')(banks)
