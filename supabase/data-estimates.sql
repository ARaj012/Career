-- Estimates and third-party figures for details the official websites do not publish
-- (or that the automated reader cannot reach). Kept apart from the official data so the
-- daily reader never overwrites, retires or mistakes them for official values. A page
-- shows an estimate only where the official value is missing, always labelled:
--   kind = 'estimate'     approximate, not officially verified (basis says how it was estimated)
--   kind = 'secondary'    from a named non-official website, not officially verified
--   kind = 'discontinued' the exam / scheme no longer runs (value_text says what replaced it)

create table if not exists public.data_estimates (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('exam', 'college', 'career', 'scholarship')),
  record_id uuid not null,
  field text not null,          -- dates | cutoffs | syllabus | status | placements | college_cutoffs | fees | salary | eligibility | how_to_enter | deadline | amount
  kind text not null check (kind in ('estimate', 'secondary', 'discontinued')),
  value_text text not null,     -- what students read, with the expected value or range
  value_min numeric,
  value_max numeric,
  unit text,                    -- e.g. 'INR per year', 'percentile', 'marks'
  basis text,                   -- how the estimate was made
  source_name text,             -- for kind = 'secondary'
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity, record_id, field)
);

create index if not exists data_estimates_record on public.data_estimates (entity, record_id);

alter table public.data_estimates enable row level security;

drop policy if exists "Public can read estimates" on public.data_estimates;
create policy "Public can read estimates" on public.data_estimates for select using (true);

drop policy if exists "Service role manages estimates" on public.data_estimates;
create policy "Service role manages estimates" on public.data_estimates for all using (auth.role() = 'service_role');
