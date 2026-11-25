/**
 * Polite page fetcher for official websites.
 *
 * - Honours robots.txt (User-agent: *)
 * - Waits between requests to the same host
 * - Converts HTML (tables included) and PDFs to plain text
 * - Finds links to notices / bulletins / schedules on the page
 *
 * Nothing in here ever invents data: a failed fetch returns an error,
 * never a fallback value.
 */
import * as cheerio from 'cheerio'

type Doc = ReturnType<typeof cheerio.load>
import { createHash, X509Certificate } from 'node:crypto'
import * as tls from 'node:tls'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com'
export const USER_AGENT = `Mozilla/5.0 (compatible; SnovaBot/2.0; +${APP_URL})`

const PER_HOST_DELAY_MS = 2500
const TIMEOUT_MS = 30_000
const MAX_BYTES = 8 * 1024 * 1024

export type FetchedPage = {
  url: string
  finalUrl: string
  status: number
  kind: 'html' | 'pdf' | 'other'
  text: string
  hash: string
  links: { url: string; text: string }[]
}

export class FetchError extends Error {
  constructor(public url: string, message: string, public status?: number) {
    super(`${message} (${url})`)
  }
}

const lastHit = new Map<string, number>()
const robotsCache = new Map<string, RobotRule[]>()

async function throttle(host: string) {
  const prev = lastHit.get(host) ?? 0
  const wait = prev + PER_HOST_DELAY_MS - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastHit.set(host, Date.now())
}

async function rawFetch(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/pdf;q=0.9,*/*;q=0.5' },
    })
  } finally {
    clearTimeout(timer)
  }
}

type RobotRule = { allow: boolean; pattern: string; re: RegExp }

/** Parse robots.txt (RFC 9309): groups of User-agent lines, Allow/Disallow with * and $. */
export function parseRobots(txt: string, agent = 'snovabot'): RobotRule[] {
  const groups: { agents: string[]; rules: RobotRule[] }[] = []
  let current: { agents: string[]; rules: RobotRule[] } | null = null
  let lastWasAgent = false
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const val = line.slice(idx + 1).trim()
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current) }
      current.agents.push(val.toLowerCase())
      lastWasAgent = true
      continue
    }
    lastWasAgent = false
    if (!current || (key !== 'allow' && key !== 'disallow')) continue
    if (!val) continue // "Disallow:" (empty) allows everything
    const anchored = val.endsWith('$')
    const body = (anchored ? val.slice(0, -1) : val).replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
    current.rules.push({ allow: key === 'allow', pattern: val, re: new RegExp(`^${body}${anchored ? '$' : ''}`) })
  }
  const specific = groups.filter((g) => g.agents.some((a) => a !== '*' && agent.includes(a)))
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes('*'))
  return chosen.flatMap((g) => g.rules)
}

/** Longest matching rule wins; Allow wins ties. No matching rule = allowed. */
export function robotsAllows(rules: RobotRule[], path: string): boolean {
  let best: RobotRule | null = null
  for (const r of rules) {
    if (!r.re.test(path)) continue
    if (!best || r.pattern.length > best.pattern.length || (r.pattern.length === best.pattern.length && r.allow)) best = r
  }
  return !best || best.allow
}

async function isAllowed(url: URL): Promise<boolean> {
  const origin = url.origin
  if (!robotsCache.has(origin)) {
    let rules: RobotRule[] = []
    try {
      const res = await rawFetch(`${origin}/robots.txt`)
      if (res.ok) rules = parseRobots(await res.text())
    } catch {
      rules = [] // unreachable robots.txt = no rules
    }
    robotsCache.set(origin, rules)
  }
  return robotsAllows(robotsCache.get(origin)!, url.pathname + url.search)
}

const netCode = (err: unknown) => (err as { cause?: { code?: string } })?.cause?.code

