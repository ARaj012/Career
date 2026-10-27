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

const UNIT: [RegExp, number][] = [
  [/^(crores?|cr)\b/i, 10_000_000],
  [/^(lakhs?|lacs?|lpa|l\.p\.a\.?|l)\b/i, 100_000],
  [/^(thousand|k)\b/i, 1_000],
]

/** Every amount written in the quote, in rupees: 1,25,000 / 125000 / 1.25 lakh / 18.5 LPA / ₹2.1 Cr / 24 L. */
export function amountsIn(quote: string): number[] {
  const out: number[] = []
  for (const m of quote.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const n = parseFloat(m[0].replace(/,/g, ''))
    if (Number.isNaN(n)) continue
    const after = quote.slice(m.index! + m[0].length).replace(/^\s*/, '')
    const unit = UNIT.find(([re]) => re.test(after))
    out.push(unit ? Math.round(n * unit[1]) : n)
  }
  return out
}

/** The quote must contain exactly this amount (whole number, not a substring of a bigger one). */
export function quoteSupportsNumber(value: number, quote: string): boolean {
  return amountsIn(quote).includes(value)
}

export function isTentative(quote: string): boolean {
  return /tentative|expected|likely|provisional|subject to change/i.test(quote)
}
