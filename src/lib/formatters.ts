import * as ejs from 'ejs'
import moment from 'moment'

const escapeXML = ejs.escapeXML.bind(ejs)

export function capitalize (string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function addTrailingZeros (string: string | number, length: number): string {
  let s = string.toString()
  while (s.length < length) {
    s = `0${s}`
  }
  return s
}

export function formatAmount (amount: string | number): string {
  let amt = amount.toString()
  const cents = addTrailingZeros(amt.substring(amt.length - 2, amt.length), 2)
  const integers = addTrailingZeros(amt.substring(0, amt.length - 2), 1)

  let newIntegers = ''

  for (let i = 0; i < integers.length; i++) {
    if (i > 0 && (integers.length - i) % 3 === 0) newIntegers += '.'
    newIntegers += integers[i]
  }

  return `R$ ${newIntegers},${cents}`
}

export function formatDate (date: moment.MomentInput): string {
  return moment(date).format('DD/MM/YYYY')
}

export function mod11 (num: string, base?: number, r?: number): number | undefined {
  const b = base ?? 9
  const res = r ?? 0

  let soma = 0
  let fator = 2

  for (let i = num.length - 1; i >= 0; i--) {
    const parcial = parseInt(num[i], 10) * fator
    soma += parcial

    if (fator === b) {
      fator = 1
    }

    fator++
  }

  if (res === 0) {
    soma *= 10
    const digito = soma % 11
    return digito === 10 ? 0 : digito
  }
  if (res === 1) {
    return soma % 11
  }
  return undefined
}

export function mod10 (num: string): number {
  let total = 0
  let fator = 2

  for (let i = num.length - 1; i >= 0; i--) {
    const temp = (parseInt(num[i], 10) * fator).toString()
    let tempSum = 0
    for (let j = 0; j < temp.length; j++) {
      tempSum += parseInt(temp[j], 10)
    }
    total += tempSum
    fator = (fator === 2) ? 1 : 2
  }

  const resto = total % 10
  return (resto === 0) ? 0 : (10 - resto)
}

export function fatorVencimento (date: moment.MomentInput): string {
  const parsedDate = moment(date).utc().format('YYYY-MM-DD')
  const startDate = moment('1997-10-07').utc().format('YYYY-MM-DD')

  let factor = moment(parsedDate).diff(startDate, 'days')

  if (factor >= 10000) {
    factor = (factor % 10000) + 1000
  }

  return addTrailingZeros(factor, 4)
}

export function dateFromEdiDate (ediDate: string): Date {
  return new Date(
    parseInt(ediDate.substring(4, 8), 10),
    parseInt(ediDate.substring(2, 4), 10) - 1,
    parseInt(ediDate.substring(0, 2), 10)
  )
}

export function removeTrailingZeros (string: string): string {
  let s = string
  while (s.charAt(0) === '0') {
    s = s.substring(1, s.length)
  }
  return s
}

export function htmlString (str: string | undefined): string | undefined {
  return str ? escapeXML(str).replace(/\n/g, '<br/>') : str
}
