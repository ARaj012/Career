/**
 * Scholarship matcher: reads each scholarship's published eligibility text into
 * rules (who it is for, income ceiling, level, state, field) and checks a
 * student's answers against them. No AI — the same text always gives the same
 * answer, and it keeps working when the automation updates a scholarship's text.
 *
 * Where the text is vague ("varies by scheme", "within prescribed limit"), the
 * result is "check" with the reason, never a confident yes or no.
 */

export type Level = 'class_9_10' | 'class_11_12' | 'diploma' | 'ug' | 'pg' | 'phd'
export type Social = 'general' | 'ews' | 'obc' | 'sc' | 'st'
export type Field =
  | 'engineering' | 'medical' | 'science' | 'commerce' | 'arts'
  | 'management' | 'law' | 'performing_arts' | 'other'
export type Special = 'athlete' | 'artist' | 'capf_ward' | 'esm_ward' | 'orphan_or_martyr_ward' | 'single_girl'

export interface StudentAnswers {
  level?: Level
  state?: string
  social?: Social
  minority?: boolean
  gender?: 'female' | 'male' | 'other'
  /** Family income in lakh rupees a year */
  income?: number
  disability?: boolean
  field?: Field
  special?: Special[]
}

export interface ScholarshipLike {
  slug: string
  name: string
  level: string | null
  state: string | null
  category: string | null
  field_of_study: string[] | null
  eligibility_criteria: string | null
  application_deadline: string | null
}

export const LEVEL_LABEL: Record<Level, string> = {
  class_9_10: 'Class 9–10',
  class_11_12: 'Class 11–12',
  diploma: 'Diploma / polytechnic',
  ug: 'Undergraduate (or starting college)',
  pg: 'Postgraduate (Master’s)',
  phd: 'PhD / M.Phil',
}

export const SOCIAL_LABEL: Record<Social, string> = {
  general: 'General',
  ews: 'EWS',
  obc: 'OBC / BC',
  sc: 'SC',
  st: 'ST',
}

export const FIELD_LABEL: Record<Field, string> = {
  engineering: 'Engineering / Technology',
  medical: 'Medicine / Health',
  science: 'Science (B.Sc / M.Sc)',
  commerce: 'Commerce',
  arts: 'Arts / Humanities',
  management: 'Management',
  law: 'Law',
  performing_arts: 'Music, dance, theatre or visual arts',
  other: 'Something else',
}

export const SPECIAL_LABEL: Record<Special, string> = {
  athlete: 'I compete in a sport at state or national level',
  artist: 'I have trained in a classical or folk art for 5+ years',
  capf_ward: 'My parent serves / served in the CAPF or Assam Rifles',
  esm_ward: 'My parent is an ex-serviceman (Army, Navy, Air Force or Coast Guard), or I am a widow of one',
  orphan_or_martyr_ward: 'I am an orphan, lost a parent to COVID-19, or my parent was martyred in action',
  single_girl: 'I am the only child (a single girl child)',
}

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const NORTH_EAST = ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura']

type Group = Social | 'ebc' | 'minority' | 'disability' | 'other'

export interface Rules {
  levels: Level[]
  /** null = open to students from every state */
  states: string[] | null
  /** null = open to every social category */
  groups: { set: Group[]; others: string[]; soft: boolean } | null
  income:
    | { kind: 'limit'; min: number; max: number; soft: boolean; neverFail: boolean }
    | { kind: 'unknown' }
    | { kind: 'none' }
    | null
  female: boolean
  disability: boolean
  /** null = any field */
  fields: string[] | null
  special: Special | null
  /** Things the student must confirm themselves (marks, institution, age…) */
  conditions: string[]
  /** Good to know; does not affect the result */
  notes: string[]
}

const clauses = (t: string) => t.split(/;|\.\s/).map((c) => c.trim()).filter(Boolean)

