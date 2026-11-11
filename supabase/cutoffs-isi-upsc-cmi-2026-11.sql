-- Official cutoffs, exam patterns and syllabi: UPSC CSE, UPSC IES/ISS, ISI Admission Test, CMI (November 2026)
--
-- Sources (all read from the bodies' own documents):
--   UPSC cut-off marks (CSE 2021-2025, IES/ISS 2021-2025): upsc.gov.in/examinations/cutoff-marks and its archive
--   UPSC IES/ISS Examination Notice 07/2026 (scheme of examination, ISS syllabus)
--   ISI merit-list / interview-list notices 2025 and 2026 ("Shortlisting Criteria"), Selection Policy 2026,
--       Prospectus 2026-27 (test timings). ISI's 2023-2024 notices are no longer online: the B.Stat/B.Math
--       figures for those years are taken from College Pravesh (whose 2025-2026 figures match ISI's notices
--       exactly) and are stored as 'unverified', so the site marks them as not yet confirmed.
--   CMI entrance syllabus pages, 2023/2024 question papers and results pages 2025/2026 (cmi.ac.in, read from
--       Internet Archive copies because cmi.ac.in did not accept connections). CMI does not publish cutoff marks.

-- ---------------------------------------------------------------------
-- UPSC CSE: replace placeholder rows (2026, no source) with the official 2021-2025 cutoffs
-- ---------------------------------------------------------------------
delete from public.exam_national_cutoffs
where exam_id = (select id from public.exams where slug = 'upsc-cse')
  and source_type = 'unverified' and source_url is null and year = 2026;

insert into public.exam_national_cutoffs (exam_id, year, category, stage, cutoff_score, max_score, cutoff_metric, source_type, source_url, verified_at, notes)
select e.id, v.year, v.cat, v.stage, v.score, v.maxs, 'marks', 'official', v.src, now(), v.note
from (
  select y.year, s.stage, s.maxs, s.note, c.cat, (y.vals->s.k->>c.i)::numeric as score, y.src
  from (values
    (2021, 'https://www.upsc.gov.in/sites/default/files/CutOff-CSE-21-engl-300522.pdf',
      '{"p":[87.54,80.14,84.85,75.41,70.71,68.02,67.33,43.09,45.80],"m":[745,713,707,700,700,668,712,388,560],"f":[953,916,910,886,883,892,932,689,701]}'::jsonb),
    (2022, 'https://www.upsc.gov.in/sites/default/files/CutOff-CSE-22-Engl-230523.pdf',
      '{"p":[88.22,82.83,87.54,74.08,69.35,49.84,58.59,40.40,41.76],"m":[748,715,714,699,706,677,706,351,419],"f":[960,926,923,893,900,879,913,632,590]}'::jsonb),
    (2023, 'https://www.upsc.gov.in/sites/default/files/CutOff-CSE-23-engl-180424.pdf',
      '{"p":[75.41,68.02,74.75,59.25,47.82,40.40,47.13,40.40,33.68],"m":[741,706,712,694,692,673,718,396,445],"f":[953,923,919,890,891,894,930,756,589]}'::jsonb),
    (2024, 'https://www.upsc.gov.in/sites/default/files/CutOff-CSE-2024-Engl-220425.pdf',
      '{"p":[87.98,85.92,87.28,79.03,74.23,69.42,65.30,40.56,40.56],"m":[729,696,702,685,684,663,696,307,361],"f":[947,917,910,880,884,876,913,701,461]}'::jsonb),
    (2025, 'https://www.upsc.gov.in/sites/default/files/CSE_2025_Cut-OffMks_Eng_09032026.pdf',
      '{"p":[92.66,89.34,92.00,84.00,82.66,76.66,54.66,40.66,40.66],"m":[739,706,717,700,694,703,708,536,451],"f":[963,926,931,905,902,917,944,804,631]}'::jsonb)
  ) y(year, src, vals)
  cross join (values
    ('p', 'Prelims (GS Paper I)', 200, 'Cut-off on GS Paper I only; GS Paper II (CSAT) is qualifying at 33%.'),
    ('m', 'Mains (written)', 1750, 'Subject to 10% marks in each of the seven competitive papers (Essay, GS I-IV, Optional I-II).'),
    ('f', 'Final (written + interview)', 2025, 'Marks of the last recommended candidate.')
  ) s(k, stage, maxs, note)
  cross join (values (0,'General'),(1,'EWS'),(2,'OBC'),(3,'SC'),(4,'ST'),(5,'PwBD-1'),(6,'PwBD-2'),(7,'PwBD-3'),(8,'PwBD-5')) c(i, cat)
) v
cross join (select id from public.exams where slug = 'upsc-cse') e
where v.score is not null
  and not exists (select 1 from public.exam_national_cutoffs x where x.exam_id = e.id and x.year = v.year and x.stage = v.stage and x.category = v.cat);

-- ---------------------------------------------------------------------
-- UPSC IES/ISS: official 2021-2025 cutoffs (written minimum and final), both services
-- ---------------------------------------------------------------------
insert into public.exam_national_cutoffs (exam_id, year, category, stage, program_or_post, cutoff_score, max_score, cutoff_metric, source_type, source_url, verified_at)
select e.id, v.year, v.cat, v.stage, v.svc, v.score, v.maxs, 'marks', 'official', v.src, now()
from (
  select y.year, y.svc, s.stage, s.maxs, c.cat, (y.vals->s.k->>c.i)::numeric as score, y.src
  from (values
    (2021, 'Indian Statistical Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IESISS-2021-201221-engl.pdf', '{"w":[486,442,460,428,274],"f":[641,571,588,537,358]}'::jsonb),
    (2022, 'Indian Statistical Service', 'https://www.upsc.gov.in/sites/default/files/IES-ISS-2022_CutOff_Eng_30122022.pdf', '{"w":[440,432,401,348,241],"f":[608,542,535,498,340]}'::jsonb),
    (2023, 'Indian Statistical Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IES-ISS-23-engl-310124.pdf', '{"w":[481,433,419,387,329],"f":[638,616,562,517,477]}'::jsonb),
    (2024, 'Indian Statistical Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IES-ISS-Exam-2024-English-161224.pdf', '{"w":[449,427,430,383,342],"f":[627,589,590,526,476]}'::jsonb),
    (2025, 'Indian Statistical Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IES-ISS-2025-Engl-071025.pdf', '{"w":[430,412,414,372,null],"f":[660,626,618,634,null]}'::jsonb),
    (2021, 'Indian Economic Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IESISS-2021-201221-engl.pdf', '{"w":[440,429,373,335,363],"f":[586,565,532,484,479]}'::jsonb),
    (2022, 'Indian Economic Service', 'https://www.upsc.gov.in/sites/default/files/IES-ISS-2022_CutOff_Eng_30122022.pdf', '{"w":[418,359,363,301,287],"f":[585,567,522,469,457]}'::jsonb),
    (2023, 'Indian Economic Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IES-ISS-23-engl-310124.pdf', '{"w":[408,329,370,309,null],"f":[549,483,506,456,null]}'::jsonb),
    (2024, 'Indian Economic Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IES-ISS-Exam-2024-English-161224.pdf', '{"w":[419,341,373,327,316],"f":[560,466,534,457,475]}'::jsonb),
    (2025, 'Indian Economic Service', 'https://www.upsc.gov.in/sites/default/files/CutOff-IES-ISS-2025-Engl-071025.pdf', '{"w":[464,435,415,391,null],"f":[631,565,560,531,null]}'::jsonb)
  ) y(year, svc, src, vals)
  cross join (values ('w', 'Written (minimum qualifying)', 1000), ('f', 'Final (written + interview)', 1200)) s(k, stage, maxs)
  cross join (values (0,'General'),(1,'EWS'),(2,'OBC'),(3,'SC'),(4,'ST')) c(i, cat)
) v
cross join (select id from public.exams where slug = 'upsc-ies-iss') e
where v.score is not null
  and not exists (select 1 from public.exam_national_cutoffs x where x.exam_id = e.id and x.year = v.year and x.stage = v.stage and x.program_or_post = v.svc and x.category = v.cat);

-- ---------------------------------------------------------------------
-- ISI Admission Test: shortlisting criteria by programme
-- ---------------------------------------------------------------------
insert into public.exam_national_cutoffs (exam_id, year, category, stage, program_or_post, cutoff_score, max_score, cutoff_metric, source_type, source_url, verified_at, notes)
select e.id, v.year, c.cat, v.stage, v.prog, (v.vals::jsonb->>c.i)::numeric, v.maxs, 'marks', v.st, v.src,
  case when v.st = 'official' then now() end, v.note
from (values
  -- B.Stat (Hons)
  ('B.Stat (Hons)', 2026, 'Stage I: Test I (UGA, multiple choice)', 120, '[63,56.7,44.1]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Merit-List/BSTISITest-meritlist-notice.pdf', 'UGA'),
  ('B.Stat (Hons)', 2026, 'Stage II: UGA + weighted UGB', 400, '[202,181.8,141.4]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Merit-List/BSTISITest-meritlist-notice.pdf', 'UGA + 3.5×UGB'),
  ('B.Stat (Hons)', 2025, 'Stage I: Test I (UGA, multiple choice)', 120, '[77,69.3,53.9]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/BSTISITest-meritlist-notice.pdf', 'UGA'),
  ('B.Stat (Hons)', 2025, 'Stage II: UGA + weighted UGB', 360, '[137,123.3,95.9]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/BSTISITest-meritlist-notice.pdf', 'UGA + 3×UGB'),
  ('B.Stat (Hons)', 2024, 'Stage I: Test I (UGA, multiple choice)', 120, '[57,51.3,39.9]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA'),
  ('B.Stat (Hons)', 2024, 'Stage II: UGA + weighted UGB', 360, '[148,133.2,103.6]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA + 3×UGB'),
  ('B.Stat (Hons)', 2023, 'Stage I: Test I (UGA, multiple choice)', 120, '[66,59.4,46.2]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA'),
  ('B.Stat (Hons)', 2023, 'Stage II: UGA + weighted UGB', 360, '[122,109.8,85.4]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA + 3×UGB'),
  -- B.Math (Hons)
  ('B.Math (Hons)', 2026, 'Stage I: Test I (UGA, multiple choice)', 120, '[61,54.9,42.7]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Merit-List/BMTISITest-meritlist-notice.pdf', 'UGA'),
  ('B.Math (Hons)', 2026, 'Stage II: UGA + weighted UGB', 440, '[200,180,140]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Merit-List/BMTISITest-meritlist-notice.pdf', 'UGA + 4×UGB'),
  ('B.Math (Hons)', 2025, 'Stage I: Test I (UGA, multiple choice)', 120, '[75,67.5,52.5]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/BMTISITest-meritlist-notice.pdf', 'UGA'),
  ('B.Math (Hons)', 2025, 'Stage II: UGA + weighted UGB', 360, '[132,118.8,92.4]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/BMTISITest-meritlist-notice.pdf', 'UGA + 3×UGB'),
  ('B.Math (Hons)', 2024, 'Stage I: Test I (UGA, multiple choice)', 120, '[56,50.4,39.2]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA'),
  ('B.Math (Hons)', 2024, 'Stage II: UGA + weighted UGB', 360, '[136,122.4,95.2]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA + 3×UGB'),
  ('B.Math (Hons)', 2023, 'Stage I: Test I (UGA, multiple choice)', 120, '[67,60.3,46.9]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA'),
  ('B.Math (Hons)', 2023, 'Stage II: UGA + weighted UGB', 360, '[131,117.9,91.7]', 'unverified', 'https://www.collegepravesh.com/news/isi-admission-test-qualifying-cutoff/', 'UGA + 3×UGB'),
  -- M.Stat
  ('M.Stat', 2026, 'Stage I: Test I (multiple choice)', 120, '[55,49.5,38.5]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MSTISITest-interview-selection-notice.pdf', 'PSA (interview shortlist)'),
  ('M.Stat', 2026, 'Stage II: Test I + weighted Test II', 720, '[234,210.6,163.8]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MSTISITest-interview-selection-notice.pdf', 'PSA + 5×PSB (interview shortlist)'),
  ('M.Stat', 2025, 'Stage I: Test I (multiple choice)', 120, '[48,43.2,33.6]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MSTISITest-meritlist-notice.pdf', 'PSA'),
  ('M.Stat', 2025, 'Stage II: Test I + weighted Test II', 480, '[176,158.4,123.2]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MSTISITest-meritlist-notice.pdf', 'PSA + 3×PSB'),
  ('M.Stat', 2025, 'Stage III: with interview', 600, '[219,197.1,153.3]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MSTISITest-meritlist-notice.pdf', 'PSA + 3×PSB + Interview'),
  -- M.Math
  ('M.Math', 2026, 'Stage I: Test I (multiple choice)', 120, '[48,43.2,33.6]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MMTISITest-interview-selection-notice.pdf', 'PMA (interview shortlist)'),
  ('M.Math', 2026, 'Stage II: Test I + weighted Test II', 400, '[115.5,103.95,80.85]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MMTISITest-interview-selection-notice.pdf', 'PMA + 3.5×PMB (interview shortlist)'),
  ('M.Math', 2025, 'Stage I: Test I (multiple choice)', 120, '[75,67.5,52.5]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MMTISITest-meritlist-notice.pdf', 'MMA'),
  ('M.Math', 2025, 'Stage II: Test I + weighted Test II', 400, '[157.5,141.75,110.25]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MMTISITest-meritlist-notice.pdf', 'MMA + 3.5×PMB'),
  ('M.Math', 2025, 'Stage III: with interview', 530, '[210.5,189.45,147.35]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MMTISITest-meritlist-notice.pdf', 'MMA + 3.5×PMB + 6.5×Interview'),
  -- MS (Quantitative Economics)
  ('MS (Quantitative Economics)', 2026, 'Stage I: Test I (multiple choice)', 120, '[59,53.1,41.3]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Merit-List/MQEISITest-meritlist-notice.pdf', 'PEA'),
  ('MS (Quantitative Economics)', 2026, 'Stage II: Test I + weighted Test II', 480, '[186.8,168.12,130.76]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Merit-List/MQEISITest-meritlist-notice.pdf', 'PEA + 3×PEB'),
  ('MS (Quantitative Economics)', 2025, 'Stage I: Test I (multiple choice)', 120, '[75,67.5,52.5]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MQEISITest-meritlist-notice.pdf', 'PEA'),
  ('MS (Quantitative Economics)', 2025, 'Stage II: Test I + weighted Test II', 480, '[261,234.9,182.7]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MQEISITest-meritlist-notice.pdf', 'PEA + 3×PEB'),
  -- M.Tech (Computer Science / Cryptology and Security)
  ('M.Tech (CS / Cryptology and Security)', 2026, 'Stage I: Test I (multiple choice)', 120, '[53,47.7,37.1]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MCXISITest-interview-selection-notice.pdf', 'PCA (interview shortlist)'),
  ('M.Tech (CS / Cryptology and Security)', 2026, 'Stage II: Test I + weighted Test II', 520, '[238,214.2,166.6]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MCXISITest-interview-selection-notice.pdf', 'PCA + 4×PCB, with PCB ≥ 25/100 (22.5 OBC-NCL, 17.5 SC/ST/PwBD)'),
  ('M.Tech (CS / Cryptology and Security)', 2025, 'Stage I: Test I (multiple choice)', 120, '[63,56.7,44.1]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MCXISITest-meritlist-notice.pdf', 'PCA'),
  ('M.Tech (CS / Cryptology and Security)', 2025, 'Stage II: Test I + weighted Test II', 520, '[200,180,140]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MCXISITest-meritlist-notice.pdf', 'PCA + 4×PCB'),
  ('M.Tech (CS / Cryptology and Security)', 2025, 'Stage III: with interview', 960, '[333,299.7,233.1]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MCXISITest-meritlist-notice.pdf', 'PCA + 6×PCB + 6×Interview'),
  -- M.Tech (QROR)
  ('M.Tech (Quality, Reliability and Operations Research)', 2026, 'Stage I: Test I (multiple choice)', 120, '[41,36.9,28.7]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MQRISITest-interview-selection-notice.pdf', 'MMA (interview shortlist)'),
  ('M.Tech (Quality, Reliability and Operations Research)', 2026, 'Stage II: Test I + weighted Test II', 600, '[205,184.5,143.5]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Interview/MQRISITest-interview-selection-notice.pdf', '2×MMA + 3×PQB (interview shortlist)'),
  ('M.Tech (Quality, Reliability and Operations Research)', 2025, 'Stage I: Test I (multiple choice)', 120, '[36,32.4,25.2]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MQRISITest-meritlist-notice.pdf', 'MMA'),
  ('M.Tech (Quality, Reliability and Operations Research)', 2025, 'Stage II: Test I + weighted Test II', 600, '[212,190.8,148.4]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MQRISITest-meritlist-notice.pdf', '2×MMA + 3×PQB'),
  ('M.Tech (Quality, Reliability and Operations Research)', 2025, 'Stage III: with interview', 1200, '[409.4,368.46,286.58]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2025/Merit-List/MQRISITest-meritlist-notice.pdf', '3×MMA + 5×PQB + 2×Interview'),
  -- GATE channel for the M.Tech programmes
  ('M.Tech (CS, CrS, QROR) — GATE channel', 2026, 'GATE score eligibility', 1000, '[750,675,525]', 'official', 'https://admission.isical.ac.in/Documents/IsiAdmission2026/Selection-Policy-Non-JRF-2026.pdf', 'Eligibility score for direct interview')
) v(prog, year, stage, maxs, vals, st, src, note)
cross join (values (0,'GEN / EWS'),(1,'OBC-NCL'),(2,'SC / ST / PwBD')) c(i, cat)
cross join (select id from public.exams where slug = 'isi-admission-test') e
where not exists (select 1 from public.exam_national_cutoffs x where x.exam_id = e.id and x.year = v.year and x.stage = v.stage and x.program_or_post = v.prog and x.category = c.cat);

-- ---------------------------------------------------------------------
-- CMI: no published cutoff marks; the 2024 paper states the Part A screening threshold
-- ---------------------------------------------------------------------
insert into public.exam_national_cutoffs (exam_id, year, category, stage, program_or_post, cutoff_score, max_score, cutoff_metric, source_type, source_url, verified_at, notes)
select e.id, 2024, 'All candidates', 'Part A screening (Part B is graded)', 'B.Sc./B.S. (Hons) entrance', 24, 40, 'marks', 'official',
  'https://www.cmi.ac.in/admissions/sample-qp/ugmath2024.pdf', now(),
  'Part B is assured to be graded for anyone scoring at least 24 in Part A or ranking in the top 400 in Part A.'
from public.exams e where e.slug = 'cmi-entrance'
  and not exists (select 1 from public.exam_national_cutoffs x where x.exam_id = e.id and x.year = 2024);

update public.exams set description = description || $t$ CMI does not publish cutoff marks or ranks: its results pages list only the selected candidates. For the B.S./B.Sc. programmes it selected 82 candidates with scholarship and 50 without in 2026, and 64 with scholarship and 56 without in 2025.$t$
where slug = 'cmi-entrance' and description not like '%does not publish cutoff%';

insert into public.exam_schedules (exam_id, year, session, exam_date_start, exam_date_end, source_url, data_status, verified_at)
select e.id, 2025, 'Default', '2025-05-24', '2025-05-24', 'https://www.cmi.ac.in/admissions/entrance-results-2025.php', 'verified', now()
from public.exams e where e.slug = 'cmi-entrance'
on conflict (exam_id, year, session) do nothing;

-- ---------------------------------------------------------------------
-- Exam patterns
-- ---------------------------------------------------------------------
-- ISI: the earlier rows said the merit list used UGA alone (wrong: ISI ranks on UGA + weighted UGB) and
-- carried a second, contradictory pattern. Replace them with the official 2026-27 pattern.
delete from public.exam_pattern where exam_id = (select id from public.exams where slug = 'isi-admission-test');
insert into public.exam_pattern (exam_id, stage, stage_order, mode, duration_minutes, total_questions, total_marks, question_type, marks_per_correct, negative_marking, sections, languages, attempts_note, notes, qualifying_note)
select e.id, null, 1, 'Offline (pen and paper), two sessions on one day', 240, null, 200,
  'UGA: multiple-choice mathematics · UGB: descriptive mathematics', null, null,
  $j$[{"name":"UGA — Mathematics, multiple choice (10:30–12:30)","marks":120,"duration_minutes":120},{"name":"UGB — Mathematics, descriptive (14:00–16:00)","marks":80,"duration_minutes":120}]$j$::jsonb,
  'English',
  'Held once a year in May (10 May 2026, 11 May 2025). The same test is used for B.Stat (Kolkata) and B.Math (Bengaluru); master''s programmes have their own Test I / Test II papers (e.g. PSA/PSB for M.Stat, PMA/PMB for M.Math).',
  'Selection is stage-wise (ISI Selection Policy 2026-27): Stage I shortlists on UGA; Stage II ranks on UGA + 3.5×UGB (B.Stat) or UGA + 4×UGB (B.Math). There is no interview for B.Stat or B.Math; the final merit list comes from the Stage II score. Up to 5 INMO awardees per programme are admitted by interview alone.',
  'Stage I qualifying score: the UGA mark of the 550th candidate (B.Stat) or 500th (B.Math) for GEN/GEN-EWS; OBC-NCL get 0.9× and SC/ST/PwBD 0.7× that score.'
from public.exams e where e.slug = 'isi-admission-test';

-- CMI
delete from public.exam_pattern where exam_id = (select id from public.exams where slug = 'cmi-entrance');
insert into public.exam_pattern (exam_id, stage, stage_order, mode, duration_minutes, total_questions, total_marks, question_type, marks_per_correct, negative_marking, sections, languages, attempts_note, notes, qualifying_note)
select e.id, null, 1, 'At test centres (Part A answers entered on a computer; Part B written in an answer booklet)', null, null, 120,
  'Part A: short answers / multiple choice · Part B: problems with complete written reasoning', null, null,
  $j$[{"name":"Part A — short answers and multiple choice (screening)","marks":40},{"name":"Part B — 6 problems, full reasoning required","marks":80,"questions":6}]$j$::jsonb,
  'English',
  'Held once a year in May (2 May 2026, 24 May 2025) at about 37 centres. One paper for all B.S. (Hons) programmes; separate papers for M.Sc./Ph.D. Mathematics, M.Sc./Ph.D. Computer Science, M.Sc. Data Science and Ph.D. Physics.',
  'Figures are from the B.Sc. paper of 19 May 2024 (Part A: 21 questions for 40 points, no negative marking; Part B: 6 problems for 80 points). The format changes from year to year — the 2023 paper had 10 Part A questions and ran 3.5 hours — so check the instructions on the day. The 2026 exam ran from 2:00 pm to 5:00/5:30 pm.',
  'Part A is used for screening. In 2024 Part B was graded for everyone scoring at least 24/40 in Part A or ranking in the top 400. CMI does not publish final cutoffs.'
from public.exams e where e.slug = 'cmi-entrance';

-- UPSC IES/ISS (Indian Statistical Service papers)
delete from public.exam_pattern where exam_id = (select id from public.exams where slug = 'upsc-ies-iss');
insert into public.exam_pattern (exam_id, stage, stage_order, mode, duration_minutes, total_questions, total_marks, question_type, marks_per_correct, negative_marking, sections, languages, attempts_note, notes, qualifying_note)
select e.id, v.stage, v.ord, v.mode, null, null, v.marks, v.qtype, null, null, v.sections::jsonb, 'English', v.att, v.notes, v.qual
from public.exams e
cross join (values
  ('Written', 1, 'Offline (pen and paper), over three days', 1000, 'Statistics I and II: objective (80 questions each); all other papers: descriptive',
   '[{"name":"General English","marks":100,"duration_minutes":180},{"name":"General Studies","marks":100,"duration_minutes":180},{"name":"Statistics-I (Objective)","marks":200,"questions":80,"duration_minutes":120},{"name":"Statistics-II (Objective)","marks":200,"questions":80,"duration_minutes":120},{"name":"Statistics-III (Descriptive)","marks":200,"duration_minutes":180},{"name":"Statistics-IV (Descriptive; choose 2 of 7 sections)","marks":200,"duration_minutes":180}]',
   'Held once a year in June (2026: from 19 June; 2027: from 18 June, per UPSC''s Annual Calendar). Age 21–30 on 1 August of the exam year.',
   'These are the Indian Statistical Service papers; Indian Economic Service candidates write General Economics I–III and Indian Economics instead of the Statistics papers. Statistics III and IV are half short-answer/small-problem questions and half long-answer questions.',
   'Candidates must reach a minimum in each of the six papers (20% for non-PwBD candidates in 2023–2025) and the category-wise written cut-off to be called for the viva voce.'),
  ('Viva voce', 2, 'Interview / personality test at UPSC, New Delhi', 200, 'Interview', '[]',
   'Only for candidates who clear the written stage.',
   'The final merit list is the written total (out of 1000) plus the viva voce (out of 200).',
   null)
) v(stage, ord, mode, marks, qtype, sections, att, notes, qual)
where e.slug = 'upsc-ies-iss';

-- ---------------------------------------------------------------------
-- Official syllabi
-- ---------------------------------------------------------------------
delete from public.exam_syllabus where exam_id in (select id from public.exams where slug in ('cmi-entrance','upsc-ies-iss'));

insert into public.exam_syllabus (exam_id, subject, topic, stage, source_type, source_url, verified_at, added_at, sort_order)
select e.id, v.subject, v.topic, v.stage, 'official', v.src, now(), now(), v.ord
from (values
  ('cmi-entrance', null, 'B.S. (Hons) entrance — Mathematics', 'All topics normally covered up to 12th standard in the NCERT syllabus for mathematics', 'https://www.cmi.ac.in/admissions/syllabus/ugmath-syllabus.pdf', 1),
  ('cmi-entrance', null, 'B.S. (Hons) entrance — Mathematics', 'Relations and functions, algebra, calculus, coordinate geometry, vectors and matrices (up to 3 dimensions), counting and probability', 'https://www.cmi.ac.in/admissions/syllabus/ugmath-syllabus.pdf', 2),
  ('cmi-entrance', null, 'B.S. (Hons) entrance — Mathematics', 'Everything up to 10th standard, in particular Euclidean geometry and basic number theory', 'https://www.cmi.ac.in/admissions/syllabus/ugmath-syllabus.pdf', 3),
  ('cmi-entrance', null, 'B.S. (Hons) entrance — Mathematics', 'Standard real functions (polynomial, exponential, logarithmic, trigonometric, inverse trigonometric and their combinations): roots and graphs', 'https://www.cmi.ac.in/admissions/syllabus/ugmath-syllabus.pdf', 4),
  ('cmi-entrance', null, 'B.S. (Hons) entrance — Mathematics', 'Number theory: unique prime factorisation, GCD by Euclid''s algorithm and Bezout''s lemma, modular arithmetic', 'https://www.cmi.ac.in/admissions/syllabus/ugmath-syllabus.pdf', 5),
  ('cmi-entrance', null, 'B.S. (Hons) entrance — Mathematics', 'Complex numbers in Cartesian and polar form, roots of unity, the fundamental theorem of algebra', 'https://www.cmi.ac.in/admissions/syllabus/ugmath-syllabus.pdf', 6),
  ('cmi-entrance', null, 'B.S. (Hons) entrance — Mathematics', 'Combinatorics, logical puzzles and problems combining several topics', 'https://www.cmi.ac.in/admissions/syllabus/ugmath-syllabus.pdf', 7),
  ('cmi-entrance', null, 'M.Sc./Ph.D. Mathematics entrance', 'Algebra: groups, homomorphisms, Lagrange''s and Sylow theorems, group actions, rings, ideals, fields and finite fields', 'https://www.cmi.ac.in/admissions/syllabus/pgmath-syllabus.pdf', 8),
  ('cmi-entrance', null, 'M.Sc./Ph.D. Mathematics entrance', 'Linear algebra: vector spaces, linear maps, rank, eigenvalues, diagonalisation, orthogonal matrices', 'https://www.cmi.ac.in/admissions/syllabus/pgmath-syllabus.pdf', 9),
  ('cmi-entrance', null, 'M.Sc./Ph.D. Mathematics entrance', 'Complex analysis: holomorphic functions, Cauchy formulas, residues and contour integration, conformal maps', 'https://www.cmi.ac.in/admissions/syllabus/pgmath-syllabus.pdf', 10),
  ('cmi-entrance', null, 'M.Sc./Ph.D. Mathematics entrance', 'Calculus and real analysis: sequences and series, uniform convergence, multivariable calculus, metric spaces', 'https://www.cmi.ac.in/admissions/syllabus/pgmath-syllabus.pdf', 11),
  ('cmi-entrance', null, 'M.Sc./Ph.D. Mathematics entrance', 'Topology: topological spaces, connectedness, compactness, Urysohn''s lemma, Tychonoff''s theorem', 'https://www.cmi.ac.in/admissions/syllabus/pgmath-syllabus.pdf', 12),
  ('upsc-ies-iss', 'Written', 'Statistics-I (Objective)', 'Probability', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 1),
  ('upsc-ies-iss', 'Written', 'Statistics-I (Objective)', 'Statistical Methods', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 2),
  ('upsc-ies-iss', 'Written', 'Statistics-I (Objective)', 'Numerical Analysis', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 3),
  ('upsc-ies-iss', 'Written', 'Statistics-I (Objective)', 'Computer Application and Data Processing', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 4),
  ('upsc-ies-iss', 'Written', 'Statistics-II (Objective)', 'Linear Models', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 5),
  ('upsc-ies-iss', 'Written', 'Statistics-II (Objective)', 'Statistical Inference and Hypothesis Testing', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 6),
  ('upsc-ies-iss', 'Written', 'Statistics-II (Objective)', 'Official Statistics', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 7),
  ('upsc-ies-iss', 'Written', 'Statistics-III (Descriptive)', 'Sampling Techniques', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 8),
  ('upsc-ies-iss', 'Written', 'Statistics-III (Descriptive)', 'Econometrics', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 9),
  ('upsc-ies-iss', 'Written', 'Statistics-III (Descriptive)', 'Applied Statistics', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 10),
  ('upsc-ies-iss', 'Written', 'Statistics-IV (Descriptive; any two sections)', 'Operations Research and Reliability', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 11),
  ('upsc-ies-iss', 'Written', 'Statistics-IV (Descriptive; any two sections)', 'Demography and Vital Statistics', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 12),
  ('upsc-ies-iss', 'Written', 'Statistics-IV (Descriptive; any two sections)', 'Survival Analysis and Clinical Trial', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 13),
  ('upsc-ies-iss', 'Written', 'Statistics-IV (Descriptive; any two sections)', 'Quality Control', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 14),
  ('upsc-ies-iss', 'Written', 'Statistics-IV (Descriptive; any two sections)', 'Multivariate Analysis', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 15),
  ('upsc-ies-iss', 'Written', 'Statistics-IV (Descriptive; any two sections)', 'Design and Analysis of Experiments', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 16),
  ('upsc-ies-iss', 'Written', 'Statistics-IV (Descriptive; any two sections)', 'Computing with C and R', 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', 17)
) v(slug, stage, subject, topic, src, ord)
join public.exams e on e.slug = v.slug;

update public.exams set syllabus_source_url = 'https://www.cmi.ac.in/admissions/syllabus.php', syllabus_verified_at = now(), syllabus_read_at = now()
where slug = 'cmi-entrance';
update public.exams set syllabus_source_url = 'https://www.upsc.gov.in/sites/default/files/Exam_Notification_IES_ISS_Eng_11022026.pdf', syllabus_verified_at = now(), syllabus_read_at = now()
where slug = 'upsc-ies-iss';