// Node 22.15+/24 (not yet in @types/node 20)
const tlsCa = tls as typeof tls & {
  getCACertificates?: (type?: 'default') => string[]
  setDefaultCACertificates?: (certs: string[]) => void
}
const aiaTried = new Set<string>()

/**
 * Many Indian government sites send their certificate without the
 * intermediate CA. Browsers download it from the "CA Issuers" URL inside the
 * certificate (AIA); Node does not. We do the same: fetch it, check that it
 * really issued the site's certificate and is a CA, and add it to this
 * process's CA list. The chain must still end at a trusted root, so expired,
 * self-signed or untrusted certificates are still rejected.
 */
async function addMissingIntermediate(host: string): Promise<boolean> {
  if (aiaTried.has(host) || !tlsCa.setDefaultCACertificates || !tlsCa.getCACertificates) return false
  aiaTried.add(host)
  // Only reads the presented certificate; the socket is closed without sending a request
  const leaf = await new Promise<tls.DetailedPeerCertificate | null>((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate(true)
      socket.end()
      resolve(cert?.raw ? cert : null)
    })
    socket.setTimeout(15_000, () => { socket.destroy(); resolve(null) })
    socket.on('error', () => resolve(null))
  })
  const issuerUrl = leaf?.infoAccess?.['CA Issuers - URI']?.[0]
  if (!leaf || !issuerUrl) return false
  try {
    const res = await fetch(issuerUrl, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return false
    const issuer = new X509Certificate(Buffer.from(await res.arrayBuffer()))
    if (!issuer.ca || !new X509Certificate(leaf.raw).checkIssued(issuer)) return false
    tlsCa.setDefaultCACertificates([...tlsCa.getCACertificates('default'), issuer.toString()])
    return true
  } catch {
    return false
  }
}

/** Hosts along the redirect path; the TLS error may come from a redirect target (bitsadmission.com → admissions.bits-pilani.ac.in). */
async function redirectHosts(url: string): Promise<string[]> {
  const hosts: string[] = []
  let next: string | null = url
  for (let hop = 0; next && hop < 5; hop++) {
    const u: URL = new URL(next)
    hosts.push(u.hostname)
    try {
      const res: Response = await fetch(u, { redirect: 'manual', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(15_000) })
      const loc = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null
      next = loc ? new URL(loc, u).toString() : null
    } catch {
      break // this hop is the one failing
    }
  }
  return [...new Set(hosts)]
}

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await rawFetch(url)
      if (res.status >= 500 || res.status === 429) throw new FetchError(url, `HTTP ${res.status}`, res.status)
      return res
    } catch (err) {
      lastErr = err
      if (/UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT/.test(netCode(err) ?? '')) {
        let fixed = false
        for (const h of (await redirectHosts(url)).reverse()) if (await addMissingIntermediate(h)) fixed = true
        if (fixed) { i--; continue } // once per host (aiaTried), so this cannot loop
      }
      // Certificate errors and missing domains do not fix themselves on retry
      if (/CERT|UNABLE_TO|SELF_SIGNED/.test(netCode(err) ?? '') || netCode(err) === 'ENOTFOUND') break
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
    }
  }
  if (lastErr instanceof FetchError) throw lastErr
  const code = netCode(lastErr)
  const reason =
    code === 'ENOTFOUND' ? 'domain not found'
    : code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ? 'site sends an incomplete HTTPS certificate chain'
    : code ? `connection failed: ${code}`
    : (lastErr as Error)?.message ?? String(lastErr)
  throw new FetchError(url, reason)
}