function parseLevels(s: ScholarshipLike, text: string): Level[] {
  const out = new Set<Level>()
  for (const raw of (s.level ?? '').split(',').map((x) => x.trim())) {
    if (raw === 'school') { out.add('class_9_10'); out.add('class_11_12') }
    if (raw === 'class_11_12') out.add('class_11_12')
    if (raw === 'undergraduate') out.add('ug')
    if (raw === 'postgraduate') out.add('pg')
    if (raw === 'diploma') out.add('diploma')
    if (raw === 'phd') out.add('phd')
  }
  if (/class 9/i.test(text)) { out.add('class_9_10'); out.add('class_11_12') }
  if (/class 11|post-matric/i.test(text)) out.add('class_11_12')
  if (/ph\.?\s?d\b|m\.phil/i.test(text) && out.has('pg')) out.add('phd')
  return [...out]
}

function parseGroups(text: string): Rules['groups'] {
  const parts: string[] = []
  for (const c of clauses(text)) {
    const at = c.search(/belong/i)
    if (at >= 0) parts.push(c.slice(at))
    else if (/qualifying under scheduled tribe/i.test(c)) parts.push(c)
  }
  if (!parts.length) return null
  const t = parts.join(' ')
  const set = new Set<Group>()
  const others: string[] = []
  if (/\bSC\b|scheduled caste|adi dravidar/i.test(t)) set.add('sc')
  if (/\bST\b|scheduled tribe/i.test(t)) set.add('st')
  if (/\bOBC\b|\bBC\b|\bSEBC\b|\bSBC\b/.test(t)) set.add('obc')
  if (/\bEBC\b/.test(t)) set.add('ebc')
  if (/\bEWS\b/.test(t)) set.add('ews')
  if (/general/i.test(t)) set.add('general')
  if (/minority/i.test(t)) set.add('minority')
  if (/disab|differently abled|\bPCP\b/i.test(t)) set.add('disability')
  for (const [re, name] of [
    [/\bDNT\b/, 'DNT (denotified tribes)'],
    [/\bVJNT\b/, 'VJNT'],
    [/\bkapu\b/i, 'Kapu'],
    [/landless agricultural labourer/i, 'landless agricultural labourers'],
    [/traditional artisan/i, 'traditional artisans'],
  ] as const) if (re.test(t)) { set.add('other'); others.push(name) }
  if (!set.size) return null
  // "(scheme-dependent)" or "… or belonging to SC/ST for the post-matric schemes": other routes exist
  const soft = /scheme-dependent|\bor belong/i.test(t) || /largely qualifying/i.test(t)
  return { set: [...set], others, soft }
}

function parseIncome(text: string): Rules['income'] {
  const parts = clauses(text).filter((c) => /income/i.test(c))
  if (!parts.length) return null
  const t = parts.join('; ')
  const values: number[] = []
  const re = /(loans? up to\s*)?₹\s?(\d+(?:\.\d+)?)(?:\s*[-–]\s*(\d+(?:\.\d+)?))?\s*lakh/gi
  for (const m of t.matchAll(re)) {
    if (m[1]) continue // a loan amount, not an income ceiling
    values.push(Number(m[2]))
    if (m[3]) values.push(Number(m[3]))
  }
  if (!values.length) return /no income ceiling/i.test(t) ? { kind: 'none' } : { kind: 'unknown' }
  const neverFail = /no (income )?ceiling|higher income bands/i.test(t)
  const soft = neverFail || values.length > 1 ||
    /around|vary|varies|category-specific|subject to|lower for|scheme|between|typically|merit-cum-means category/i.test(t)
  return { kind: 'limit', min: Math.min(...values), max: Math.max(...values), soft, neverFail }
}

