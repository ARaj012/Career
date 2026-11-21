-- Student tools (applied as migrations on 21 Nov 2026):
-- previous-year papers, exam reminder emails. The scholarship matcher and the
-- fees-vs-placements view need no new tables.

-- ── Previous-year papers (found on official sites by apps/web/scripts/papers.ts) ──
create table if not exists public.exam_papers (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  url text not null,
  title text not null,
  kind text not null check (kind in ('question_paper','answer_key','sample_paper')),
  year integer,
  source_url text,
  found_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (exam_id, url)
);
create index if not exists exam_papers_exam_year on public.exam_papers (exam_id, year desc);
comment on table public.exam_papers is 'Links to previous-year question papers, answer keys and sample papers on each exam''s official website (found by the papers reader; files stay on the official site)';
alter table public.exam_papers enable row level security;
create policy "Public can read exam papers" on public.exam_papers for select using (true);
create policy "Service role can manage exam papers" on public.exam_papers for all using (auth.role() = 'service_role');
alter table public.exams add column if not exists papers_checked_at timestamptz;

create or replace view public.exam_paper_summary with (security_invoker = true) as
select p.exam_id,
       count(*)::int as files,
       count(distinct p.year)::int as years,
       max(p.year) as latest_year,
       min(p.year) as earliest_year,
       count(*) filter (where p.kind = 'question_paper')::int as question_papers,
       count(*) filter (where p.kind = 'answer_key')::int as answer_keys
from public.exam_papers p
group by p.exam_id;
grant select on public.exam_paper_summary to anon, authenticated;

-- ── Exam reminder emails (apps/web/scripts/exam-alerts.ts, daily) ──
create table if not exists public.user_alert_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_alerts boolean not null default true,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  last_email_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.user_alert_settings enable row level security;
create policy "Users read own alert settings" on public.user_alert_settings for select using (auth.uid() = user_id);
create policy "Users insert own alert settings" on public.user_alert_settings for insert with check (auth.uid() = user_id);
create policy "Users update own alert settings" on public.user_alert_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Service role manages alert settings" on public.user_alert_settings for all using (auth.role() = 'service_role');

create table if not exists public.exam_alert_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  event text not null check (event in ('registration_start','registration_end','exam_date','result')),
  event_date date not null,
  threshold integer not null,
  email_status text not null check (email_status in ('sent','mock','failed','off')),
  created_at timestamptz not null default now(),
  unique (user_id, exam_id, event, event_date, threshold)
);
create index if not exists exam_alert_log_user on public.exam_alert_log (user_id, created_at desc);
alter table public.exam_alert_log enable row level security;
create policy "Users read own alert log" on public.exam_alert_log for select using (auth.uid() = user_id);
create policy "Service role manages alert log" on public.exam_alert_log for all using (auth.role() = 'service_role');

-- ── Fee fixes (21 Nov 2026) ──
-- The 19 Nov automation run overwrote two verified fees; restored from the
-- official notices recorded in college-fees-official-2026-11*.sql:
--   NIT Trichy: ₹62,500 (one semester's tuition) → ₹1,52,750 a year
--   IIM Ranchi: range restored to ₹9,45,000–₹9,75,000 with the official note
