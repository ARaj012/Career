-- Official college cutoff reader (apps/web/src/lib/automation/engine/college-cutoffs.ts):
-- when each college was last checked, and when an official cutoff list was last read.
alter table public.colleges add column if not exists cutoffs_checked_at timestamptz;
alter table public.colleges add column if not exists cutoffs_read_at timestamptz;
create index if not exists colleges_cutoffs_checked_at_idx on public.colleges (cutoffs_checked_at nulls first);