function parseConditions(text: string): { conditions: string[]; notes: string[] } {
  const conditions: string[] = []
  const notes: string[] = []
  if (/top \d+(\.\d+)?%|top 20 percentile|top \d+th percentile|top rank/i.test(text))
    conditions.push('Needs top marks in your Class 12 board (or a top national rank)')
  if (/entrance test|\(YET\)/i.test(text)) conditions.push('You must qualify the scheme’s own entrance test')
  if (/top-class institution|premier institution|quality higher education institutions|IISc, an IIT/i.test(text))
    conditions.push('Only for students admitted to the institutes on the scheme’s list')
  if (/foreign university/i.test(text)) conditions.push('Only after admission to a top-ranked foreign university')
  if (/first year/i.test(text)) conditions.push('Only in the first year of your course')
  if (/outside the home state/i.test(text)) conditions.push('Only if you study outside your home state')
  if (/selection is through|interview or performance|talent hunt/i.test(text))
    conditions.push('Selection is by interview, performance or trials')
  // Exam- and institute-linked awards: "must have qualified the GATE …", "only for students admitted to an IIT …"
  const exam = text.match(/must have (qualified|cleared|passed|secured)\s+([^;]+?)(?=;|\.\s|\.?$)/i)
  if (exam) conditions.push(`Only after you have ${exam[1].toLowerCase()} ${exam[2]}`)
  const inst = text.match(/only for students (admitted to|of) ([^;]+?)(?=;|\.\s|\.?$)/i)
  if (inst) conditions.push(`Only for students ${inst[1].toLowerCase()} ${inst[2]}`)
  const marks = text.match(/(?:minimum|at least)\s+(\d+)%\s+marks/i)
  if (marks) conditions.push(`Needs at least ${marks[1]}% marks in your last exam`)
  const age =
    text.match(/aged?\s+(?:between\s+)?(\d+)\s*(?:-|–|and|to)\s*(\d+)\s*years/i) ??
    text.match(/age\s+(\d+)\s*-\s*(\d+)\s*years/i)
  if (age) conditions.push(`Age ${age[1]}–${age[2]} years`)
  const below = text.match(/age below (\d+)|up to (\d+) years of age/i)
  if (below) conditions.push(`Age under ${below[1] ?? below[2]}`)
  if (/75% attendance/i.test(text)) notes.push('Needs at least 75% attendance')
  if (/not availing|not receiving any other|not be receiving any other|only one government scholarship/i.test(text))
    notes.push('Cannot be combined with another government scholarship for the same course')
  return { conditions, notes }
}

function parseSpecial(s: ScholarshipLike, text: string): Special | null {
  if (/single girl child/i.test(text)) return 'single_girl'
  if (/orphan|lost one or both parents|martyred/i.test(text)) return 'orphan_or_martyr_ward'
  if (/ward or widow of CAPF/i.test(text)) return 'capf_ward'
  if (/ex-servicem[ae]n/i.test(text)) return 'esm_ward'
  if (s.category === 'sports' || /\bathlete/i.test(text)) return 'athlete'
  if (s.category === 'arts' || /training with a guru/i.test(text)) return 'artist'
  return null
}

export function parseRules(s: ScholarshipLike): Rules {
  const text = s.eligibility_criteria ?? ''
  const state = s.state?.trim()
  const states = /north eastern state/i.test(text)
    ? NORTH_EAST
    : !state || /^all/i.test(state) ? null : [state]
  const fields = (s.field_of_study ?? []).filter(Boolean)
  const { conditions, notes } = parseConditions(text)
  return {
    levels: parseLevels(s, text),
    states,
    groups: parseGroups(text),
    income: parseIncome(text),
    female: /female candidate|must be a (single )?girl\b|(?<!reserved for )\bgirl students?\b/i.test(text),
    disability: /benchmark disability/i.test(text),
    fields: !fields.length || fields.some((f) => /^all /i.test(f)) ? null : fields,
    special: parseSpecial(s, text),
    conditions,
    notes,
  }
}

const FIELD_MATCH: Record<Field, RegExp> = {
  engineering: /engineering|technolog|technical/i,
  medical: /medic/i,
  science: /science|physics|chemistry|mathematics|biology/i,
  commerce: /commerce/i,
  arts: /\barts\b|humanities/i,
  management: /management/i,
  law: /\blaw\b/i,
  performing_arts: /music|dance|theatre|mime|arts/i,
  other: /$^/,
}

const GROUP_NAME: Record<Group, string> = {
  general: 'General', ews: 'EWS', obc: 'OBC/BC', sc: 'SC', st: 'ST', ebc: 'EBC',
  minority: 'minority-community', disability: 'disabled', other: 'other listed',
}

const lakh = (n: number) => `₹${n % 1 ? n.toFixed(1) : n} lakh`

export type Status = 'eligible' | 'check' | 'no'
export interface Verdict {
  status: Status
  /** What the student meets, in plain words */
  met: string[]
  /** What they must confirm themselves */
  check: string[]
  /** Why they cannot apply */
  fails: string[]
  notes: string[]
  /** The last deadline has passed; it usually reopens next cycle */
  closed: boolean
}

