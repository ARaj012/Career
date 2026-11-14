-- Full coverage for "Update everything" (13 Nov 2026)
-- 1. Careers with no website of their own are read from the official sites of the exams that
--    lead into them (runner.ts), so turn automation on for the 79 that have such an exam.
update public.careers c set automation_enabled = true
where not c.automation_enabled and c.official_url is null
  and exists (select 1 from public.career_exams ce join public.exams e on e.id = ce.exam_id
              where ce.career_id = c.id and e.official_url is not null);

-- 2. Exam pattern & eligibility reader (exam-rules.ts): when each exam was last checked / read.
alter table public.exams add column if not exists rules_checked_at timestamptz;
alter table public.exams add column if not exists rules_read_at timestamptz;

-- 3. (15 Nov 2026) Course eligibility and the college application window, read by college-details.ts
alter table public.college_courses add column if not exists eligibility text;
alter table public.college_courses add column if not exists eligibility_source_url text;
alter table public.colleges add column if not exists application_opens date;
alter table public.colleges add column if not exists application_closes date;
alter table public.colleges add column if not exists application_source_url text;
