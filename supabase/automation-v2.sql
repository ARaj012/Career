-- =====================================================================
-- Automation v2: evidence-backed updates from official websites
-- Run once in the Supabase SQL editor (safe to re-run).
--
-- What this adds:
--   1. Provenance on data rows (where a value came from, when it was checked)
--   2. automation_runs      - one row per automation run (for the admin page)
--   3. automation_page_cache - content hash per URL so unchanged pages are
--                              not re-sent to the AI (saves the Groq quota)
--   4. automation_proposals - every change the bot wants to make, with the
--                              exact quote from the official page as evidence.
--                              Safe changes auto-apply; risky ones wait for
--                              one-click admin approval.
--   5. Fixes the exam_schedules duplicate bug (NULL session bypassed the
--      unique constraint, which is how GATE 2027 got inserted 5 times).
-- =====================================================================

-- ---------- 1. Provenance columns ----------
alter table public.exam_schedules add column if not exists source_url text;
alter table public.exam_schedules add column if not exists verified_at timestamptz;
alter table public.exam_schedules add column if not exists data_status text not null default 'unverified';
-- data_status: 'verified'  = matched an official page quote
--              'tentative' = official but marked tentative by the body
--              'unverified'= legacy / manually typed, never checked

alter table public.exams add column if not exists automation_enabled boolean not null default true;
-- Extra official pages to read besides official_url (bulletins, notice boards)
alter table public.exams add column if not exists source_urls text[] not null default '{}';
alter table public.exams add column if not exists last_checked_at timestamptz;

alter table public.scholarships add column if not exists automation_enabled boolean not null default true;
alter table public.scholarships add column if not exists last_checked_at timestamptz;
alter table public.scholarships add column if not exists verified_at timestamptz;

alter table public.colleges add column if not exists nirf_year integer;
alter table public.colleges add column if not exists nirf_category text;

-- ---------- 2. Fix duplicate schedules (NULL session) ----------
-- Keep the most complete row of each (exam, year, session) group, drop the rest.
-- Dedupe before filling NULL sessions, or the update hits the unique constraint.
delete from public.exam_schedules a
using public.exam_schedules b
where a.exam_id = b.exam_id
  and a.year = b.year
  and coalesce(a.session, 'Default') = coalesce(b.session, 'Default')
  and a.id <> b.id
  and (
    (num_nonnulls(a.registration_start, a.registration_end, a.exam_date_start, a.exam_date_end, a.result_date)
       < num_nonnulls(b.registration_start, b.registration_end, b.exam_date_start, b.exam_date_end, b.result_date))
    or (
      num_nonnulls(a.registration_start, a.registration_end, a.exam_date_start, a.exam_date_end, a.result_date)
        = num_nonnulls(b.registration_start, b.registration_end, b.exam_date_start, b.exam_date_end, b.result_date)
      and a.id::text > b.id::text
    )
  );

update public.exam_schedules set session = 'Default' where session is null;

alter table public.exam_schedules alter column session set default 'Default';
alter table public.exam_schedules alter column session set not null;

-- ---------- 3. Run log ----------
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  trigger text not null default 'schedule',      -- schedule | manual | github
  mode text not null default 'full',              -- full | hot | single
  status text not null default 'running',         -- running | success | partial | failed
  stats jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb
);

-- ---------- 4. Page cache ----------
create table if not exists public.automation_page_cache (
  url text primary key,
  content_hash text not null,
  fetched_at timestamptz not null default now(),
  http_status integer,
  last_error text
);

-- ---------- 5. Proposals (review queue) ----------
create table if not exists public.automation_proposals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.automation_runs(id) on delete set null,
  entity text not null,                  -- exam_schedule | scholarship | college
  table_name text not null,
  record_id uuid,                        -- null = insert a new row
  parent_id uuid,                        -- e.g. exam_id for a new schedule
  label text not null,                   -- human readable, e.g. "GATE 2027 · Default"
  changes jsonb not null,                -- { field: { old, new, evidence } }
  match_key jsonb not null default '{}'::jsonb, -- e.g. { year, session } for inserts
  source_url text not null,
  confidence numeric not null default 0,
  status text not null default 'pending',  -- pending | applied | auto_applied | rejected | superseded
  reason text,                           -- why it was queued instead of auto-applied
  fingerprint text not null,             -- dedupe identical proposals across runs
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

create unique index if not exists automation_proposals_pending_fp
  on public.automation_proposals (fingerprint) where status = 'pending';
create index if not exists automation_proposals_status_idx
  on public.automation_proposals (status, created_at desc);

-- Service role bypasses RLS; no public access on purpose.
alter table public.automation_runs enable row level security;
alter table public.automation_page_cache enable row level security;
alter table public.automation_proposals enable row level security;

-- ---------- 6. College facts from college websites (NAAC, established, fees) ----------
alter table public.colleges add column if not exists automation_enabled boolean not null default true;
alter table public.colleges add column if not exists last_checked_at timestamptz;
alter table public.colleges add column if not exists verified_at timestamptz;
