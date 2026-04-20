# node-boleto

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Biblioteca em **TypeScript** (compilada para CommonJS) para **gerar boletos em HTML** (linha digitável, código de barras e layout) e **interpretar arquivos de retorno EDI**. A lógica de linha digitável e código de barras tem raízes no [boletophp](https://github.com/BielSystems/boletophp).

- **Runtime:** Node.js **≥ 18.18** (veja `engines` em `package.json`)
- **Pacote npm:** [`node-boleto`](https://www.npmjs.com/package/node-boleto) — nome do pacote publicado; este repositório mantém o código-fonte em `src/` e o build em `dist/`.

## Bancos suportados

| Banco     | Emissão (HTML / código de barras) | Retorno EDI | Observações |
|-----------|-------------------------------------|------------|-------------|
| Santander | Sim                                 | Sim        | — |
| Bradesco  | Sim                                 | Sim        | QR **PIX** no boleto quando `pix_copia_cola` ou `pixCopiaCola` é informado (somente Bradesco). |
| Caixa     | Não                                 | Sim        | Apenas `parseEDIFile`; não use `banco: 'caixa'` para emissão de boleto. |

Novos bancos podem ser adicionados em `src/banks/<nome>/`, seguindo o contrato em `src/types.ts` (`BankModule`).

## Instalação

```bash
npm install node-boleto
```

Para trabalhar a partir do clone deste repositório:

```bash
npm install
npm run build
```

O consumo da API publicada usa o artefato em `dist/` (e tipos `dist/*.d.ts`).

## Uso básico — emitir boleto

```javascript
const { Boleto } = require('node-boleto')

const boleto = new Boleto({
  banco: 'santander', // nome da pasta em src/banks
  data_emissao: new Date(),
  data_vencimento: new Date(Date.now() + 5 * 24 * 3600 * 1000),
  valor: 1500, // centavos (ex.: R$ 15,00)
  nosso_numero: '1234567',
  numero_documento: '123123',
  cedente: 'Pagar.me Pagamentos S/A',
  cedente_cnpj: '18727053000174',
  agencia: '3978',
  codigo_cedente: '6404154',
  carteira: '102'
})

console.log('Linha digitável:', boleto.linha_digitavel)

boleto.renderHTML(function (html) {
  console.log(html)
})
```

### TypeScript

Tipos públicos ficam em `dist/types.d.ts` (incluídos no pacote). A entrada principal (`export = { Boleto, EdiParser }`) é CommonJS; em TS costuma-se combinar `import type` profundo com `require`:

```typescript
import type { BoletoOptionsInput } from 'node-boleto/dist/types'

const { Boleto } = require('node-boleto')

const options: BoletoOptionsInput = {
  banco: 'bradesco',
  valor: 100,
  nosso_numero: '1',
  agencia: '1229',
  codigo_cedente: '469',
  carteira: '25',
  data_emissao: new Date(),
  data_vencimento: new Date()
}

const boleto = new Boleto(options)
```

### PIX (Bradesco)

Para exibir QR Code no layout, passe o payload copia e cola (ou URL conforme o convênio):

```javascript
const boleto = new Boleto({
  banco: 'bradesco',
  // ... demais campos obrigatórios do banco
  pix_copia_cola: '00020126580014br.gov.bcb.pix...' // ou URL do QR dinâmico, conforme o caso
})
```

Há um servidor de exemplo após o build: `node examples/bradesco-pix-local.js` (porta `3003`).

## Arquivo-retorno (EDI)

```javascript
const { EdiParser } = require('node-boleto')
const fs = require('fs')

const ediFileContent = fs.readFileSync('arquivo-retorno.txt', 'utf8')
const parsedFile = EdiParser.parse('santander', ediFileContent)

console.log(parsedFile.boletos)
```

Outros exemplos: `examples/santander-edi.js`, `examples/bradesco-edi.js`, `examples/*-emission.js`.

## Renderização do código de barras

Duas engines: `img` (compatível com navegadores antigos, HTML mais pesado) e `bmp` (mais leve; IE a partir da versão 8).

```javascript
const { Boleto } = require('node-boleto')
Boleto.barcodeRenderEngine = 'bmp' // padrão: 'img'
```

O layout HTML é gerado com [EJS](https://ejs.co/) a partir de `assets/layout.ejs`.

## Desenvolvimento

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Compila `src/` → `dist/` (`tsc`) |
| `npm test` | Testes unitários, de integração e e2e (Mocha + nyc) |
| `npm run lint` | ESLint (Standard) |
| `npm run cover-report` | Relatório de cobertura em `./coverage` |

Antes de rodar exemplos ou testes que carregam `dist/`, execute `npm run build`.

## Estrutura (resumo)

- `src/` — código TypeScript (`lib/`, `banks/`, `index.ts`, `types.ts`)
- `dist/` — saída do build (não editar à mão)
- `assets/` — template `layout.ejs` e recursos do boleto
- `test/` — especificações Mocha em JavaScript
- `examples/` — scripts de emissão, EDI e PIX local

## Licença

MIT — Copyright (c) 2013-2017 Pagar.me Pagamentos S/A

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
