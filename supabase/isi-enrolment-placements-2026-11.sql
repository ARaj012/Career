-- ISI student strength and placements, 2022-23 to 2024-25, from ISI's own documents (read 12 Nov 2026):
--   NIRF returns ISI submitted and publishes on its website (one return covers all ISI centres):
--     https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2025.pdf  (students 2023-24; batches to 2023-24)
--     https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf  (students 2024-25; batches to 2024-25)
--   ISI Annual Report 2024-25, section 2.4 "Placement In Industry" (course-wise, by centre):
--     https://www.isical.ac.in/isical_web/files/about/publications/annual-reports/Annual_Report_2024-25.pdf
--   ISI Bengaluru placement brochure 2025-26, "Placement Statistics of '24-'25":
--     https://www.isibang.ac.in/~placement/ISI%20INFOGRAPHIC%20AND%20PLACEMENT%20REPORT%20FINAL.pdf
-- The 2025-26 batch is not published yet: it appears in NIRF 2027 and the 2025-26 annual report.

begin;

-- Student strength (UG + PG, all years of study). The 2022-23 row (950, NIRF 2024) is already there.
update public.college_enrollment_history h set
  total_students = v.n, source_type = 'nirf', source_url = v.url, academic_year = v.ay
from (values
  (2024, 1108, '2023-24', 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2025.pdf'),
  (2025, 1241, '2024-25', 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf')
) as v(yr, n, ay, url)
where h.college_id = (select id from public.colleges where slug = 'isi-kolkata') and h.year = v.yr;

insert into public.college_enrollment_history (college_id, year, total_students, source_type, source_url, academic_year)
select c.id, v.yr, v.n, 'nirf', v.url, v.ay
from public.colleges c, (values
  (2024, 1108, '2023-24', 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2025.pdf'),
  (2025, 1241, '2024-25', 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf')
) as v(yr, n, ay, url)
where c.slug = 'isi-kolkata'
on conflict (college_id, year) do nothing;

-- Unsourced guesses for years no official document covers yet
delete from public.college_enrollment_history
where college_id = (select id from public.colleges where slug = 'isi-kolkata')
  and source_type = 'unverified' and year in (2022, 2026);

-- NIRF placement rows: batches graduating 2023-24 and 2024-25
insert into public.college_placements
  (college_id, year, program_level, source_type, total_eligible_students, students_placed, placement_rate, median_package, higher_studies, source_url, notes)
select c.id, v.yr, v.lvl, 'nirf', v.grads, v.placed, v.rate, v.median, v.hs, v.url,
  'Whole-institute figures: ISI files one NIRF return covering all its centres (Kolkata, Delhi, Bengaluru, Chennai, Tezpur). B.Stat and B.Math graduates usually continue to ISI''s M.Stat and M.Math.'
from public.colleges c, (values
  (2024, 'UG 3-year', 55, 0, null::numeric, null::numeric, 55, 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf'),
  (2025, 'UG 3-year', 67, 0, null, null, 67, 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf'),
  (2024, 'PG 1-year', 140, 25, 17.9, 778000, 4, 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf'),
  (2025, 'PG 1-year', 130, 130, 100, 1585000, 0, 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf'),
  (2024, 'PG 2-year', 291, 227, 78.0, 2177000, 64, 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf'),
  (2025, 'PG 2-year', 316, 177, 56.0, 2247000, 139, 'https://www.isical.ac.in/isical_web/files/quicklinks/ISI_NIRF_2026.pdf')
) as v(yr, lvl, grads, placed, rate, median, hs, url)
where c.slug = 'isi-kolkata'
on conflict (college_id, year, program_level, source_type) do update set
  total_eligible_students = excluded.total_eligible_students, students_placed = excluded.students_placed,
  placement_rate = excluded.placement_rate, median_package = excluded.median_package,
  higher_studies = excluded.higher_studies, source_url = excluded.source_url, notes = excluded.notes;

-- Same note on the older NIRF rows; NIRF reports 0 UG graduates placed (all went on to study)
update public.college_placements set
  notes = 'Whole-institute figures: ISI files one NIRF return covering all its centres (Kolkata, Delhi, Bengaluru, Chennai, Tezpur). B.Stat and B.Math graduates usually continue to ISI''s M.Stat and M.Math.',
  students_placed = case when program_level = 'UG 3-year' then 0 else students_placed end
where college_id = (select id from public.colleges where slug = 'isi-kolkata') and source_type = 'nirf';

-- Unsourced "All programs" row (average 25.5 L, highest 89 L, 100% placed) that no ISI document supports
delete from public.college_placements
where college_id = (select id from public.colleges where slug = 'isi-kolkata') and source_type = 'unverified';

-- Course-wise placements of the 2024-25 batch, by centre (ISI Annual Report 2024-25 and ISI Bengaluru's report)
insert into public.college_placements
  (college_id, year, program_level, source_type, total_eligible_students, students_placed, median_package, average_package, highest_package, source_url, notes)
select c.id, 2025, v.lvl, 'official_report', v.sought, v.placed, v.median, v.avg, v.high, s.url, v.note
from (values
  ('isi-kolkata', 'Course: M.Stat', 38, 38, 2000000, null::numeric, 5000000, 'AR', 'ISI Annual Report 2024-25, Placement in Industry (Kolkata programmes; "sought jobs" = job-market candidates).'),
  ('isi-kolkata', 'Course: M.Tech (CS)', 31, 31, 1600000, null, 3700000, 'AR', 'ISI Annual Report 2024-25, Placement in Industry (Kolkata programmes; "sought jobs" = job-market candidates).'),
  ('isi-kolkata', 'Course: MS (QE)', 10, 10, 1550000, null, 3700000, 'AR', 'ISI Annual Report 2024-25, Placement in Industry (Kolkata programmes; "sought jobs" = job-market candidates).'),
  ('isi-kolkata', 'Course: M.Tech (CrS)', 4, 4, 1700000, null, 2700000, 'AR', 'ISI Annual Report 2024-25, Placement in Industry (Kolkata programmes; "sought jobs" = job-market candidates).'),
  ('isi-kolkata', 'Course: M.Tech (QROR)', 9, 9, 1800000, null, 6600000, 'AR', 'ISI Annual Report 2024-25, Placement in Industry (Kolkata programmes; "sought jobs" = job-market candidates).'),
  ('isi-bangalore', 'Course: MS (QMS)', 10, 10, 1800000, null, 2000000, 'AR', 'ISI Annual Report 2024-25, Placement in Industry ("sought jobs" = job-market candidates).'),
  ('isi-bangalore', 'Course: All programmes (MS QMS, MS LIS, M.Math, PhD)', null, null, 2073000, 2159000, 3000000, 'BLR', 'ISI Bengaluru placement cell, Placement Statistics of 2024-25 (data up to June 2025).'),
  ('isi-chennai', 'Course: PGDSMA', 7, 7, 600000, null, 700000, 'AR', 'ISI Annual Report 2024-25, Placement in Industry ("sought jobs" = job-market candidates).')
) as v(slug, lvl, sought, placed, median, avg, high, src, note)
join public.colleges c on c.slug = v.slug
cross join lateral (select case v.src
  when 'AR' then 'https://www.isical.ac.in/isical_web/files/about/publications/annual-reports/Annual_Report_2024-25.pdf'
  else 'https://www.isibang.ac.in/~placement/ISI%20INFOGRAPHIC%20AND%20PLACEMENT%20REPORT%20FINAL.pdf' end as url) s
on conflict (college_id, year, program_level, source_type) do update set
  total_eligible_students = excluded.total_eligible_students, students_placed = excluded.students_placed,
  median_package = excluded.median_package, average_package = excluded.average_package,
  highest_package = excluded.highest_package, source_url = excluded.source_url, notes = excluded.notes;

-- An unverified ISI Kolkata "B.Stat 2026: 158" college cutoff that contradicts ISI's own notice
-- (Stage II qualifying score 202/400 for GEN/EWS); the exam's cutoff table carries the official figures.
delete from public.college_exam_cutoffs
where source_type = 'unverified'
  and exam_id = (select id from public.exams where slug = 'isi-admission-test');

commit;
