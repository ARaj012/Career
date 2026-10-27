/**
 * Evidence checks. The AI is only allowed to *read* pages; it must return
 * the exact sentence each value came from. These functions reject any value
 * whose quote is not actually on the page, or whose quote does not contain
 * that value. This is what stops invented data reaching the database.
 */

const MONTHS = [
  ['january', 'jan'], ['february', 'feb'], ['march', 'mar'], ['april', 'apr'],
  ['may', 'may'], ['june', 'jun'], ['july', 'jul'], ['august', 'aug'],
  ['september', 'sep', 'sept'], ['october', 'oct'], ['november', 'nov'], ['december', 'dec'],
]

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Quote must be on the page (whitespace/punctuation-insensitive). */
export function quoteOnPage(quote: string | null | undefined, pageNormalized: string): boolean {
  if (!quote) return false
  const q = normalize(quote)
  if (q.length < 6) return false
  return pageNormalized.includes(q)
}

/** The quote must mention the day and month of the ISO date. */
export function quoteSupportsDate(iso: string, quote: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return false
  const [, y, mm, dd] = m
  const day = String(Number(dd))
  const month = Number(mm)
  const q = ` ${normalize(quote)} `
  const tokens = q.split(' ')

  // Numeric forms: 20.01.2027, 20/01/27, 2027-01-20
  const numeric = new RegExp(
    `(^|\\D)0?${day}[./-]0?${month}[./-](${y}|${y.slice(2)})(\\D|$)|${y}[./-]0?${month}[./-]0?${day}(\\D|$)`
  )
  if (numeric.test(quote)) return true

  const hasMonth = MONTHS[month - 1].some((name) => tokens.includes(name))
  if (!hasMonth) return false
  // day as a standalone number, or with ordinal suffix (normalize keeps "20th")
  return tokens.some((t) => t === day || t === dd || t === `${day}st` || t === `${day}nd` || t === `${day}rd` || t === `${day}th`)
}

/** The quote must contain the number (₹1,25,000 / 125000 / 1.25 lakh). */
export function quoteSupportsNumber(value: number, quote: string): boolean {
  const digits = quote.replace(/[,\s]/g, '')
  if (digits.includes(String(value))) return true
  const lakh = /(\d+(?:\.\d+)?)\s*(lakh|lac)/i.exec(quote)
  if (lakh && Math.round(parseFloat(lakh[1]) * 100000) === value) return true
  const crore = /(\d+(?:\.\d+)?)\s*crore/i.exec(quote)
  if (crore && Math.round(parseFloat(crore[1]) * 10000000) === value) return true
  return false
}

export function isTentative(quote: string): boolean {
  return /tentative|expected|likely|provisional|subject to change/i.test(quote)
}