export function matchScholarship(s: ScholarshipLike, a: StudentAnswers, now = new Date()): Verdict {
  const r = parseRules(s)
  const met: string[] = []
  const check: string[] = []
  const fails: string[] = []

  // Level of study
  if (r.levels.length) {
    const names = r.levels.map((l) => LEVEL_LABEL[l].replace(/ \(.*\)/, ''))
    if (!a.level) check.push(`For ${names.join(', ')} students`)
    else if (r.levels.includes(a.level)) met.push(`Open to ${LEVEL_LABEL[a.level].replace(/ \(.*\)/, '')} students`)
    else fails.push(`Only for ${names.join(', ')} students`)
  }

  // State of domicile
  if (r.states) {
    const where = r.states.length > 3 ? 'the North-Eastern states' : r.states.join(', ')
    if (!a.state) check.push(`Only for students domiciled in ${where}`)
    else if (r.states.includes(a.state)) met.push(`For students from ${a.state}`)
    else fails.push(`Only for students domiciled in ${where}`)
  }

  // Social category
  if (r.groups) {
    const set = r.groups.set
    const listed = [...set.filter((g) => g !== 'other').map((g) => GROUP_NAME[g]), ...r.groups.others]
    const who = `Only for ${listed.join(', ')} students`
    if (a.social && set.includes(a.social)) met.push(`For ${SOCIAL_LABEL[a.social]} students`)
    else if (a.minority && set.includes('minority')) met.push('For minority-community students')
    else if (a.disability && set.includes('disability')) met.push('For students with a disability')
    else if (!a.social) check.push(who)
    else if (set.includes('ebc') && (a.social === 'general' || a.social === 'ews'))
      check.push('Open to EBC students (general category with low family income) — confirm on the portal')
    else if (set.includes('ebc') && a.social === 'obc')
      check.push('Open to EBC students — some states (e.g. Bihar) list EBC separately from OBC/BC; confirm your caste is on the EBC list')
    else if (set.includes('other') || r.groups.soft) check.push(`${who} — other routes may exist, confirm on the portal`)
    else fails.push(who)
  }

  // Family income
  if (r.income?.kind === 'limit') {
    const { min, max, soft, neverFail } = r.income
    const limit = min === max ? `up to ${lakh(max)}` : `up to ${lakh(min)}–${lakh(max)} (depends on the scheme)`
    if (a.income === undefined) check.push(`Family income ${limit} a year`)
    else if (a.income <= min) met.push(`Family income within ${lakh(min)} a year`)
    else if (a.income <= max && soft) check.push(`Family income ${limit} — confirm the ceiling for your category`)
    else if (a.income <= max) met.push(`Family income within ${lakh(max)} a year`)
    else if (neverFail) check.push(`The full benefit is for family income ${limit}; above that it may be partial`)
    else fails.push(`Family income must be ${limit} a year`)
  } else if (r.income?.kind === 'unknown') {
    check.push('A family-income ceiling applies — check the limit on the official portal')
  } else if (r.income?.kind === 'none') {
    met.push('No family-income ceiling')
  }

  if (r.female) {
    if (!a.gender) check.push('Only for girls / women')
    else if (a.gender === 'female') met.push('For girls / women')
    else fails.push('Only for girls / women')
  }

  if (r.disability) {
    if (a.disability === undefined) check.push('Only for students with a benchmark disability (40% or more)')
    else if (a.disability) met.push('For students with a benchmark disability')
    else fails.push('Only for students with a benchmark disability (40% or more)')
  }

  if (r.fields) {
    const list = r.fields.join(', ')
    if (!a.field) check.push(`Only for these fields: ${list}`)
    else if (r.fields.some((f) => FIELD_MATCH[a.field!].test(f))) met.push(`Covers ${FIELD_LABEL[a.field]}`)
    else fails.push(`Only for these fields: ${list}`)
  }

  if (r.special) {
    if (a.special?.includes(r.special)) met.push(SPECIAL_LABEL[r.special])
    else fails.push(`Only for students who can say: “${SPECIAL_LABEL[r.special]}”`)
  }

  check.push(...r.conditions)
  const deadline = s.application_deadline ? new Date(s.application_deadline) : null
  const closed = !!deadline && deadline.getTime() < now.getTime()

  return {
    status: fails.length ? 'no' : check.length ? 'check' : 'eligible',
    met, check, fails, notes: r.notes, closed,
  }
}

