/**
 * Servidor local para visualizar boleto Bradesco com QR PIX de teste.
 * Uso: node examples/bradesco-pix-local.js
 * Abra: http://127.0.0.1:3003
 */

const http = require('http')
const Boleto = require('../dist/index').Boleto

const PIX_PAYLOAD = 'https://qrpix-h.bradesco.com.br/qr/v2/cobv/a7d53d47-3820-4092-bd1a-420e7dec55f0'

const boleto = new Boleto({
  banco: 'bradesco',
  data_emissao: new Date(),
  data_vencimento: new Date(new Date().getTime() + 5 * 24 * 3600 * 1000),
  valor: 1500,
  nosso_numero: '6',
  numero_documento: '1',
  cedente: 'Pagar.me Pagamentos S/A',
  cedente_cnpj: '18727053000174',
  agencia: '1229',
  codigo_cedente: '469',
  carteira: '25',
  pagador: 'Nome do pagador\nCPF: 000.000.000-00',
  local_de_pagamento: 'PAGÁVEL EM QUALQUER BANCO ATÉ O VENCIMENTO.',
  instrucoes: 'Sr. Caixa, aceitar o pagamento e não cobrar juros após o vencimento.',
  pix_copia_cola: PIX_PAYLOAD
})

const server = http.createServer(function (req, res) {
  if (req.url !== '/' && req.url !== '/index.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
    return
  }
  boleto.renderHTML(function (html) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
  })
})

server.listen(3003, '127.0.0.1', function () {
  console.log('Boleto Bradesco + PIX: http://127.0.0.1:3003')
  console.log('Linha digitável:', boleto.linha_digitavel)
})
