const digits: Record<number, string> = {
  0: '00110',
  1: '10001',
  2: '01001',
  3: '11000',
  4: '00101',
  5: '10100',
  6: '01100',
  7: '00011',
  8: '10010',
  9: '01010'
}

export function binaryRepresentationForBarcodeData (barcodeData: string): string {
  let data = barcodeData
  if (data.length % 2 !== 0) {
    data = `0${data}`
  }

  let binaryDigits = '0000'
  for (let i = 0; i < data.length; i += 2) {
    const digit1 = digits[parseInt(data[i], 10)]!
    const digit2 = digits[parseInt(data[i + 1], 10)]!

    for (let j = 0; j < digit1.length; j++) {
      binaryDigits += digit1[j] + digit2[j]
    }
  }

  binaryDigits += '1000'
  return binaryDigits
}

export function _getLittleEndianHex (value: number): string {
  const result: string[] = []
  let v = value
  for (let bytes = 4; bytes > 0; bytes--) {
    result.push(String.fromCharCode(v & 0xff))
    v >>= 0x8
  }
  return result.join('')
}

export function _bmpHeader (width: number, height: number): string {
  let numFileBytes = _getLittleEndianHex(width * height)
  const wHex = _getLittleEndianHex(width)
  const hHex = _getLittleEndianHex(height)

  return 'BM' +
    numFileBytes +
    '\x00\x00' +
    '\x00\x00' +
    '\x36\x00\x00\x00' +
    '\x28\x00\x00\x00' +
    wHex +
    hHex +
    '\x01\x00' +
    '\x20\x00' +
    '\x00\x00\x00\x00' +
    '\x00\x00\x00\x00' +
    '\x13\x0B\x00\x00' +
    '\x13\x0B\x00\x00' +
    '\x00\x00\x00\x00' +
    '\x00\x00\x00\x00'
}

export function bmpLineForBarcodeData (barcodeData: string): string {
  const binaryRepresentation = binaryRepresentationForBarcodeData(barcodeData)

  const bmpData: string[] = []
  let black = true
  let offset = 0

  for (let i = 0; i < binaryRepresentation.length; i++) {
    const digit = binaryRepresentation[i]
    const color = black ? String.fromCharCode(0, 0, 0, 0) : String.fromCharCode(255, 255, 255, 0)
    const pixelsToDraw = (digit === '0') ? 1 : 3

    for (let j = 0; j < pixelsToDraw; j++) {
      bmpData[offset++] = color
    }

    black = !black
  }

  const bmpHeader = _bmpHeader(offset - 1, 1)
  const bmpBuffer = Buffer.from(bmpHeader + bmpData.join(''), 'binary')
  return bmpBuffer.toString('base64')
}
