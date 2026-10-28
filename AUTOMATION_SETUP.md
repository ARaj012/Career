# Data Automation (v2)

Exam schedules, scholarship deadlines/amounts and NIRF ranks are kept up to
date from **official websites only**, without per-site scraper code.

## How it works

For every exam with an `official_url` (and every scholarship with an `application_url`):

1. **Fetch** the official page plus up to 3 linked notices/bulletins/PDFs on the same site
   (robots.txt respected, 2.5 s between requests to one host).
2. **Skip** if the pages are byte-identical to last run (no AI quota used).
3. **Read** the text with Groq (`GROQ_API_KEY`, the same key the chat uses). The model must
   return each value *with a verbatim quote* from the page.
4. **Verify**: the quote must exist on an official page and must contain that exact date/amount.
   Anything else is discarded. This is what prevents invented data.
5. **Sanity-check**: e.g. registration must end before the exam, result after it, cycle year
   must match the exam date.
6. **Apply or queue** (`AUTOMATION_AUTO_APPLY`):
   - `safe` (default): auto-apply when filling empty values or replacing unverified/tentative
     data. Changing a **verified** value, failed sanity checks, loose NIRF name matches and
     non-official sources go to **Admin → Automation** for one-click approval.
   - `all`: auto-apply everything from official sources. `none`: queue everything.

NIRF ranks are parsed deterministically from nirfindia.org tables (no AI). Rank-band entries
("101–150") are ignored because they are not ranks.

Every saved row records `source_url`, `verified_at` and `data_status`
(`verified` / `tentative` / `unverified`). Every change is kept in `automation_proposals`
with its evidence, and approvals are written to the audit log.

## One-time setup

1. Supabase SQL editor: run `supabase/automation-v2.sql`, then
   `supabase/data-corrections-2026-10.sql` (removes the mock data the old scrapers wrote),
   `supabase/college-details.sql` and `supabase/exam-content.sql`.
2. GitHub → Settings → Secrets and variables → Actions:
   - Secrets: `CAREER_GUIDANCE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`
   - Variables (optional): `APP_URL` (shown in the bot's user-agent), `AUTOMATION_AUTO_APPLY`
3. Vercel (for the admin "Check now" button): add `GROQ_API_KEY`.

## Schedule

- Daily 07:00 IST: "hot" exams (registration open, exam/result within 90 days, or no upcoming cycle).
- Sunday 05:30 IST: all exams, all scholarships, NIRF.
- 1st of each month: the 120 least-recently-checked colleges (NAAC grade, founded, fees).
- 15th of each month: 50 colleges' own websites (programmes and fees, placement reports, admission, scholarships).
- 22nd of each month: 60 exams' official syllabus and official cutoffs.
- 5th of Aug/Sep/Oct: NIRF placement sheets and JoSAA cutoffs (no AI).
- Records checked in the last 20 h are skipped unless `--force`.

## Running manually

```bash
cd apps/web
npx tsx scripts/automation.ts --slug=gate --dry-run   # see what would change
npx tsx scripts/automation.ts --mode=hot
npx tsx scripts/automation.ts --only=scholarships --limit=10 --force
```

Or GitHub → Actions → Data Automation → Run workflow.

**Admin → Automation → Update everything** checks every exam (dates, syllabus, cutoffs),
scholarship, college (courses, fees, placements, admission, NAAC) and NIRF rank in one go. The page sends ~30 s batches until nothing is left (works on Vercel too), shows
progress per section and can be stopped; keep the tab open (roughly 25–35 min for everything,
mostly polite per-site delays). Records finished in a sweep are not re-checked if you stop and
click again later. If the daily Groq limit is hit, the run stops with a message instead of
marking the rest as unreadable. The small box below it checks a single exam by slug.
**Admin → Colleges → (a college) → Update from official website** reads one college right away.

## Adding coverage

- **New exam**: add it in Admin → Exams with its official URL. Nothing else.
- **Dates live on a different page** (e.g. a separate bulletin site): add that URL to the
  exam's `source_urls` array.
- **Stop automating one record**: set `automation_enabled = false`.
- **Exam portal blocks the reader** (NTA's jeemain/neet sites and UPSC answer 403): paste the
  official syllabus PDF link into the exam's `syllabus_source_url`; the reader starts there.

## Groq quota

Free tier limits apply. Page caching and line-filtering keep each exam to ~3–4k tokens and
unchanged pages cost nothing. Each Groq model has its own daily limit: if you hit it, set
`AUTOMATION_MODEL=openai/gpt-oss-20b` (the default is `openai/gpt-oss-120b`; the evidence
check still blocks bad readings). Groq retires models over time, so check console.groq.com/docs/models.

## Known limits

- Sites that render dates only with JavaScript, or only inside scanned-image PDFs, return no
  text. Those exams are skipped and stay as they are. Add a direct PDF/notice URL to
  `source_urls`.
- Syllabus: units are saved only when at least 5 are quoted from the official syllabus and
  most of what the AI listed was confirmed. Added/removed units are recorded on the exam and
  shown on its roadmap. Exams with one syllabus PDF per paper (GATE) get a link to the official
  syllabus page instead. Topic-wise weightage is not published officially, so the old
  "Important Topics" percentages stay, labelled as an unofficial estimate.
- Exam cutoffs: each value must be quoted with its category and year from the body's own
  notice; an official year replaces that year's old rows.
- Placements: NIRF publishes data up to the batch graduating the year before its edition
  (NIRF 2025 → 2023-24). Later seasons come only from each college's own placement report.
- Eligibility and exam pattern are not automated.
