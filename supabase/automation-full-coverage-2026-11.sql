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