export function htmlToText($: Doc): string {
  $('script, style, noscript, svg, iframe, form, [aria-hidden="true"]').remove()
  // Struck-out text is a superseded value (GATE 2027: "<del>14th August 2026</del> 2nd September 2026")
  $('del, s, strike, [style*="line-through"]').remove()
  // Keep table rows on one line so "Event | Date" pairs stay together
  $('tr').each((_, tr) => {
    const cells = $(tr)
      .find('th, td')
      .map((__, c) => $(c).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean)
    $(tr).replaceWith(`\n${cells.join(' | ')}\n`)
  })
  $('br').replaceWith('\n')
  $('p, div, li, h1, h2, h3, h4, h5, h6, section, article, marquee').each((_, el) => {
    $(el).append('\n')
  })
  return $.root()
    .text()
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

const LINK_HINT =
  /(important\s*dates|schedule|calendar|notice|bulletin|brochure|notification|advertisement|information|key\s*dates|admission|apply|ranking|scholarship|guideline)/i

const GENERIC_LINK = /^(read\s*more|more|click\s*here|here|view|view\s*details|details|download|open|link|pdf|new)?\W*$/i

function collectLinks($: Doc, base: string) {
  const out: { url: string; text: string }[] = []
  const seen = new Set<string>()
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href') || ''
    let text = $(a).text().replace(/\s+/g, ' ').trim()
    // "Read More" / "Click here": the notice title is in the surrounding row/item
    if (GENERIC_LINK.test(text)) {
      const around = $(a).closest('li, tr, p, td, .views-row, div').first().text().replace(/\s+/g, ' ').trim()
      if (around.length > text.length && around.length <= 400) text = around
    }
    text = text.slice(0, 200)
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return
    let abs: string
    try {
      abs = new URL(href, base).toString()
    } catch {
      return
    }
    if (seen.has(abs)) return
    seen.add(abs)
    out.push({ url: abs, text })
  })
  return out
}

type PdfItem = { str: string; transform: number[] }

/**
 * Rebuild lines from text positions: words on the same baseline form one line.
 * Plain extraction gives one word per line for many government PDFs (often
 * scanned/rotated pages), which splits "24th October 2026" apart and hides
 * table rows from the reader. Coordinates are first turned into the page's
 * reading direction, so rotated pages work too.
 */
export function itemsToLines(items: PdfItem[]): string {
  const words = items.filter((it) => it.str?.trim())
  if (!words.length) return ''
  // Dominant text direction on this page (unit vector along a line)
  let dx = 0
  let dy = 0
  for (const it of words) {
    const [a, b] = it.transform
    const n = Math.hypot(a, b) || 1
    dx += a / n
    dy += b / n
  }
  const len = Math.hypot(dx, dy) || 1
  const [ux, uy] = [dx / len, dy / len]

  const rows: { pos: number; parts: { at: number; s: string }[] }[] = []
  for (const it of words) {
    const [x, y] = [it.transform[4], it.transform[5]]
    const at = x * ux + y * uy // position along the line
    const pos = -x * uy + y * ux // which line (larger = higher on the page)
    let row = rows.find((r) => Math.abs(r.pos - pos) < 2)
    if (!row) rows.push((row = { pos, parts: [] }))
    row.parts.push({ at, s: it.str })
  }
  return rows
    .sort((a, b) => b.pos - a.pos)
    .map((r) => r.parts.sort((a, b) => a.at - b.at).map((p) => p.s).join(' ').replace(/\s+/g, ' ').trim())
    .join('\n')
}

async function pdfToText(buf: ArrayBuffer): Promise<string> {
  const { getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(buf))
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent()
    pages.push(itemsToLines(content.items as PdfItem[]))
  }
  return pages.join('\n')
}

