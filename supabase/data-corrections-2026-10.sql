-- =====================================================================
-- Data corrections — checked 27 Oct 2026
-- Run AFTER automation-v2.sql.
--
-- The old scrapers fell back to hardcoded mock values whenever scraping
-- failed (which was always — the CSS selectors were placeholders) and
-- wrote those values into production. This file:
--   A. sets schedules that have been officially announced
--   B. removes schedules that were invented (not announced yet)
--   C. removes the placeholder syllabus/cutoff rows the old script inserted
--      after deleting the real rows
-- Each value below is from the conducting body's notice/calendar.
-- =====================================================================

begin;

-- ---------- A. Official URLs ----------
-- gate.iitb.ac.in hosted GATE 2021. GATE 2027 is organised by IIT Madras.
update public.exams set official_url = 'https://gate2027.iitm.ac.in' where slug = 'gate';

-- ---------- A. Announced schedules ----------
-- JEE Main 2027 Session 1 — NTA information bulletin / public notice, 24 Oct 2026
-- (exam days revised to 20, 21, 22, 23, 24 & 28 Jan 2027; NTA labels dates tentative)
insert into public.exam_schedules
  (exam_id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, source_url, verified_at, data_status)
select id, 2027, 'Session 1', '2026-10-24', '2026-11-22', '2027-01-20', '2027-01-28', null,
       'https://jeemain.nta.nic.in', now(), 'tentative'
from public.exams where slug = 'jee-main'
on conflict (exam_id, year, session) do update set
  registration_start = excluded.registration_start, registration_end = excluded.registration_end,
  exam_date_start = excluded.exam_date_start, exam_date_end = excluded.exam_date_end,
  result_date = excluded.result_date, source_url = excluded.source_url,
  verified_at = excluded.verified_at, data_status = excluded.data_status;

-- JEE Main 2027 Session 2 — registration window in the same bulletin; April exam days not fixed yet
insert into public.exam_schedules
  (exam_id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, source_url, verified_at, data_status)
select id, 2027, 'Session 2', '2027-01-05', '2027-02-03', null, null, null,
       'https://jeemain.nta.nic.in', now(), 'tentative'
from public.exams where slug = 'jee-main'
on conflict (exam_id, year, session) do update set
  registration_start = excluded.registration_start, registration_end = excluded.registration_end,
  exam_date_start = excluded.exam_date_start, exam_date_end = excluded.exam_date_end,
  result_date = excluded.result_date, source_url = excluded.source_url,
  verified_at = excluded.verified_at, data_status = excluded.data_status;

-- GATE 2027 — IIT Madras. GOAPS opened 2 Sep 2026; final (late-fee) close 12 Oct 2026;
-- exam 6, 7, 13, 14, 20, 21 Feb 2027; result 19 Mar 2027
insert into public.exam_schedules
  (exam_id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, source_url, verified_at, data_status)
select id, 2027, 'Default', '2026-09-02', '2026-10-12', '2027-02-06', '2027-02-21', '2027-03-19',
       'https://gate2027.iitm.ac.in', now(), 'verified'
from public.exams where slug = 'gate'
on conflict (exam_id, year, session) do update set
  registration_start = excluded.registration_start, registration_end = excluded.registration_end,
  exam_date_start = excluded.exam_date_start, exam_date_end = excluded.exam_date_end,
  result_date = excluded.result_date, source_url = excluded.source_url,
  verified_at = excluded.verified_at, data_status = excluded.data_status;

-- GATE 2026 (historical) — IIT Guwahati. Existing row wrongly had 2027 exam dates.
insert into public.exam_schedules
  (exam_id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, source_url, verified_at, data_status)
select id, 2026, 'Default', '2025-08-28', '2025-10-09', '2026-02-07', '2026-02-15', '2026-03-19',
       'https://gate2026.iitg.ac.in', now(), 'verified'
from public.exams where slug = 'gate'
on conflict (exam_id, year, session) do update set
  registration_start = excluded.registration_start, registration_end = excluded.registration_end,
  exam_date_start = excluded.exam_date_start, exam_date_end = excluded.exam_date_end,
  result_date = excluded.result_date, source_url = excluded.source_url,
  verified_at = excluded.verified_at, data_status = excluded.data_status;

