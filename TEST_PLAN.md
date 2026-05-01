# QA Test Plan — Humor Project (3 apps)

**Author:** oi2151@columbia.edu
**Date:** 2026-04-23
**Scope:** End-to-end test plan for all three submitted apps.

| # | App | Purpose | URL (local dev) |
|---|-----|---------|-----------------|
| 1 | Almost Crack'd (Caption creation & rating) | Public-facing voter/uploader | `http://localhost:3000` (Assignment 1) |
| 2 | Humor Admin | Superadmin dashboard over the whole data model | `http://localhost:3000` (Assignment 2) |
| 3 | Prompt Chain Tool | Admin-only flavor/step/image tool with live test runner | `http://localhost:3000` (Assignment 3) |

All three apps share the same Supabase backend and the external API at `https://api.almostcrackd.ai`.

---

## How to read this plan

Each app is modeled as a **tree**. The root is "open the app." Branches are user pathways. Leaves are the specific assertions run on each path. Every leaf is a pass/fail checkpoint.

A test run consists of walking every branch once. The assignment requires three runs.

Symbols used in the tables:
- **P** — Precondition (must be true before the test starts)
- **A** — Action the tester performs
- **E** — Expected result

---

# App 1 — Almost Crack'd (Caption creation & rating)

## Tree

```
open app
├── unauthenticated
│   ├── hits `/`           → sees landing card + Google sign-in button
│   ├── hits `/login`      → sees login card
│   └── hits `/protected`  → redirected to `/login`
└── authenticated (Google account)
    ├── first-visit onboarding overlay
    │   ├── shown on first render
    │   ├── dismissed via "Got it, let's go!"
    │   └── re-openable via `?` header button
    ├── rating flow
    │   ├── "Not Funny" (-1) vote
    │   ├── "Meh" (0) vote
    │   ├── "Funny!" (+1) vote
    │   ├── same button twice → vote is removed
    │   ├── progress bar increments
    │   ├── card advances on any vote
    │   ├── counter matches remaining
    │   └── all captions rated → "All done!" screen
    ├── upload flow
    │   ├── choose image (JPEG/PNG/WebP/GIF/HEIC)
    │   ├── status banner walks: presign → upload → register → generate
    │   ├── new captions appended to rating queue
    │   └── error banner on failure + X dismiss
    └── sign out
        └── returns to `/login`; `/protected` now redirects
```

## Test cases

| ID | Path | Steps | Expected |
|----|------|-------|----------|
| A1-01 | Auth wall | P: logged out. A: visit `/protected`. | E: redirect to `/login`. |
| A1-02 | Landing | P: logged out. A: visit `/`. | E: "Sign in with Google" visible, no spinner stuck. |
| A1-03 | Google sign-in | A: click Google button, complete OAuth. | E: lands on `/protected`, username greeting shown. |
| A1-04 | Onboarding first load | P: first visit (cleared localStorage). | E: overlay visible. |
| A1-05 | Onboarding dismiss | A: click "Got it". | E: overlay gone, localStorage key set. |
| A1-06 | Onboarding re-open | A: click `?` in header. | E: overlay reopens. |
| A1-07 | Vote "Funny" | A: click 🤣. | E: caption_votes row with `vote_value=1`, card advances, progress +1. |
| A1-08 | Vote "Meh" | A: click 😏. | E: row with `vote_value=0`. |
| A1-09 | Vote "Not Funny" | A: click 😑. | E: row with `vote_value=-1`. |
| A1-10 | Toggle off | A: click same vote twice on the same card (refresh to revisit). | E: second click deletes the row. |
| A1-11 | Change vote | A: vote +1, reload, vote -1. | E: row updated, not duplicated. |
| A1-12 | Exhaust queue | A: rate every loaded caption. | E: "All done!" screen with Upload CTA. |
| A1-13 | Upload happy path | A: choose valid PNG. | E: banner walks through all 4 states; new captions appended to queue. |
| A1-14 | Upload cancel | A: open picker, hit Escape. | E: no state change, no error banner. |
| A1-15 | Upload invalid file | A: choose `.txt`. | E: file input rejects OR clear error banner shown. |
| A1-16 | Upload network fail | A: disconnect wifi mid-upload. | E: error banner with dismiss `X`. |
| A1-17 | Sign out | A: click "Sign out". | E: redirected to `/login`; hitting `/protected` now redirects. |