/** Profile values → matcher answers (only what the profile actually says). */
export function answersFromProfile(p: {
  class_level?: string | null
  current_education?: string | null
  stream?: string | null
  belonging_state?: string | null
  class12_state?: string | null
  state?: string | null
}): StudentAnswers {
  const out: StudentAnswers = {}
  const ed = `${p.current_education ?? ''} ${p.class_level ?? ''}`
  if (/phd/i.test(ed)) out.level = 'phd'
  else if (/m\.tech|mba|m\.sc|\bma\b|master/i.test(ed)) out.level = 'pg'
  else if (/b\.tech|b\.e|b\.sc|b\.com|bba|\bba\b|mbbs|b\.arch|llb/i.test(ed)) out.level = 'ug'
  else if (/diploma/i.test(ed)) out.level = 'diploma'
  else if (/class 1[12]/i.test(ed)) out.level = 'class_11_12'
  else if (/class (9|10)/i.test(ed)) out.level = 'class_9_10'
  const state = p.belonging_state || p.class12_state || p.state
  if (state && STATES.includes(state)) out.state = state
  const st = `${p.stream ?? ''} ${ed}`
  if (/pcm|b\.tech|b\.e\b|m\.tech/i.test(st)) out.field = 'engineering'
  else if (/pcb|mbbs/i.test(st)) out.field = 'medical'
  else if (/commerce|b\.com/i.test(st)) out.field = 'commerce'
  else if (/\barts\b|humanities|\bba\b|\bma\b/i.test(st)) out.field = 'arts'
  else if (/bba|mba/i.test(st)) out.field = 'management'
  else if (/llb|law/i.test(st)) out.field = 'law'
  else if (/science|b\.sc|m\.sc/i.test(st)) out.field = 'science'
  out.special = []
  return out
}

/** "₹12,000–₹20,000 a year", "₹16,000–₹18,000 a month", "Loan of ₹1–10 lakh" */
/**
 * The amount in the words students use: "₹4,000 a month", "₹12,000–₹20,000 a year".
 * Awards with no single figure (fee waivers) fall back to the first phrase of amount_note.
 */
const LEVEL_WORD: Record<string, string> = {
  school: 'School', class_11_12: 'Class 11–12', undergraduate: 'Undergraduate',
  postgraduate: 'Postgraduate', diploma: 'Diploma', phd: 'PhD',
}

/** "class_11_12,undergraduate" -> "Class 11–12, Undergraduate" */
export function scholarshipLevelLabel(level: string | null | undefined): string {
  return (level ?? '').split(',').map((l) => l.trim()).filter(Boolean)
    .map((l) => LEVEL_WORD[l] ?? l.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')
}

export function formatScholarshipAmount(s: {
  amount_min: number | string | null; amount_max: number | string | null; amount_type: string | null; amount_note?: string | null
}): string {
  const min = s.amount_min == null ? null : Number(s.amount_min)
  const max = s.amount_max == null ? null : Number(s.amount_max)
  const fmt = (n: number) => (n >= 100000 ? `₹${+(n / 100000).toFixed(2)} lakh` : `₹${n.toLocaleString('en-IN')}`)
  const range = min && max && min !== max ? `${fmt(min)}–${fmt(max)}` : max ? fmt(max) : min ? fmt(min) : null
  // first phrase of the note: up to ":", "(", ";", ", " or ". " (not the comma inside ₹15,400)
  if (!range) return s.amount_note?.split(/[:(;]|,\s|\.\s/)[0].trim() || 'Amount set by the scheme'
  switch (s.amount_type) {
    case 'loan': return `Loan of ${range}`
    case 'monthly': return `${range} a month`
    case 'stipend': return `${range} a month (stipend)`
    case 'annual': return `${range} a year`
    default: return range
  }
}
