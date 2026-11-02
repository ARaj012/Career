# Security audit: 2026-11-01

Scope: `apps/web` (Next.js 16) and Supabase project `fqsdhigkpknppewxoezi`.
Severity: **Critical** = anyone can do it now and it matters; **High** = real abuse path; **Medium** = needs conditions or has limited impact; **Low** = hardening.

## Action needed from you

1. ~~Apply `supabase/security-hardening.sql`~~ **Applied on 2026-11-01** and tested in a rolled-back transaction as a signed-in user:
   - Blocked: inserting or upgrading to a paid plan, extending a paid period, touching another user's row, fake payments, usage writes, counting usage for another user.
   - Still works: creating the free plan and toggling cancel.
2. **Restart the dev server on port 3000** (PID 108872). I upgraded Next 16.2.3 → 16.4.3 for a critical advisory. That server still has the old version loaded and returns 500 on every request until it restarts.
3. Optional: in the Supabase dashboard, turn on *Leaked password protection* (Auth → Providers → Email). Login uses Google only, so this barely matters.

## Findings

| # | Severity | Area | Finding | Status |
|---|----------|------|---------|--------|
| 1 | **Critical** | RLS | `user_subscriptions` let a signed-in user insert/update their own row with any `plan_id`/`status`. Anyone could make themselves Pro with one REST call. | Fixed (applied) |
| 2 | **Critical** | Payments | Mock payment mode turned on whenever Razorpay keys were missing, including in production, and took `planId` from the client. Any user could grant themselves any plan for free. | Fixed |
| 3 | **Critical** | Deps | `next@16.2.3` had a critical advisory. | Fixed (16.4.3) |
| 4 | High | Payments | The webhook compared the signature against `hmac + '\|' + body`, so it never matched and every real webhook was rejected. It also used the anon browser client (writes blocked by RLS), and the proxy's CSRF check rejected it (Razorpay sends no Referer). | Fixed |
| 5 | High | Payments | Real-mode `/verify` didn't check that the order belonged to the caller, so one user's paid order could be redeemed by another. It used a plain `!==` signature compare and wrote the subscription with the user's own client. | Fixed |
| 6 | High | Admin | `GET /api/admin/users` upserted `is_active: true` for every user on every page load, undoing deactivation. The auth callback did the same on each login (silently blocked by RLS today). Deactivated users could also still log in. | Fixed |
| 7 | Medium | RLS | `user_usage`: users could rewrite their own usage counters. `payment_history`: users could insert their own "completed" payments. | Fixed (applied) |
| 8 | Medium | API | `GET /api/cleanup-tracking` deleted all of a user's tracked exams, so a link or `<img>` on any site could trigger it (CSRF, since only POST/PUT/PATCH/DELETE were checked). | GET removed |
| 9 | Medium | API | Debug routes in production: `/api/test` echoed any POST body and `/api/debug-exams` returned user IDs and tracked exams. | Deleted |
| 10 | Medium | Advisors | 2 SECURITY DEFINER views (`college_scholarships_detail`, `college_scholarship_counts`), `handle_new_auth_user()` callable over RPC by anon/auth, 7 functions with mutable `search_path`, batch functions executable by anon. | Fixed (applied) |
| 11 | Medium | Proxy | The CSRF check crashed with a 500 on a malformed Referer and blocked browsers that strip Referer. | Fixed (Origin first, Referer fallback, try/catch) |
| 12 | Low | Headers | No CSP, Permissions-Policy or frame-ancestors, and `X-Powered-By` was exposed. Headers were set only through the proxy. | Fixed in `next.config.ts` |
| 13 | Low | Redirect | Callback/login `next` checked only `startsWith('/')`. It wasn't exploitable (origin is prefixed) but was fragile. | Hardened with `safeRedirectPath()` |
| 14 | Low | Abuse | Only chat was rate limited. | Added limits to payments (10/min/user) and recommendations (20/min/user) |
| 15 | Low | Logging/info | `my-exams` and `track-exam` logged full request bodies and data dumps and returned DB error text to clients. | Trimmed |
| 16 | Low | Input | `/api/admin/users` passed `sort_by` straight to `.order()`. `track-exam` didn't validate `trackingType`/`examSlug`. | Allow-listed / validated |

## Checked and found OK

- **Admin access.** All 9 `/api/admin/*` routes call `getAdminUser()` (driven by `ADMIN_EMAILS`) on every handler. `/admin/*` pages are client shells under `admin/layout.tsx` (`requireAdmin()`) and load data only through those routes. The `records` route allow-lists tables.
- **Student routes.** Every user route filters by `user.id` from `auth.getUser()` and uses the user's own client, so RLS backs it up. No IDOR found on saved items, profile, notifications or preferences.
- **RLS.** Enabled on every public table. All `user_*` tables are own-row only. Admin and automation tables have RLS with no policies (service role only), which is intended. `retire_replaced_unverified` is already revoked from anon/authenticated.
- **Secrets.** No `.env*` file is tracked or ever was in git history. No JWT, `gsk_`, `rzp_` or `sb_secret_` strings appear in history. Service-role, Groq and Razorpay keys are read only in server files, and no `'use client'` file imports `supabase-admin`. Only `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`, `APP_URL` and `ADMIN_EMAILS` are public.

## Still open

- **The rate limits live in memory.** On Vercel they reset per instance, so they slow abuse but don't hard-cap it. For a real cap on Groq spend, move `lib/rate-limit.ts` to Upstash Redis (`@upstash/ratelimit`) or a Supabase table.
- **`NEXT_PUBLIC_ADMIN_EMAILS` puts admin emails in the client bundle.** It's used only for display on `/admin/settings`. Consider serving it from `/api/admin/me` instead.
- **`/admin/subscriptions` reads `user_subscriptions` with the browser client,** so under RLS an admin sees only their own row. This is a functional bug, not a leak. It should go through an admin API route.
- **Remaining `npm audit` items are in CLI and dev tooling** (`shadcn` → MCP SDK/express, `prisma`). `zod` needs a `shadcn@1` major bump. None runs in the request path.
- **The CSP allows `'unsafe-inline'` scripts** so pages can stay static. A nonce-based CSP would force every page to render dynamically.
- **Deactivation is enforced at login only.** A session that is already open lasts until its token expires.

## Files

- New: `supabase/security-hardening.sql`, `src/lib/payments.ts` (+test), `src/lib/safe-redirect.ts` (+test)
- Changed: `next.config.ts`, `src/proxy.ts`, `src/app/auth/callback/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/api/payments/{create-order,verify,webhook}/route.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/{cleanup-tracking,track-exam,recommendations,exams/my-exams}/route.ts`, `src/lib/rate-limit.ts`, `package.json` / `package-lock.json` (next and eslint-config-next 16.4.3)
- Deleted: `src/app/api/test/route.ts`, `src/app/api/debug-exams/route.ts`
- Behaviour change: in production without Razorpay keys, `/pricing` checkout now returns "Payments are not available right now." instead of granting a plan.
