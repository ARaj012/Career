-- Exam patterns: fill CMI and ISI from their own papers, add CMI screening cutoffs for 2023-2026,
-- (Applied 13 Nov 2026. Removing duplicate rows is in exam-patterns-dedupe-2026-11.sql, not yet applied.)
-- Sources (read 12-13 Nov 2026):
--   CMI BSc papers: 2023 (ugmath2023.pdf), 2024 (ugmath2024.pdf), 2025 (CMI-2025-BSc-question-paper.pdf),
--   2026 (CMI-2026-BS-draft-solutions.pdf, read through the Internet Archive because cmi.ac.in refused connections);
--   CMI admissions page 2026 (exam 2 May 2026, 14:00-17:00/17:30).
--   ISI sample papers 2026: https://admission.isical.ac.in/PreviousQuestion/BStat-BMath-UGA-2026.pdf and -UGB-2026.pdf

begin;

-- CMI B.S. (Hons) entrance
update public.exam_pattern p set
  duration_minutes = 180,
  total_questions = 20,
  total_marks = 120,
  marks_per_correct = null,
  negative_marking = 0,
  question_type = 'Part A: answers typed into a computer (multiple choice, numbers or short answers) · Part B: problems solved in full in an answer booklet',
  sections = '[
    {"name": "Part A — 15 questions, answers typed into a computer (screening)", "questions": 15, "marks": 40, "note": "1 to 4 points per question; no negative marking"},
    {"name": "Part B — 5 problems, complete reasoning in the answer booklet", "questions": 5, "marks": 80, "note": "14 + 14 + 14 + 14 + 24 points; CMI advises spending at least 2 hours on Part B"}
  ]'::jsonb,
  qualifying_note = 'Part A is used for screening. In 2026 Part B was assured to be graded for a Part A score of at least 21/40 (CMI may go lower); in 2023–2025 the bar was 24/40 or a top-400 rank in Part A. CMI publishes no final cutoff marks or ranks — only the list of selected candidates.',
  notes = 'Figures are from the B.S. paper of 2 May 2026, which ran 2:00–5:00 pm (5:30 pm for some papers). The format changes every year: 2025 — Part A 17 questions (40 points), Part B 6 problems (12 + 12 + 12 + 12 + 16 + 16); 2024 — Part A 21 questions, Part B 6 problems; 2023 — Part A 10 questions of 4 points each, Part B 6 problems, 3.5 hours. M.Sc./Ph.D. candidates write separate subject papers, and M.Sc./Ph.D. Mathematics shortlists are also interviewed.'
from public.exams e
where e.id = p.exam_id and e.slug = 'cmi-entrance';

-- CMI screening cutoffs (Part A score that guaranteed Part B was graded)
insert into public.exam_national_cutoffs
  (exam_id, year, category, stage, program_or_post, cutoff_score, max_score, cutoff_metric, source_type, source_url, verified_at, notes)
select e.id, v.yr, 'All candidates', 'Part A screening (Part B is graded)', 'B.Sc./B.S. (Hons) entrance', v.score, 40, 'marks', 'official', v.url, now(), v.note
from public.exams e, (values
  (2023, 24, 'https://www.cmi.ac.in/admissions/sample-qp/ugmath2023.pdf', 'Part B is assured to be graded for anyone scoring at least 24 in Part A or ranking in the top 400 in Part A.'),
  (2025, 24, 'https://www.cmi.ac.in/admissions/2025/CMI-2025-BSc-question-paper.pdf', 'Part B is assured to be graded for anyone scoring at least 24 in Part A or ranking in the top 400 in Part A.'),
  (2026, 21, 'https://www.cmi.ac.in/admissions/2026/CMI-2026-BS-draft-solutions.pdf', 'Part B is assured to be graded for a Part A score of at least 21; CMI may lower this at its discretion.')
) as v(yr, score, url, note)
where e.slug = 'cmi-entrance'
  and not exists (select 1 from public.exam_national_cutoffs n where n.exam_id = e.id and n.year = v.yr and n.stage = 'Part A screening (Part B is graded)');

-- ISI B.Stat / B.Math test: question counts from the 2026 sample papers
update public.exam_pattern p set
  total_questions = 38,
  sections = '[
    {"name": "UGA — Mathematics, multiple choice (10:30–12:30)", "questions": 30, "marks": 120, "duration_minutes": 120, "note": "Group A: 20 questions with exactly one correct option; Group B: 10 questions that may have more than one correct option"},
    {"name": "UGB — Mathematics, descriptive (14:00–16:00)", "questions": 8, "marks": 80, "duration_minutes": 120, "note": "8 problems of 10 points each, full proofs or working required"}
  ]'::jsonb
from public.exams e
where e.id = p.exam_id and e.slug = 'isi-admission-test';

-- USMLE Step 3: two testing days (about 7 h + 9 h)
update public.exam_pattern p set duration_minutes = 960
from public.exams e where e.id = p.exam_id and e.slug = 'usmle' and p.stage = 'Step 3' and p.duration_minutes is null;

-- USMLE Step 1 has been reported only as Pass/Fail since January 2022
update public.exam_pattern p set notes = p.notes || ' Step 1 is reported as Pass/Fail only (no numeric score) since January 2022.'
from public.exams e where e.id = p.exam_id and e.slug = 'usmle' and p.stage = 'Step 1' and p.notes not ilike '%pass/fail%';

commit;