export async function fetchPage(url: string): Promise<FetchedPage> {
  const parsed = new URL(url)
  if (!(await isAllowed(parsed))) throw new FetchError(url, 'Blocked by robots.txt')
  await throttle(parsed.host)

  const res = await fetchWithRetry(url)
  if (!res.ok) throw new FetchError(url, `HTTP ${res.status}`, res.status)

  const type = res.headers.get('content-type') || ''
  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_BYTES) throw new FetchError(url, 'Response too large')

  let kind: FetchedPage['kind'] = 'other'
  let text = ''
  let links: FetchedPage['links'] = []

  if (type.includes('pdf') || /\.pdf($|\?)/i.test(res.url)) {
    kind = 'pdf'
    text = await pdfToText(buf)
  } else if (type.includes('html') || type === '') {
    kind = 'html'
    const $ = cheerio.load(new TextDecoder('utf-8').decode(buf))
    links = collectLinks($, res.url)
    text = htmlToText($)
  } else {
    text = new TextDecoder('utf-8').decode(buf)
  }

  return {
    url,
    finalUrl: res.url,
    status: res.status,
    kind,
    text,
    hash: createHash('sha256').update(text).digest('hex'),
    links,
  }
}

/**
 * Names that identify one record's links on a shared notice board (e.g. nta.ac.in).
 * `ownHost`: a site that belongs to this record alone (cuet.nta.nic.in), where a plain
 * "Syllabus" link is about this record even though it does not name it.
 */
export type LinkFocus = { strong: RegExp; weak?: RegExp; ownHost?: string }

/** The path of a link, so "/cuetug-2026-syllabus/" can name the exam as link text does. */
function linkPath(url: string): string {
  try { return decodeURIComponent(new URL(url).pathname) } catch { return '' }
}

/**
 * Links on a page that are likely to contain dates / notices, best first.
 * With `focus`, notices naming this record win and, once any link names it,
 * notices about other records are pushed below the threshold.
 */
export function relevantLinks(page: FetchedPage, max = 4, hint: RegExp = LINK_HINT, focus?: LinkFocus): string[] {
  const year = new Date().getFullYear()
  const years = [String(year), String(year + 1)]
  const host = new URL(page.finalUrl).host.replace(/^www\./, '')
  const names = (t: string) => !!focus && (focus.strong.test(t) || !!focus.weak?.test(t))
  // On the record's own site every link is about it; elsewhere, once a link names it, others are pushed down
  const ownSite = !!focus?.ownHost && host === focus.ownHost
  const focused = !ownSite && page.links.some((l) => names(l.text))
  return page.links
    .map((l) => {
      let score = 0
      const blob = `${l.text} ${l.url}`
      if (focus?.strong.test(l.text)) score += 5
      else if (focus?.weak?.test(l.text)) score += 3
      else if (focus?.strong.test(linkPath(l.url))) score += 4
      else if (focused) score -= 4
      if (hint.test(blob)) score += 3
      if (l.text.includes(String(year + 1))) score += 3 // the upcoming cycle's notice beats last cycle's
      if (years.some((y) => blob.includes(y))) score += 2
      if (/\.pdf($|\?)/i.test(l.url)) score += 1
      let sameSite = false
      try {
        const h = new URL(l.url).host.replace(/^www\./, '')
        sameSite = h === host || h.endsWith(`.${host}`) || host.endsWith(`.${h}`)
      } catch {}
      if (!sameSite) score -= 5 // never wander off the official site
      return { url: l.url, score }
    })
    .filter((l) => l.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((l) => l.url)
}

const DATE_LINE =
  /(\b\d{1,2}(st|nd|rd|th)?[\s.\-/]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b)|(\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b)|(\b\d{1,2}[./-]\d{1,2}[./-]20\d\d\b)|(\b20\d\d-\d{2}-\d{2}\b)/i

/**
 * Keep only lines that mention dates or the given keywords (plus a little
 * context). Cuts AI token use by ~90% on large pages.
 */
export function focusText(text: string, keywords: RegExp, maxChars = 7000): string {
  const lines = text.split('\n')
  const keep = new Set<number>()
  lines.forEach((line, i) => {
    if (DATE_LINE.test(line) || keywords.test(line)) {
      for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) keep.add(j)
    }
  })
  let out = ''
  for (const i of [...keep].sort((a, b) => a - b)) {
    const line = lines[i].trim()
    if (!line) continue
    if (out.length + line.length + 1 > maxChars) break
    out += line + '\n'
  }
  return out
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}
