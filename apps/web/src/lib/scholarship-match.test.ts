import { describe, expect, it } from 'vitest'
import { answersFromProfile, formatScholarshipAmount, matchScholarship, parseRules, scholarshipLevelLabel, type ScholarshipLike } from './scholarship-match'

const base = (over: Partial<ScholarshipLike>): ScholarshipLike => ({
  slug: 's', name: 'S', level: 'undergraduate,postgraduate,diploma', state: 'All States', category: 'government',
  field_of_study: ['All Streams'], eligibility_criteria: '', application_deadline: null, ...over,
})

const scSchool = base({
  eligibility_criteria: 'Student must belong to Scheduled Caste (SC); studying in Class 11 onwards including UG, PG, diploma and professional courses; family income up to ₹2.5 lakh per annum.',
})

describe('parseRules', () => {
  it('reads who a scheme is for, its income ceiling and levels', () => {
    const r = parseRules(scSchool)
    expect(r.groups?.set).toEqual(['sc'])
    expect(r.income).toMatchObject({ kind: 'limit', min: 2.5, max: 2.5, soft: false })
    expect(r.levels).toContain('class_11_12')
    expect(r.states).toBeNull()
  })

  it('does not treat a loan amount or a reservation note as eligibility', () => {
    const loan = parseRules(base({ eligibility_criteria: 'full interest subvention applies for family income up to ₹4.5 lakh per annum on loans up to ₹10 lakh, with partial subsidy for higher income bands.' }))
    expect(loan.income).toMatchObject({ max: 4.5, neverFail: true })
    const girls = parseRules(base({ eligibility_criteria: 'Student belongs to a notified minority community; family income up to ₹2 lakh per annum; 30% of seats reserved for girl students.' }))
    expect(girls.female).toBe(false)
    expect(girls.groups?.set).toEqual(['minority'])
  })

  it('keeps several ceilings as a range', () => {
    const r = parseRules(base({ eligibility_criteria: 'Student must be a domicile of Rajasthan and belong to SC/ST/OBC/EBC category; family income ceiling around ₹2.5 lakh for SC/ST and ₹1 lakh for OBC/EBC categories.' }))
    expect(r.income).toMatchObject({ min: 1, max: 2.5, soft: true })
  })

  it('reads a North-East domicile rule from the text', () => {
    const r = parseRules(base({ eligibility_criteria: 'Student is a domicile of a North Eastern state (Assam, Manipur); pursuing a general degree course at a college outside the home state.' }))
    expect(r.states).toContain('Assam')
    expect(r.conditions).toContain('Only if you study outside your home state')
  })
})

describe('matchScholarship', () => {
  it('says eligible only when every rule is met', () => {
    const v = matchScholarship(scSchool, { level: 'ug', social: 'sc', income: 2 })
    expect(v.status).toBe('eligible')
    expect(v.met.length).toBeGreaterThan(1)
  })

  it('says no, with the reason, when a hard rule fails', () => {
    const v = matchScholarship(scSchool, { level: 'ug', social: 'general', income: 2 })
    expect(v.status).toBe('no')
    expect(v.fails[0]).toMatch(/Only for SC/)
    expect(matchScholarship(scSchool, { level: 'ug', social: 'sc', income: 4 }).status).toBe('no')
  })

  it('asks the student to check what it cannot confirm', () => {
    expect(matchScholarship(scSchool, { level: 'ug' }).status).toBe('check')
    const soft = base({ state: 'Goa', eligibility_criteria: 'Student must be a domicile of Goa; belongs to SC, ST or OBC category (scheme-dependent); family income up to ₹2.5 lakh per annum (varies by scheme).' })
    const v = matchScholarship(soft, { level: 'ug', state: 'Goa', social: 'general', income: 2 })
    expect(v.status).toBe('check')
  })

  it('rules out other states and flags a passed deadline', () => {
    const s = base({ state: 'Kerala', application_deadline: '2020-01-01' })
    expect(matchScholarship(s, { level: 'ug', state: 'Bihar' }).status).toBe('no')
    expect(matchScholarship(s, { level: 'ug', state: 'Kerala' }).closed).toBe(true)
  })

  it('needs the special-group box for sports, arts and ward schemes', () => {
    const s = base({ category: 'sports', eligibility_criteria: 'Athlete must be an Indian citizen.' })
    expect(matchScholarship(s, { level: 'ug', special: [] }).status).toBe('no')
    expect(matchScholarship(s, { level: 'ug', special: ['athlete'] }).status).toBe('eligible')
  })
})

describe('helpers', () => {
  it('maps a profile to answers', () => {
    expect(answersFromProfile({ class_level: 'Class 12 (Science)', stream: 'Science (PCM)', belonging_state: 'Bihar' }))
      .toMatchObject({ level: 'class_11_12', field: 'engineering', state: 'Bihar' })
  })
  it('formats amounts in words students use', () => {
    expect(formatScholarshipAmount({ amount_min: 12000, amount_max: 20000, amount_type: 'annual' })).toBe('₹12,000–₹20,000 a year')
    expect(formatScholarshipAmount({ amount_min: 100000, amount_max: 1000000, amount_type: 'loan' })).toBe('Loan of ₹1 lakh–₹10 lakh')
    expect(formatScholarshipAmount({ amount_min: 4000, amount_max: 4000, amount_type: 'monthly' })).toBe('₹4,000 a month')
    expect(formatScholarshipAmount({ amount_min: 5000, amount_max: 12400, amount_type: 'stipend' })).toBe('₹5,000–₹12,400 a month (stipend)')
    // A fee waiver has no figure: the note's first phrase stands in
    expect(formatScholarshipAmount({ amount_min: null, amount_max: null, amount_type: 'annual', amount_note: 'Tuition fee waiver: full for SC/ST' })).toBe('Tuition fee waiver')
    expect(scholarshipLevelLabel('class_11_12,undergraduate,postgraduate')).toBe('Class 11–12, Undergraduate, Postgraduate')
  })

  it('asks about the exam or institute behind exam- and college-linked awards', () => {
    const gate = base({ level: 'postgraduate', field_of_study: ['Engineering'], eligibility_criteria: 'Must have qualified the GATE or CEED with a valid score at the time of admission; admitted as a full-time student.' })
    const v = matchScholarship(gate, { level: 'pg', field: 'engineering', special: [] })
    expect(v.status).toBe('check')
    expect(v.check).toContain('Only after you have qualified the GATE or CEED with a valid score at the time of admission')
    const iit = parseRules(base({ eligibility_criteria: 'Only for students admitted to an IIT (B.Tech or BS); family income below ₹5 lakh per annum — full waiver below ₹1 lakh.' }))
    expect(iit.conditions).toContain('Only for students admitted to an IIT (B.Tech or BS)')
  })

  it('needs the ex-servicemen box for KSB scholarships, and treats EBC as a check for OBC students', () => {
    const ksb = base({ eligibility_criteria: 'Only for dependent wards and widows of ex-servicemen and ex-Coast Guard personnel; minimum 60% marks.' })
    expect(matchScholarship(ksb, { level: 'ug', special: [] }).status).toBe('no')
    expect(matchScholarship(ksb, { level: 'ug', special: ['esm_ward'] }).status).not.toBe('no')
    const ebc = base({ state: 'Bihar', eligibility_criteria: 'Must belong to the Extremely Backward Class (EBC) category.' })
    expect(matchScholarship(ebc, { state: 'Bihar', social: 'obc', special: [] }).status).toBe('check')
    expect(matchScholarship(ebc, { state: 'Bihar', social: 'sc', special: [] }).status).toBe('no')
  })
})
