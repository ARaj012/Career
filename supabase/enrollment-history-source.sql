-- Where each enrolment figure comes from (already applied to the live project).
-- NIRF "Data Submitted by Institution" sheets give Total Actual Student Strength for the
-- academic year before each edition: India Rankings 2025 → 2023-24.
alter table public.college_enrollment_history
  add column if not exists source_type text not null default 'unverified',
  add column if not exists source_url text,
  add column if not exists academic_year text;
comment on column public.college_enrollment_history.year is 'Year the academic year ends: 2024 for 2023-24';
comment on column public.college_enrollment_history.source_type is 'nirf = Total Actual Student Strength from the NIRF data sheet; unverified = no source';
