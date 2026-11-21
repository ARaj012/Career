import { describe, expect, it } from 'vitest'
import { classifyPaperLink, paperKind, paperTitle, paperYear } from './papers'
import { examNamePattern } from './exams'

const now = new Date('2026-11-21')
const cuetPg = examNamePattern('CUET PG')
const cuetUg = examNamePattern('CUET UG')

describe('papers reader', () => {
  it('keeps question papers on the exam’s own archive page', () => {
    const p = classifyPaperLink(
      { text: 'Paper 1', url: 'https://jeeadv.ac.in/past_qps/2024_1_English.pdf' },
      { focus: examNamePattern('JEE Advanced'), trusted: true, officialHosts: ['jeeadv.ac.in'] }, now)
    expect(p).toMatchObject({ kind: 'question_paper', year: 2024, title: 'Paper 1 · English' })
  })

  it('needs the exam’s name on a shared notice board, and not a sibling’s', () => {
    const opts = { focus: cuetPg, trusted: false, officialHosts: ['nta.ac.in'], others: [cuetUg.strong] }
    expect(classifyPaperLink({ text: 'Final Answer Keys for CUET(UG) - 2026', url: 'https://nta.ac.in/Download/Notice/N_1.pdf' }, opts, now)).toBeNull()
    expect(classifyPaperLink({ text: 'Final Answer Keys of UGC-NET June 2026', url: 'https://nta.ac.in/Download/Notice/N_2.pdf' }, opts, now)).toBeNull()
    expect(classifyPaperLink({ text: 'Final Answer Key for CUET PG 2025', url: 'https://nta.ac.in/Download/Notice/N_3.pdf' }, opts, now))
      .toMatchObject({ kind: 'answer_key', year: 2025 })
  })

  it('skips notices about papers, web pages and other sites', () => {
    const opts = { focus: examNamePattern('GATE'), trusted: true, officialHosts: ['gate.iitb.ac.in'] }
    expect(classifyPaperLink({ text: 'Challenge of provisional answer keys', url: 'https://gate.iitb.ac.in/a.pdf' }, opts, now)).toBeNull()
    expect(classifyPaperLink({ text: 'Previous question papers', url: 'https://gate.iitb.ac.in/papers.html' }, opts, now)).toBeNull()
    expect(classifyPaperLink({ text: 'GATE 2025 question paper', url: 'https://coaching.example.com/gate.pdf' }, opts, now)).toBeNull()
  })

  it('drops notices and other exams the same board runs', () => {
    const own = (slug: string, name: string, host: string) =>
      ({ focus: examNamePattern(name), trusted: true, officialHosts: [host], exam: { name, slug } })
    const wb = own('wbjee', 'WBJEE', 'wbjeeb.nic.in')
    expect(classifyPaperLink({ text: 'Notice Final Answer Key JELET 2023', url: 'https://wbjeeb.nic.in/a.pdf' }, wb, now)).toBeNull()
    expect(classifyPaperLink({ text: 'Final Answer Keys JENPAS(UG) 2026', url: 'https://wbjeeb.nic.in/b.pdf' }, wb, now)).toBeNull()
    expect(classifyPaperLink({ text: 'WBJEE 2025 Final Answer Keys', url: 'https://wbjeeb.nic.in/c.pdf' }, wb, now)).not.toBeNull()
    const icet = own('ts-icet', 'TS ICET', 'icet.tgche.ac.in')
    expect(classifyPaperLink({ text: 'TG ICET 2025 QUESTION PAPER SHIFT-1', url: 'https://icet.tgche.ac.in/q.pdf' }, icet, now)).not.toBeNull()
    expect(classifyPaperLink({ text: 'Normalization of Question Paper', url: 'https://icet.tgche.ac.in/n.pdf' }, icet, now)).toBeNull()
    const nta = { focus: examNamePattern('JEE Main'), trusted: false, officialHosts: ['nta.ac.in'], exam: { name: 'JEE Main', slug: 'jee-main' } }
    expect(classifyPaperLink({ text: 'NCHM JEE (2024) - Final Answer Key', url: 'https://nta.ac.in/N_1.pdf' }, nta, now)).toBeNull()
    expect(classifyPaperLink({ text: 'JEE (Main) 2026 Session -1 and Session-2 for Paper-1 (B.E/ B. Tech)', url: 'https://nta.ac.in/N_2.pdf' }, nta, now)).toBeNull()
    expect(classifyPaperLink({ text: 'Clarification on Question Paper Pattern for JEE (Main)', url: 'https://nta.ac.in/N_3.pdf' }, nta, now)).toBeNull()
  })

  it('drops links whose text is only a date', () => {
    const opts = { focus: examNamePattern('TNPSC Group 1'), trusted: true, officialHosts: ['tnpsc.gov.in'], exam: { name: 'TNPSC Group 1', slug: 'tnpsc-group1' } }
    expect(classifyPaperLink({ text: '08/04/2026', url: 'https://tnpsc.gov.in/answerkeys/key.pdf' }, opts, now)).toBeNull()
  })

  it('reads kind, year and title', () => {
    expect(paperKind('2026 question paper', 'https://x.in/sample-qp/ug2026.pdf')).toBe('question_paper')
    expect(paperKind('2026 solutions')).toBe('answer_key')
    expect(paperKind('Sample Physics Question Paper')).toBe('sample_paper')
    expect(paperYear('Paper 2', 'https://x.in/uploads/2026/06/202606231857909583.pdf', now)).toBeNull()
    expect(paperYear('Paper 2', 'https://x.in/past_qps/2019_2.pdf', now)).toBe(2019)
    expect(paperTitle('Download', 'answer_key', 2024)).toBe('Answer key 2024')
    expect(paperTitle('[2026 question paper] Read More', 'question_paper', 2026)).toBe('2026 question paper')
  })
})
