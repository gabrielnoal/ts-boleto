import crypto from 'crypto'

export function calculateLineChecksum (line: string): string {
  return crypto.createHash('sha1').update(line).digest('hex')
}

export function dateFromEdiDate (ediDate: string): Date {
  const year = ediDate.substring(4, 8)
  const month = ediDate.substring(2, 4)
  const day = ediDate.substring(0, 2)

  return new Date(parseInt(`20${year}`, 10), parseInt(month, 10) - 1, parseInt(day, 10))
}