-- CAT 2026 — IIM Indore. Registration 3 Aug–22 Sep 2026 (extended); exam 29 Nov 2026.
-- Result only "likely by first week of January 2027" → left empty until announced.
insert into public.exam_schedules
  (exam_id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, source_url, verified_at, data_status)
select id, 2026, 'Default', '2026-08-03', '2026-09-22', '2026-11-29', '2026-11-29', null,
       'https://iimcat.ac.in', now(), 'verified'
from public.exams where slug = 'cat'
on conflict (exam_id, year, session) do update set
  registration_start = excluded.registration_start, registration_end = excluded.registration_end,
  exam_date_start = excluded.exam_date_start, exam_date_end = excluded.exam_date_end,
  result_date = excluded.result_date, source_url = excluded.source_url,
  verified_at = excluded.verified_at, data_status = excluded.data_status;

-- UPSC CSE 2027 — UPSC Annual Calendar 2027 (published 20 May 2026).
-- Notification 13 Jan 2027, apply by 2 Feb 2027, Prelims 23 May 2027 (Mains from 20 Aug 2027).
-- Result date was invented → cleared.
insert into public.exam_schedules
  (exam_id, year, session, registration_start, registration_end, exam_date_start, exam_date_end, result_date, source_url, verified_at, data_status)
select id, 2027, 'Default', '2027-01-13', '2027-02-02', '2027-05-23', '2027-05-23', null,
       'https://upsc.gov.in', now(), 'tentative'
from public.exams where slug = 'upsc-cse'
on conflict (exam_id, year, session) do update set
  registration_start = excluded.registration_start, registration_end = excluded.registration_end,
  exam_date_start = excluded.exam_date_start, exam_date_end = excluded.exam_date_end,
  result_date = excluded.result_date, source_url = excluded.source_url,
  verified_at = excluded.verified_at, data_status = excluded.data_status;

-- ---------- B. Remove invented future schedules ----------
-- CAT 2027 (result date was before exam date), JEE Advanced 2027 and NEET UG 2027
-- have not been announced. The new automation will add them when they are.
delete from public.exam_schedules s using public.exams e
where s.exam_id = e.id and (
     (e.slug = 'cat'          and s.year = 2027)
  or (e.slug = 'jee-advanced' and s.year = 2027)
  or (e.slug = 'neet-ug'      and s.year = 2027)
);

-- ---------- C. Remove placeholder syllabus & cutoffs ----------
-- These exact rows are the old scrapers' getMock*() return values.
-- The real rows they replaced were deleted by the old script; restore them
-- from a Supabase backup if you have one, otherwise re-enter via admin.
delete from public.exam_syllabus s using public.exams e
where s.exam_id = e.id and e.slug in ('gate', 'jee-advanced', 'upsc-cse')
  and (s.weightage in (15, 20, 25, 30) or s.weightage is null)
  and s.topic in ('Algorithms','Calculus','Data Structures','Databases','Linear Algebra',
                  'Numerical Ability','Operating Systems','Verbal Ability','Algebra',
                  'Electromagnetism','Inorganic Chemistry','Mechanics','Organic Chemistry',
                  'Ancient','Constitution','Macroeconomics','National','Physical');

delete from public.exam_national_cutoffs c using public.exams e
where c.exam_id = e.id and (
     (e.slug = 'gate'         and c.category in ('General','OBC-NCL','SC','ST') and c.cutoff_score in (28.5, 25.7, 19.2, 12.7))
  or (e.slug = 'jee-advanced' and c.category in ('General','OBC-NCL','SC','ST') and c.cutoff_score in (85, 70, 45, 35))
  or (e.slug = 'upsc-cse'     and c.category in ('General','OBC','SC','ST')     and c.cutoff_score in (125, 115, 105, 95))
);

-- Sanity report: anything left that is still logically impossible
select e.slug, s.year, s.session, s.registration_end, s.exam_date_start, s.result_date
from public.exam_schedules s join public.exams e on e.id = s.exam_id
where (s.registration_end > s.exam_date_start)
   or (s.result_date < s.exam_date_start)
   or (s.exam_date_end < s.exam_date_start);

commit;
