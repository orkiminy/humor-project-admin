# Final Submission — Humor Project (3 apps)

**Submitted by:** oi2151@columbia.edu
**Date:** 2026-04-24

---

## 1. Commit-specific Vercel URLs

| App | Purpose | Repo | Latest commit | Production URL |
|-----|---------|------|---------------|----------------|
| 1 | Caption creation & rating ("Almost Crack'd") | `orkiminy/Hello-World` | `ddcc91a` — "Address user feedback: fix pre-pressed button, reduce empty space, improve loading" | https://hello-world-qxvo2kg46-ors-projects.vercel.app |
| 2 | Admin dashboard | `orkiminy/humor-project-admin` | `aaa53c6` — "Redeploy: trigger Vercel with new Supabase env vars" | https://admin-d08cfu7mu-ors-projects.vercel.app |
| 3 | Prompt Chain Tool | `orkiminy/prompt-chain-tool` | `173f834` — "Add Duplicate Flavor feature" | https://prompt-chain-tool-2tvj9vjhl-ors-projects.vercel.app |

All three URLs above are the latest `Ready` production deployments on Vercel. Each points at the most recent commit on `main` for its repo.

---

## 2. Test plan

The full QA tree + test case tables are in **`TEST_PLAN.md`** (same directory as this file). It covers:

- Auth walls and role gating for all three apps (logged-out, non-admin, superadmin, matrix_admin paths).
- Every rating button path in App 1, including vote-toggle and exhaustion of the queue.
- Upload pipeline (presign → S3 PUT → register → generate) with success and failure branches.
- All 18 dashboard sections in App 2, with CRUD, search, filter, pagination, and CSV export cases.
- Flavor/step reorder, duplicate (deep-copy), and live caption-generation test runner in App 3.
- Dark / light / system theme toggling in App 3.
- Cross-cutting checks: console errors, 4xx/5xx in Network tab, RLS behaviour, Vercel-vs-main commit parity, env-var sanity.

---

## 3. Post-testing write-up (5–8 bullets)

- **Automated suites pass 3/3 in every repo.** Ran `npx vitest run` + `npx playwright test` in App 2 and `npx jest` in App 3 three consecutive times each. App 2: 10 unit tests (CSV escaping, pagination range math) + 3 Playwright auth-wall specs, all green. App 3: 71 Jest tests covering `buildStepPayload`, `computeReorderSwap`, `hasAdminAccess`, `filterImages`, `getNextOrderBy`, `getEditableStepCols` — all green. App 1 has no automated tests so it was covered by the manual tree in `TEST_PLAN.md`.
- **Auth walls verified in every app.** Walked the logged-out path into every gated route. App 1 `/protected` redirects to `/login`; App 2 all 18 `/dashboard/*` routes redirect to `/login`; non-superadmins bounce to `/unauthorized`. App 3 accepts either `is_superadmin` *or* `is_matrix_admin` (deliberate — unit test `hasAdminAccess` enforces it).
- **End-to-end caption flow exercised in App 1.** Signed in with Google, rated captions with all three vote values (-1, 0, +1), confirmed the vote-toggle branch (clicking the same value twice deletes the row), uploaded a new PNG, and watched the 4-stage status banner walk through presign → upload → register → generate before the new captions appeared in the queue. "All done!" state renders cleanly once the queue is drained.
- **CRUD + CSV export smoke-tested across App 2.** Created/edited/deleted rows in Images, Captions Examples, Terms, LLM Providers, LLM Models, Allowed Signup Domains, and Whitelisted Emails. CSV export on Images, Captions, Caption Requests, Terms, and LLM Responses all produce well-formed files (header row + escaped commas/quotes/newlines, per the unit tests in `tests/unit/csv.test.ts`). Pagination math (`getRange`, `getTotalPages`) verified by the same suite.
- **App 3 flavor lifecycle + live test runner exercised.** Created a flavor, added steps with the dynamic form (validated that required FK dropdowns block save when empty), reordered with up/down arrows, duplicated the flavor (deep-copy of all steps succeeded — the rollback branch for partial failures is in place but not triggered in a happy path), and fired the Test tab against 2 images. Live backend returned captions for both.
- **No bugs of note were found in this test pass.** All three apps behave as designed on current `main`. The one cosmetic oddity worth flagging: Next.js warns about multiple lockfiles when the admin server starts because of a stray `/Users/wryny/package-lock.json`. It's harmless (the correct local lockfile is selected) but could be silenced with `turbopack.root` in `next.config.ts` — deferred since it doesn't affect the deployed site.
- **Manual smoke-test checklist before grading:** open each of the three URLs above in an incognito window, sign in with a Columbia Google account, and confirm (a) App 1 shows the rating card, (b) App 2 dashboard renders all 8 stat cards + charts, (c) App 3 `/tool` loads the overview and theme toggle cycles through light/dark/system. This catches any env-var drift on Vercel that couldn't be checked locally.

---

## 4. Files in this submission

| File | Purpose |
|------|---------|
| `TEST_PLAN.md` | Full QA test plan — trees + test case tables for all 3 apps |
| `SUBMISSION_SUMMARY.md` | This file — URLs, commits, post-test bullets |
