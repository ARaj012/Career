-- Data corrections, November 2026, part 2: full audit of all 366 colleges.
-- PART A is applied to the live project. PART B removes data and waits for approval.

-- ============================== PART A (applied) ==============================

-- NIRF ranks with no year (91 colleges, hand-typed). Checked against every NIRF 2025 ranking list
-- (nirfindia.org): these 25 have an exact 2025 rank, now set with its year and category.
update public.colleges c set nirf_rank = v.rank, nirf_year = 2025, nirf_category = v.cat
from (values
  ('BITS Pilani', 'Engineering', 11), ('Bangalore University', 'University', 65), ('Tata Institute of Social Sciences', 'University', 72),
  ('GB Pant University of Agriculture and Technology', 'Agriculture', 9), ('Hindu College Delhi', 'College', 1), ('Lady Shri Ram College Delhi', 'College', 17),
  ('Shri Ram College of Commerce Delhi', 'College', 18), ('St Xaviers College Mumbai', 'College', 89), ('Institute of Management Studies FORE Delhi', 'Management', 59),
  ('SP Jain Institute of Management and Research', 'Management', 20), ('Jawaharlal Institute of Postgraduate Medical Education', 'Medical', 4),
  ('King Georges Medical University Lucknow', 'Medical', 8), ('Maulana Azad Medical College Delhi', 'Medical', 26),
  ('Postgraduate Institute of Medical Education and Research', 'Medical', 2), ('St Johns Medical College Bangalore', 'Medical', 30),
  ('KIIT University', 'University', 17), ('Madras University', 'University', 38), ('National Institute of Technology Surathkal', 'Engineering', 17),
  ('National Institute of Technology Trichy', 'Engineering', 9), ('Indian Institute of Technology Dhanbad', 'Engineering', 15),
  ('SRM Institute of Science and Technology', 'Engineering', 14), ('Orissa University of Agriculture and Technology', 'Agriculture', 19),
  ('School of Planning and Architecture Delhi', 'Architecture', 8), ('JSS College of Pharmacy Mysuru', 'Pharmacy', 7),
  ('Manipal College of Pharmaceutical Sciences', 'Pharmacy', 8)
) v(name, cat, rank)
where c.name = v.name and c.nirf_year is null;

-- IIT Bombay and IIT Madras had their NIRF 2025 Engineering ranks swapped (official: Madras 1, Bombay 3)
update public.colleges set nirf_rank = 1 where name = 'Indian Institute of Technology Madras' and nirf_year = 2025 and nirf_category = 'Engineering';
update public.colleges set nirf_rank = 3 where name = 'Indian Institute of Technology Bombay' and nirf_year = 2025 and nirf_category = 'Engineering';

-- One label per level, as the college page groups them, and levels clear from the course name
update public.college_courses set degree_type = 'Undergraduate' where degree_type in ('UG', 'B.E.', 'B.Tech');
update public.college_courses set degree_type = 'Postgraduate' where degree_type = 'PG';
update public.college_courses set degree_type = 'Undergraduate' where degree_type is null and course_name in
  ('B.A. LL.B. (Hons.)', 'B.Com (Hons.)', 'B.Sc. (AI & Data Analytics)', 'B.Sc.LL.B.', 'B.Tech', 'B.Tech.', 'BA.LL.B.', 'BBA (Hons.)', 'BMS (Virtual Learning Mode)', 'BS-ESS', 'BSDS', 'eBBA');
update public.college_courses set degree_type = 'Postgraduate' where degree_type is null and
  course_name ~* '^(m\.|mba|master|executive mba|executive master|msc|pgp|post[- ]?graduate|epgd|two-year master|professional master)';
update public.college_courses set degree_type = 'Doctoral' where degree_type is null and course_name ~* '^(full time )?fellow programme in management$|^efpm$';
update public.college_courses set degree_type = 'Integrated' where degree_type is null and course_name = 'IPM (BBA + MBA)';

-- Placement rate that disagreed with its own placed / eligible counts (two unverified rows)
update public.college_placements set placement_rate = round(100.0 * students_placed / total_eligible_students, 1)
where source_type = 'unverified' and placement_rate is not null and students_placed > 0 and total_eligible_students > 0
  and abs(placement_rate - 100.0 * students_placed / total_eligible_students) > 2;

-- ========================= PART B (awaiting approval) =========================
-- Removed rows are copied to *_backup_2026_11 tables first (row level security on, no policies).

-- B1. The other 66 year-less NIRF ranks: not in any NIRF 2025 list (many are magazine rankings,
--     e.g. IHM Delhi "#1", NID "#1", or a parent university's rank). Cleared.
-- update public.colleges set nirf_rank = null where nirf_rank is not null and nirf_year is null;

-- B2. Enrolment history: every college has exactly 2022-2026 rising to a round number, 243 at a
--     constant rate, with no source. Generated, not reported. Back up, then remove.
-- create table public.college_enrollment_history_backup_2026_11 as table public.college_enrollment_history;
-- alter table public.college_enrollment_history_backup_2026_11 enable row level security;
-- delete from public.college_enrollment_history;

-- B3. 5 unverified cutoffs with no course where one college, exam, year and category has several values.
-- B4. Duplicate courses: the unverified copy where an official row exists (AIIMS Mangalagiri MBBS,
--     St Xavier's Mumbai BA and BSc), the empty copy (IHM Pusa BSc HHA, Mumbai University BSc), and
--     the placeholder "fee 100000, seats 80" BA LLB rows at NALSAR and NLSIU; plus 4 non-courses
--     ('Under Graduate', 'Summer Visiting Students Programme', 'ODLP Courses', 'Executive Training Programme').
