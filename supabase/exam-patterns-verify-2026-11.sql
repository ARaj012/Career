-- Exam patterns: official figures for AMU, ICAR, ICMR JRF (DHR-BRET), JEST, CMA Foundation, MAT,
-- KIITEE, CSEET and BHU LLB. Updates only; duplicate rows are listed in exam-patterns-dedupe-2026-11.sql.
-- Applied as Supabase migration "exam_patterns_verify_2026_11".
--
-- Sources (all read 12 Nov 2026 from the conducting body's own site):
--   AMU      Guide to Admissions 2026-27 (amucontrollerexams.com/uploads/files/e97cf6112508c8e79149275de5ae1cb3.pdf):
--            course pages A.4-A.8 (test paper details) and Appendix II (test schedule: date, duration, start time);
--            general instruction 3 (negative marking: 25% of the marks of the question); rule 34 (20% minimum).
--   ICAR     NTA Information Bulletin ICAR AIEEA (PG) 2026-27, section 2.3 Scheme of Examination;
--            NTA Information Bulletin ICAR AICE-JRF/SRF (Ph.D.) 2026, section 2.3 Scheme of Examination (page 16).
--            (cdnbbsr.s3waas.gov.in/.../2026/05/202605091397132773.pdf and .../202605091119545189.pdf, via exams.nta.nic.in/icar)
--   ICMR JRF AIIMS New Delhi Advertisement Notice No. 329/2025, DHR-BRET-2025, Section V Scheme and Pattern of Examination
--            (aiimsexams.ac.in); ICMR FAQ on BRET (icmr.gov.in/icmrobject/uploads/WhatsNew/1764048370_updated_faqs_bret.pdf).
--   JEST     jest.org.in/faq (JEST 2026 question pattern, Physics and TCS); jest.org.in home page (12 April 2026, 2-5 PM).
--   CMA Fdn  ICMAI Time Table & Programme, Foundation Course Examination December 2026
--            (dwpivt501gtb6.cloudfront.net/upload/students/DECEMBER_2026_FOUNDATION_20260813143427.pdf, linked from icmai.in);
--            ICMAI Model Question Paper, Foundation Paper 1, December 2026 term (1 hour, 100 marks, 2 marks each).
--   MAT      aima.in/testing-services/mat/mat.html, mat.aima.in, aima.in/mat/mat-score-interpretation/.
--   KIITEE   kiitee.kiit.ac.in: evaluation-and-declaration-of-results (cut-off, tie-break), sample-question-papers.
--            Duration, question count and marking are NOT published in text on the official site (the prospectus
--            viewer returns 403), so those fields are left empty and the note says so.
--   CSEET    ICSI announcement "Restructuring of CSEET (Effective from June 2026 Session)" dated 10.04.2026
--            (icsis3-console.icsi.edu:9002/icsi-prod/media/cms_uploads/announcement-restructured-cseet-6c26af2b.pdf).
--   BHU LLB  BHU UG Information Bulletin 2026 (B.A. LL.B. (Hons.) UG0137, page 53) and PG Information Bulletin 2026
--            (LL.B. (Hons.) PG0151, page 89) at storage.bhu.ac.in; NTA CUET (UG) 2026 bulletin (50 questions, 60 min,
--            +5/-1 per test) and CUET (PG) 2026 bulletin (75 questions, 90 min, +4/-1; COQP11 = General).

begin;

-- ───────────── AMU Entrance ─────────────
update public.exam_pattern p set
  stage = 'Class XI Science (S.S.S.C.) / Diploma in Engineering',
  mode = 'Offline (Pen & Paper, OMR)',
  duration_minutes = 120,
  total_questions = 100,
  total_marks = 100,
  marks_per_correct = 1,
  negative_marking = 0.25,
  languages = 'English, Hindi, Urdu',
  attempts_note = 'Held once a year (26 April 2026, 10:00 AM, in the 2026-27 cycle).',
  notes = 'One combined test for the Senior Secondary School Certificate (Science Stream, i.e. Class XI) and the Diploma in Engineering: 100 questions, Science (Physics, Chemistry and Life Science) 50 marks, Mathematics 30, Indo-Islamic Culture 10, General Knowledge 5, English 5. The Commerce and Humanities stream tests are separate 2-hour papers (26 April 2026, 3:00 PM) with their own components. A wrong answer costs a quarter of the question''s marks.',
  qualifying_note = 'Admission is by merit in this test. A candidate scoring below 20% in the admission test is not eligible for admission.'
from public.exams e
where e.id = p.exam_id and e.slug = 'amu-entrance' and p.id = '77ebeb94-7dbd-4b54-8fdd-ee44a5b3b6b8';

update public.exam_pattern p set
  mode = 'Offline (Pen & Paper, OMR)',
  duration_minutes = 120,
  total_questions = 100,
  total_marks = 100,
  marks_per_correct = 1,
  negative_marking = 0.25,
  sections = '[{"name": "Physics, Chemistry and Mathematics", "questions": 100, "marks": 100, "note": "AMU does not publish a subject-wise split"}]'::jsonb,
  languages = null,
  attempts_note = 'Held once a year (19 April 2026, 10:00 AM, in the 2026-27 cycle).',
  notes = 'One objective paper of 100 questions on Chemistry, Physics and Mathematics for all B.Tech. branches. B.Arch. has its own paper, and diploma holders entering B.E. take a separate 100-question test (25 on Physical Sciences, 75 on engineering sciences). A wrong answer costs a quarter of the question''s marks.',
  qualifying_note = 'Admission is by merit in this test. A candidate scoring below 20% in the admission test is not eligible for admission.'
from public.exams e
where e.id = p.exam_id and e.slug = 'amu-entrance' and p.id = '6ec587f4-64b5-4678-8abe-0ed5713dafe9';

update public.exam_pattern p set
  stage = 'B.A. LL.B.',
  mode = 'Offline (Pen & Paper, OMR)',
  duration_minutes = 120,
  total_questions = 100,
  total_marks = 100,
  marks_per_correct = 1,
  negative_marking = 0.25,
  sections = '[{"name": "Proficiency in English", "marks": 40}, {"name": "Current Affairs / General Knowledge (with emphasis on legal issues)", "marks": 40}, {"name": "Reasoning and Aptitude", "marks": 20}]'::jsonb,
  languages = null,
  attempts_note = 'Held once a year (26 April 2026, 3:00 PM, in the 2026-27 cycle).',
  notes = 'One paper of 100 objective questions for the 5-year B.A. LL.B. at Aligarh and at the AMU Centres in Malappuram and Murshidabad. Test centres: Aligarh, Kolkata and Kozhikode. A wrong answer costs a quarter of the question''s marks.',
  qualifying_note = 'Admission is by merit in this test. A candidate scoring below 20% in the admission test is not eligible for admission.'
from public.exams e
where e.id = p.exam_id and e.slug = 'amu-entrance' and p.id = '3cb410b8-d815-4e89-b29e-3e73d0e2338c';

-- ───────────── ICAR AIEEA ─────────────
-- The stage-less row was the Ph.D. (AICE-JRF/SRF) test with a wrong duration; it becomes that stage.
update public.exam_pattern p set
  stage = 'Ph.D. (AICE-JRF/SRF)',
  stage_order = 3,
  mode = 'Online (LAN-based Computer Based Test)',
  duration_minutes = 120,
  total_questions = 120,
  total_marks = 480,
  question_type = 'Objective (MCQ, 4 options)',
  marks_per_correct = 4,
  negative_marking = 1,
  sections = '[{"name": "Part A — General knowledge / reasoning ability", "questions": 20, "marks": 80}, {"name": "Part B — Core group containing your subject of specialisation", "questions": 50, "marks": 200}, {"name": "Part C — Your subject of specialisation", "questions": 50, "marks": 200}]'::jsonb,
  languages = 'English only',
  attempts_note = 'Held once a year by NTA for ICAR, alongside AIEEA (PG).',
  notes = 'All India Competitive Examination for Ph.D. admission in the ICAR Agricultural University system and the ICAR-JRF/SRF fellowship. Candidates choose one of 80 subjects of specialisation.',
  qualifying_note = null
from public.exams e
where e.id = p.exam_id and e.slug = 'icar-aieea' and p.id = '046e58e8-846f-4a21-bfee-ab47b45d214d';

update public.exam_pattern p set
  mode = 'Online (Computer Based Test)',
  duration_minutes = 120,
  total_questions = 120,
  total_marks = 480,
  marks_per_correct = 4,
  negative_marking = 1,
  sections = null,
  languages = 'English only',
  attempts_note = 'Held once a year by NTA for ICAR (4 July 2026 in the 2026 cycle).',
  notes = 'A single paper of 120 multiple-choice questions on the subject you choose, for master''s admission in the ICAR Agricultural University system. The 2026-27 bulletin gives no part-wise split. ICAR AIEEA (PG) is still ICAR''s own exam, not part of CUET (PG).',
  qualifying_note = 'Seats are allotted by rank through ICAR''s online counselling.'
from public.exams e
where e.id = p.exam_id and e.slug = 'icar-aieea' and p.id = '16514df5-7cde-41e4-b54e-1ed04c3859b4';

-- ───────────── ICMR JRF (now DHR-BRET) ─────────────
update public.exam_pattern p set
  mode = 'Online (Computer Based Test)',
  duration_minutes = 180,
  total_questions = 150,
  total_marks = 150,
  question_type = 'MCQ (single correct)',
  marks_per_correct = 1,
  negative_marking = 0.25,
  sections = '[{"name": "Section A — Aptitude and General Analytical Ability", "questions": 50, "marks": 50}, {"name": "Section B — Fundamentals of Biomedical and Life Sciences", "questions": 50, "marks": 50}, {"name": "Section C — Your chosen discipline", "questions": 50, "marks": 50, "note": "Microbiology, Biochemistry, Biostatistics, Veterinary Science, Public Health, Nursing, Biotechnology, Social & Behavioural Sciences, Nutrition, Pharmacology or Biological Science"}]'::jsonb,
  languages = 'English only',
  attempts_note = 'Held once a year.',
  notes = 'The ICMR JRF test is now the DHR Biomedical Research Eligibility Test (DHR-BRET); the 2025 test was conducted by AIIMS New Delhi. You can move freely between sections during the 3 hours. Answers flagged or marked for review are not evaluated. Merit is on the total out of 150; ties go to the higher Section C score, then fewer negative marks, then the older candidate.',
  qualifying_note = null
from public.exams e
where e.id = p.exam_id and e.slug = 'icmr-jrf' and p.id = '54544ee3-dd6a-4cc9-af9e-e66e264c1aa0';

-- ───────────── JEST ─────────────
update public.exam_pattern p set
  mode = 'Computer Based Test (CBT)',
  duration_minutes = 180,
  total_questions = 40,
  total_marks = 100,
  question_type = 'Multiple choice (Parts A and B) and numerical answer (Part C)',
  marks_per_correct = null,
  negative_marking = null,
  sections = '[{"name": "Part A — Multiple choice", "questions": 10, "marks": 10, "marks_per_question": 1, "negative_marking": 0.333}, {"name": "Part B — Multiple choice", "questions": 20, "marks": 60, "marks_per_question": 3, "negative_marking": 1}, {"name": "Part C — Numerical answer", "questions": 10, "marks": 30, "marks_per_question": 3, "negative_marking": 0}]'::jsonb,
  languages = null,
  notes = 'Figures are for the Physics paper, whose pattern changed for JEST 2026 (held 12 April 2026, 2-5 PM). The Theoretical Computer Science paper is also 180 minutes: Part A has 25 multiple-choice questions (+3, −1); Part B has 9 problems, of which the best three 8-mark and best two 13-mark answers are counted, and Part B closes after 105 minutes.'
from public.exams e
where e.id = p.exam_id and e.slug = 'jest' and p.id = '54a72d29-89ce-43ac-b212-cebea5b969a0';

-- ───────────── CMA Foundation (keep the current-pattern row) ─────────────
update public.exam_pattern p set
  mode = 'Offline (OMR, centre-based)',
  duration_minutes = 240,
  total_questions = 200,
  total_marks = 400,
  question_type = 'Multiple Choice Questions',
  marks_per_correct = 2,
  negative_marking = 0,
  languages = null,
  attempts_note = 'Held in the June and December terms each year.',
  notes = 'Syllabus 2022. All four papers are on one day in two 2-hour sessions: Papers 1 and 2 from 10 AM to 12 noon, Papers 3 and 4 from 2 to 4 PM (13 December 2026 for the December 2026 term). Each paper has 50 questions of 2 marks (100 marks), and ICMAI''s model papers allow 1 hour per paper. No negative marking.'
from public.exams e
where e.id = p.exam_id and e.slug = 'cma-foundation' and p.id = '0fcb79b6-24d5-48f3-906a-61e45802b70e';

-- ───────────── MAT (keep the current-pattern row) ─────────────
update public.exam_pattern p set
  mode = 'Paper Based Test (PBT), Computer Based Test (CBT), or both',
  duration_minutes = 120,
  total_questions = 150,
  total_marks = null,
  marks_per_correct = null,
  negative_marking = 0.25,
  sections = '[{"name": "Language Comprehension", "questions": 30}, {"name": "Intelligence & Critical Reasoning", "questions": 30}, {"name": "Mathematical Skills", "questions": 30}, {"name": "Data Analysis & Sufficiency", "questions": 30}, {"name": "Economic & Business Environment", "questions": 30}]'::jsonb,
  attempts_note = 'AIMA holds MAT several times a year; see mat.aima.in for the next session.',
  notes = 'Each section is reported as a scaled score from 0 to 100 and the composite on a 200–800 scale. All five sections count toward the composite, with equal weight. AIMA does not publish marks per correct answer; each wrong answer costs 0.25.',
  qualifying_note = 'There is no pass mark. Each participating B-school sets its own cutoff on the MAT score.'
from public.exams e
where e.id = p.exam_id and e.slug = 'mat' and p.id = '26743cce-a109-4f4b-80a0-adec56b51385';

-- ───────────── KIITEE (keep one row; unverifiable figures cleared and labelled) ─────────────
update public.exam_pattern p set
  mode = 'Not published by KIIT',
  duration_minutes = null,
  total_questions = null,
  total_marks = null,
  question_type = 'Objective (MCQ)',
  marks_per_correct = null,
  negative_marking = null,
  sections = '[{"name": "Physics"}, {"name": "Chemistry"}, {"name": "Mathematics"}]'::jsonb,
  languages = null,
  attempts_note = null,
  notes = 'Not officially verified: KIIT''s own website does not publish the B.Tech paper''s duration, question count or scoring in readable form (its prospectus viewer refuses access), so these are left blank. KIIT''s official sample papers for B.Tech cover Physics, Chemistry and Mathematics. Coaching and news sites report 120 questions (40 per subject), +4 for a right answer and −1 for a wrong one, and give the duration as either 2.5 or 3 hours.',
  qualifying_note = 'KIIT fixes a qualifying cut-off mark when it declares the result and calls candidates above the cut-off rank to counselling. Equal marks are broken by Mathematics marks, then Physics, then age (older candidate first).'
from public.exams e
where e.id = p.exam_id and e.slug = 'kiitee' and p.id = '53716e45-eacc-4247-8cbf-66a6ece94f7a';

-- ───────────── CSEET (keep the restructured-pattern row) ─────────────
update public.exam_pattern p set
  mode = 'Offline at ICSI exam centres, one paper a day over 4 days (2:30 PM start)',
  duration_minutes = 660,
  total_questions = null,
  total_marks = 400,
  question_type = 'Three subjective (written) papers and one OMR-based objective (MCQ) paper',
  marks_per_correct = null,
  negative_marking = null,
  sections = '[{"name": "Day 1 — Business Communication", "marks": 100, "duration_minutes": 180, "note": "Subjective"}, {"name": "Day 2 — Fundamentals of Accounting", "marks": 100, "duration_minutes": 180, "note": "Subjective"}, {"name": "Day 3 — Economic and Business Environment", "marks": 100, "duration_minutes": 180, "note": "Subjective"}, {"name": "Day 4 — Business Laws (60) and Business Management (40)", "marks": 100, "duration_minutes": 120, "note": "OMR-based multiple choice; no negative marking"}]'::jsonb,
  languages = null,
  attempts_note = 'Held three times a year, in the first week of February, June and October. Registration is valid for 3 years; a CSEET pass is valid for one year.',
  notes = 'Restructured from the June 2026 session: the remote-proctored online CSEET ended with the January 2026 session. Each paper has 15 minutes of reading time. Only the Day 4 paper is objective, and it has no negative marking.'
from public.exams e
where e.id = p.exam_id and e.slug = 'cseet' and p.id = 'be77fc85-098f-4c38-adb6-5144486fd7c3';

-- ───────────── BHU LLB ─────────────
update public.exam_pattern p set
  stage = 'B.A. LL.B. (Hons.) via CUET-UG',
  stage_order = 1,
  mode = 'Online (Computer Based Test)',
  duration_minutes = 120,
  total_questions = 100,
  total_marks = 500,
  question_type = 'Objective (MCQ)',
  marks_per_correct = 5,
  negative_marking = 1,
  sections = '[{"name": "CUET-UG Language Test — English (101) or Hindi (102)", "questions": 50, "marks": 250, "duration_minutes": 60}, {"name": "CUET-UG General Aptitude Test (501)", "questions": 50, "marks": 250, "duration_minutes": 60}]'::jsonb,
  languages = 'Language test in English or Hindi',
  attempts_note = 'CUET-UG is held once a year by NTA (11–31 May 2026, tentative).',
  notes = 'BHU''s 5-year B.A. LL.B. (Hons.) (programme code UG0137) admits on CUET-UG scores through BHU''s CAP-UG portal; BHU no longer holds its own law entrance test. The two CUET-UG tests BHU requires are a language test and the General Aptitude Test, not a law domain paper. Each CUET-UG test has 50 compulsory questions in 60 minutes.',
  qualifying_note = 'Eligibility: at least 50% in the qualifying examination (45% for OBC, 40% for SC/ST), as the Bar Council of India requires. Seats are allotted on CUET-UG scores.'
from public.exams e
where e.id = p.exam_id and e.slug = 'bhu-llb' and p.id = '6de97248-dc48-4faf-867d-98eec0adb41f';

update public.exam_pattern p set
  stage = 'LL.B. (Hons.) 3-year via CUET-PG',
  stage_order = 2,
  mode = 'Online (Computer Based Test)',
  duration_minutes = 90,
  total_questions = 75,
  total_marks = 300,
  marks_per_correct = 4,
  negative_marking = 1,
  sections = '[{"name": "CUET-PG paper COQP11 (General)", "questions": 75, "marks": 300, "duration_minutes": 90}]'::jsonb,
  languages = null,
  notes = 'BHU''s 3-year LL.B. (Hons.) (programme code PG0151) admits on CUET-PG scores in paper COQP11, through BHU''s CAP (PG) portal.',
  qualifying_note = 'Eligibility: a bachelor''s degree in any discipline with at least 50% aggregate. Seats are allotted on CUET-PG scores.'
from public.exams e
where e.id = p.exam_id and e.slug = 'bhu-llb' and p.id = '4bc40dd7-d916-4a2c-b396-bbd02d2cbd40';

-- Until the duplicate rows are deleted (exam-patterns-dedupe-2026-11.sql), sort them after the verified row,
-- so the roadmap page shows the verified pattern first. (Applied as migration "exam_patterns_verify_2026_11_order_stale_last".)
update public.exam_pattern set stage_order = 99 where id in (
  '2b6a4dde-623a-4891-a03f-42fc65d49e84', -- cma-foundation
  '0996a004-dba5-4054-bae7-ae0ca88fe667', -- mat
  '7a4d25ae-cddb-4827-a00e-6abbf07347f0', -- kiitee
  '74d234da-99e2-4526-a3a4-1b602b413ec3', -- cseet
  '1a8c48de-559d-4969-a0a1-a05fc7428666'  -- bhu-llb
);

commit;