---

# App 2 — Humor Admin

## Tree

```
open app
├── unauthenticated
│   ├── `/`            → 302 `/login`
│   ├── `/login`       → login card
│   ├── `/dashboard/*` → 302 `/login`
│   └── `/unauthorized`→ renders static page
└── authenticated
    ├── non-superadmin → 302 `/unauthorized`
    └── superadmin
        ├── Overview (/dashboard)
        │   ├── 8 stat cards render
        │   ├── 4 metric cards with bar indicators
        │   ├── 4 charts (recharts) render
        │   ├── "Top 5 captions" table populated
        │   └── "Recent 5 caption requests" table populated
        ├── Caption Ratings (/dashboard/caption-ratings)
        │   ├── headline stats (Total, Up, Down, Unique voters, 30d)
        │   ├── 4 charts render
        │   ├── 3 ranked tables render
        │   └── Top 10 voters leaderboard
        ├── Users (/dashboard/users)
        │   └── lists profiles with role badges
        ├── Images (/dashboard/images)
        │   ├── pagination (24/page)
        │   ├── client search
        │   ├── Export CSV
        │   ├── Add Image (file path)
        │   ├── Add Image (URL path)
        │   ├── preview modal (click image)
        │   ├── Edit image
        │   └── Delete image (confirms cascade)
        ├── Captions (/dashboard/captions)
        │   ├── stat cards
        │   ├── server-side search (ilike)
        │   ├── All/Public/Private filter
        │   ├── pagination (25/page)
        │   └── Export CSV (respects filter)
        ├── Caption Requests (/dashboard/caption-requests)
        │   ├── client search
        │   ├── pagination
        │   ├── status badges
        │   └── Export CSV
        ├── Caption Examples (/dashboard/caption-examples)
        │   ├── search
        │   ├── Add example
        │   ├── Edit example
        │   └── Delete example
        ├── Humor Flavors (read-only)
        ├── Humor Flavor Steps (read-only)
        ├── Humor Mix (edit-only modal)
        ├── Terms (/dashboard/terms)
        │   ├── search
        │   ├── Add term (type dropdown, priority 0-100)
        │   ├── Edit term
        │   ├── Delete term
        │   └── Export CSV
        ├── LLM Providers (CRUD)
        ├── LLM Models (CRUD)
        ├── LLM Prompt Chains (/dashboard/llm-prompt-chains)
        │   ├── header stats
        │   ├── paginated list
        │   ├── expand/collapse each row
        │   └── details view (steps + captions)
        ├── LLM Responses (/dashboard/llm-responses)
        │   ├── search
        │   ├── pagination
        │   ├── expand row → system/user/response prompts
        │   └── Export CSV
        ├── Allowed Signup Domains (CRUD)
        └── Whitelisted Emails (CRUD)
```

## Test cases

### Auth & access control

| ID | Path | Steps | Expected |
|----|------|-------|----------|
| A2-01 | Root redirect | A: visit `/`. | E: 302 `/login`. |
| A2-02 | Logged-out wall (dashboard) | A: visit `/dashboard`. | E: 302 `/login`. |
| A2-03 | Logged-out wall (users) | A: visit `/dashboard/users`. | E: 302 `/login`. |
| A2-04 | Logged-out wall (terms) | A: visit `/dashboard/terms`. | E: 302 `/login`. |
| A2-05 | Non-superadmin block | P: logged in as regular user. A: visit `/dashboard`. | E: 302 `/unauthorized`. |
| A2-06 | Superadmin pass | P: `is_superadmin=true`. A: visit `/dashboard`. | E: page renders. |
| A2-07 | Sign out | A: click "Sign Out". | E: session cleared, `/dashboard` redirects to `/login`. |

### Overview dashboard

| ID | Path | Expected |
|----|------|----------|
| A2-10 | 8 stat cards | Each shows a numeric count; none are `NaN`/undefined. |
| A2-11 | 4 metric cards | Upvote rate is a valid % (0–100); denominators not zero-divided. |
| A2-12 | Line chart (captions/day) | Renders without console errors; x-axis dated. |
| A2-13 | Bar chart (votes/day) | Up/down stacked; negative values shown below axis. |
| A2-14 | Bar chart (humor flavor) | Labels match `humor_flavors` table. |
| A2-15 | Pie chart (public vs private) | Slices sum to total captions. |
| A2-16 | Top 5 table | 5 rows, sorted by net score desc. |
| A2-17 | Recent requests table | 5 rows, sorted by created_at desc. |

### Content CRUD

| ID | Path | Expected |
|----|------|----------|
| A2-20 | Images pagination | First page has 24 items; last page ≤24; page count matches total/24. |
| A2-21 | Images search | Typing a substring filters rows in current page. |
| A2-22 | Images CSV | Downloaded CSV has header row matching visible columns. |
| A2-23 | Images Add (URL) | New row appears with that URL and description. |
| A2-24 | Images Add (file) | Presign → PUT → insert; new image visible after modal closes. |
| A2-25 | Images Edit | Changes persist after reload. |
| A2-26 | Images Delete | Warning mentions cascade; row + associated captions removed. |
| A2-27 | Images Preview modal | Opens full-size, ESC closes, "Open original" opens new tab. |
| A2-28 | Captions search | `ilike` matches return rows; empty string resets. |
| A2-29 | Captions filter All/Public/Private | Counts match the corresponding `is_public` rows. |
| A2-30 | Captions pagination | 25/page; last page shows remainder. |
| A2-31 | Captions CSV respects filter | Exported rows = filtered rows, not all. |
| A2-32 | Requests search | Client filter narrows visible rows. |
| A2-33 | Requests status badge | "pending" yellow, "completed" green. |
| A2-34 | Examples CRUD | Add/edit/delete each persist; confirm modal appears. |

### Humor system

| ID | Path | Expected |
|----|------|----------|
| A2-40 | Humor Flavors list | Columns dynamic; no CRUD buttons. |
| A2-41 | Humor Flavor Steps list | Same: read-only dynamic columns. |
| A2-42 | Humor Mix inline edit | Edit modal saves all non-system columns; no Add/Delete buttons. |

### Vocabulary (Terms)

| ID | Path | Expected |
|----|------|----------|
| A2-50 | Terms search | Filters by term or definition. |
| A2-51 | Terms add | Required "Term" blocks empty submit; priority out of 0–100 blocked; type dropdown populated from `term_types`. |
| A2-52 | Terms edit | Changes persist. |
| A2-53 | Terms delete | Confirm modal; row removed. |
| A2-54 | Terms CSV | File downloads and opens in a spreadsheet app cleanly. |

### AI / LLM

| ID | Path | Expected |
|----|------|----------|
| A2-60 | Providers CRUD | Add/edit/delete work; active toggle persists. |
| A2-61 | Models CRUD | Provider FK input accepted; active toggle persists. |
| A2-62 | Prompt Chains row expand | Steps list and captions list render; no overflow clipping. |
| A2-63 | Prompt Chains `<details>` prompts | System/user prompts expand on click, show raw text. |
| A2-64 | Prompt Chains pagination | Prev disabled on page 1; Next disabled on last page. |
| A2-65 | LLM Responses search | Client filter narrows rows in current page. |
| A2-66 | LLM Responses expand | `<pre>` blocks preserve whitespace; long content scrolls. |
| A2-67 | LLM Responses CSV | Row cap ≤5000 enforced; header row present. |

### Access control (data)

| ID | Path | Expected |
|----|------|----------|
| A2-70 | Allowed Domains CRUD | Add/edit/delete a domain (e.g. `columbia.edu`). |
| A2-71 | Whitelisted Emails CRUD | Add/edit/delete an email; search filters. |

### Negative / edge cases

| ID | Path | Expected |
|----|------|----------|
| A2-90 | Delete cancel | Confirm modal "Cancel" button leaves row intact. |
| A2-91 | Empty required field | Save button disabled or modal stays open with error text. |
| A2-92 | Search with no results | Shows an empty-state message, not a broken grid. |
| A2-93 | Pagination beyond bounds | Typing `?page=9999` clamps to last page or shows empty. |

---

# App 3 — Prompt Chain Tool

## Tree

```
open app
├── unauthenticated
│   ├── `/`           → /tool → auth wall → /login
│   ├── `/login`      → login card
│   └── `/unauthorized`→ static page
└── authenticated
    ├── non-admin (neither flag)  → /unauthorized
    ├── superadmin OR matrix_admin → passes gate
    │   ├── theme toggle (light / dark / system)
    │   ├── Overview (/tool)
    │   │   ├── 4 stat cards link to their sections
    │   │   └── 2 nav tiles link correctly
    │   ├── Flavors list (/tool/flavors)
    │   │   ├── table renders slug + steps count
    │   │   ├── "+ New Flavor"
    │   │   ├── Open → detail
    │   │   ├── Edit
    │   │   ├── Duplicate (deep-copy with new slug)
    │   │   └── Delete (cascade warning)
    │   ├── Flavor detail (/tool/flavors/[id])
    │   │   ├── inline edit slug/description
    │   │   ├── Steps tab
    │   │   │   ├── step list in order
    │   │   │   ├── Up / Down reorder
    │   │   │   ├── Add Step (dynamic form, FK validation)
    │   │   │   ├── Edit Step
    │   │   │   └── Delete Step
    │   │   ├── Captions tab (read-only, ≤100)
    │   │   └── Test tab
    │   │       ├── search + select images
    │   │       ├── Run Test (N)
    │   │       └── results render per image (captions or error)
    │   └── Images (/tool/images)
    │       ├── grid of ≤500
    │       ├── search
    │       ├── Add (file or URL)
    │       ├── Edit
    │       └── Delete
    └── sign out → /login
```

## Test cases

### Auth & access control

| ID | Path | Steps | Expected |
|----|------|-------|----------|
| A3-01 | Root redirect | A: visit `/`. | E: redirects to `/tool`. |
| A3-02 | Auth wall | P: logged out. A: visit `/tool`. | E: 302 `/login`. |
| A3-03 | Non-admin | P: logged in, neither flag. | E: 302 `/unauthorized`. |
| A3-04 | superadmin passes | P: `is_superadmin=true`. | E: page renders. |
| A3-05 | matrix_admin passes | P: `is_matrix_admin=true`. | E: page renders. |
| A3-06 | Both flags | P: both true. | E: page renders (unit test `hasAdminAccess` covers this). |

### Theme

| ID | Path | Expected |
|----|------|----------|
| A3-10 | Toggle dark | A: click theme button until dark. | E: `html` class has `dark`; tiles + tables readable. |
| A3-11 | Toggle system | A: set system to dark, toggle to "system". | E: page follows OS. |
| A3-12 | Persistence | A: reload after setting dark. | E: stays dark. |

### Flavors CRUD

| ID | Path | Expected |
|----|------|----------|
| A3-20 | New flavor | Slug required; description optional; row appears in table. |
| A3-21 | Duplicate flavor | Deep-copies all steps with new slug. If one step fails, rollback (no half-copy). |
| A3-22 | Edit flavor | Slug + description persist after reload. |
| A3-23 | Delete flavor | Steps cascade-deleted; confirm modal shown. |
| A3-24 | Open flavor | Navigates to `/tool/flavors/[id]`. |

### Flavor detail — Steps tab

| ID | Path | Expected |
|----|------|----------|
| A3-30 | Steps list | Rendered in ascending `order_by`; badge shows order #. |
| A3-31 | Add step — all fields | FK dropdowns populated from `llm_models`, `llm_input_types`, `llm_output_types`, `humor_flavor_step_types`. |
| A3-32 | Add step — missing FK | Save disabled or inline error. |
| A3-33 | Add step — numeric coercion | Temp `"0.7"` → stored as `0.7` (unit test `buildStepPayload` covers). |
| A3-34 | Edit step | Changes persist. |
| A3-35 | Delete step | Confirm modal; row removed. |
| A3-36 | Move step up | Order swaps with previous neighbor (unit test `computeReorderSwap` covers). |
| A3-37 | Move step down | Order swaps with next neighbor. |
| A3-38 | Boundary up on first step | Button disabled or no-op. |
| A3-39 | Boundary down on last step | Button disabled or no-op. |

### Flavor detail — Captions tab

| ID | Path | Expected |
|----|------|----------|
| A3-40 | Captions list | ≤100 captions, most recent first, each shows content + image ID. |
| A3-41 | Empty captions | Empty-state message shown, not a broken layout. |

### Flavor detail — Test tab (live backend)

| ID | Path | Expected |
|----|------|----------|
| A3-50 | Search images | Client filter narrows grid. |
| A3-51 | Select one image | Orange border + counter "(1)". |
| A3-52 | Multi-select | "(N)" counter matches selected count. |
| A3-53 | Run test (1 image) | POST to `/pipeline/generate-captions`; captions list per image. |
| A3-54 | Run test (N images) | Captions returned for each. |
| A3-55 | Test with no selection | Button disabled. |
| A3-56 | Backend error | Error banner per image, no crash. |
| A3-57 | Inline edit slug | Save persists; Cancel reverts. |

### Images

| ID | Path | Expected |
|----|------|----------|
| A3-60 | Grid load | ≤500 images render; no n+1 request flood. |
| A3-61 | Search | URL or description substring filters (unit test `filterImages` covers). |
| A3-62 | Add image (file) | Presign → PUT → insert; appears at top. |
| A3-63 | Add image (URL) | Insert with live preview. |
| A3-64 | Edit image | URL + description persist. |
| A3-65 | Delete image | Confirm modal; row removed. |

### Negative

| ID | Path | Expected |
|----|------|----------|
| A3-90 | Invalid slug (duplicate) | Supabase unique-constraint error surfaced; no duplicate row. |
| A3-91 | Delete flavor mid-test-run | Navigate guard OR request errors cleanly. |
| A3-92 | Session expired during CRUD | Action redirects to `/login` rather than silent fail. |

---

# Cross-cutting tests

These aren't app-specific but must pass in every run.

| ID | Area | Check |
|----|------|-------|
| X-01 | Console | No uncaught errors / red warnings in browser devtools during any flow. |
| X-02 | Network | No 4xx/5xx responses in devtools Network tab (except deliberate tests like "delete non-existent"). |
| X-03 | Supabase RLS | Non-admin can't read admin tables even if URL guessed. |
| X-04 | Commit parity | The live Vercel URL deployment SHA matches the latest `main` commit SHA per repo. |
| X-05 | Env vars | Each Vercel project has working `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |

---

# Run log (3 runs required)

Three passes of the tree above. Mark each test case **PASS / FAIL / SKIP**.

| Run | Date | App 1 | App 2 | App 3 | Blockers fixed |
|-----|------|-------|-------|-------|----------------|
| 1 | 2026-04-23 | _to fill_ | _to fill_ | _to fill_ | _to fill_ |
| 2 | 2026-04-23 | _to fill_ | _to fill_ | _to fill_ | _to fill_ |
| 3 | 2026-04-23 | _to fill_ | _to fill_ | _to fill_ | _to fill_ |

---

# Automated test inventory

| Suite | Location | Count | Command |
|-------|----------|-------|---------|
| App 1 | (none) | 0 | — |
| App 2 Playwright auth wall | `tests/e2e/auth-wall.spec.ts` | 3 | `npx playwright test` |
| App 2 Vitest CSV util | `tests/unit/csv.test.ts` | 6 | `npx vitest run` |
| App 2 Vitest pagination | `tests/unit/pagination.test.ts` | 4 | `npx vitest run` |
| App 3 Jest flavor logic | `__tests__/flavor-logic.test.ts` | ~66 | `npx jest` |

Automated tests run as part of every pass. All must be green before a pass is marked complete.
