-- =====================================================================
-- Careers: facts from the official body that regulates or recruits for
-- each career (eligibility, how to enter, licence, official pay).
-- Only careers with automation_enabled = true and an official_url are read.
-- Salary/growth/demand fields are not touched: no official body publishes them.
-- Safe to run more than once.
-- =====================================================================

alter table public.careers add column if not exists official_body text;
alter table public.careers add column if not exists official_url text;
alter table public.careers add column if not exists source_urls text[] not null default '{}';
alter table public.careers add column if not exists automation_enabled boolean not null default false;
alter table public.careers add column if not exists last_checked_at timestamptz;
alter table public.careers add column if not exists facts_read_at timestamptz;  -- set only after a successful read
alter table public.careers add column if not exists verified_at timestamptz;

-- Each list item is a sentence copied from the official page: [{"text": "…", "source_url": "…"}]
alter table public.careers add column if not exists eligibility jsonb not null default '[]'::jsonb;
alter table public.careers add column if not exists how_to_enter jsonb not null default '[]'::jsonb;
alter table public.careers add column if not exists licence text;
-- Official pay/stipend as published (government and defence roles), per month in rupees
alter table public.careers add column if not exists official_pay text;
alter table public.careers add column if not exists official_pay_min integer;
alter table public.careers add column if not exists official_pay_max integer;
alter table public.careers add column if not exists facts_source_url text;

notify pgrst, 'reload schema';
