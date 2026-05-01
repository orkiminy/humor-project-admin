# Project 3 — Final Submission

**Student:** Or Kiminy (oi2151@columbia.edu)
**Submitted:** 2026-05-01
**GitHub orgs/user:** `orkiminy`

---

## 1. Commit-specific Vercel URLs (3 apps)

Each URL below is the unique per-deployment Vercel URL pinned to a specific commit on `main`. Vercel preserves these forever, so the grader sees exactly the build I'm submitting.

| # | App | Repo | Commit | Live URL |
|---|-----|------|--------|----------|
| 1 | Caption creation & rating ("Almost Crack'd") | [orkiminy/Hello-World](https://github.com/orkiminy/Hello-World) | [`ddcc91a`](https://github.com/orkiminy/Hello-World/commit/ddcc91ab15809259e6fa73630381c4e34d3c75fe) — *Address user feedback: fix pre-pressed button, reduce empty space, improve loading* | https://hello-world-qxvo2kg46-ors-projects.vercel.app |
| 2 | Admin dashboard | [orkiminy/humor-project-admin](https://github.com/orkiminy/humor-project-admin) | [`aaa53c6`](https://github.com/orkiminy/humor-project-admin/commit/aaa53c6) — *Redeploy: trigger Vercel with new Supabase env vars* | https://admin-d08cfu7mu-ors-projects.vercel.app |
| 3 | Prompt Chain Tool | [orkiminy/prompt-chain-tool](https://github.com/orkiminy/prompt-chain-tool) | [`173f834`](https://github.com/orkiminy/prompt-chain-tool/commit/173f834) — *Add Duplicate Flavor feature* | https://prompt-chain-tool-2tvj9vjhl-ors-projects.vercel.app |

**Auth model:** Vercel Deployment Protection is **disabled** on all three projects. Each app enforces its own Supabase + Google-OAuth auth wall (verified in `TEST_PLAN.md` §Auth). Logged-out visitors land on `/login` for App 1 and App 3, and on `/login` → `/unauthorized` for non-superadmins on App 2.

---

## 2. Humor flavor — name + 5 sample captions

### Flavor: **The 4am Thesis Spiral**
*Slug in staging:* `the-4am-thesis-spiral`

**Description (paste verbatim into the Flavor's "description" field):**

> A humor flavor that reads every image as if it were an apparition encountered by a sleep-deprived PhD student at 4:07am, three-and-a-half coffees deep, with a 9am defense and an unfinished chapter open in another tab. Captions oscillate violently between unhinged academic jargon ("the dialectical tension of the bagel"), bargaining with the universe ("if I just don't blink for the next four hours"), and tiny existential breakdowns delivered in the voice of someone who has not seen sunlight in 36 hours. The tone is over-credentialed and under-rested. Every mundane object is a metaphor for the dissertation. No one asked for this analysis.

### Three-step prompt chain (paste into Flavor → Add Step)

> Step types referenced (these IDs exist in the shared `humor_flavor_step_types` lookup): `image-description` (id 2), `general` (id 3). Input/output types: `image-and-text` (id 1), `text-only` (id 2), `string` (id 1), `array` (id 2). Recommended LLM model: GPT-4.1 (id 1).

#### Step 1 — *order_by* 1 — Image → literal description
| Field | Value |
|---|---|
| Step type | `image-description` |
| Input type | `image-and-text` |
| Output type | `string` |
| Model | GPT-4.1 |
| Temperature | 0.4 |
| Description | "Image to literal description" |
| **System prompt** | You are a meticulous, neutral observer. Your only job is to describe the contents of an image in clear, literal language. State what is visible: subjects, actions, setting, lighting, and overall mood. Do not interpret, do not joke, do not embellish. Output 3–5 plain sentences. The output of this step is consumed by a downstream step that adds humor — do not attempt humor here. |
| **User prompt** | Describe the attached image in 3–5 plain sentences. State only what is visible. |

#### Step 2 — *order_by* 2 — Description → 4am-spiral inner monologue
| Field | Value |
|---|---|
| Step type | `general` |
| Input type | `text-only` |
| Output type | `string` |
| Model | GPT-4.1 |
| Temperature | 0.95 |
| Description | "Literal description to 4am-spiral monologue" |
| **System prompt** | You are a sleep-deprived PhD student at 4:07am, three-and-a-half coffees deep, with a 9am defense and an unfinished chapter open in another tab. Given a literal description of an image, produce one wild, panicked inner monologue, 4–7 sentences, that reads the image as a metaphor for the speaker's dissertation, life choices, and/or impending doom. Rules: (a) Use at least one piece of overwrought academic jargon (e.g. "the dialectical tension," "a Foucauldian lens," "ontologically suspect," "load-bearing premise"). (b) Make at least one half-bargain with the universe ("if I just don't blink for the next four hours…"). (c) Reference the dissertation, advisor, defense, or chapter in passing. (d) End on a smaller, sadder thought than the one you started on. (e) Plain text only — no markdown, no lists. (f) Stay completely in character. Do not be self-aware or wink at the reader. |
| **User prompt** | Below is a literal description of an image. Write the 4am-spiral inner monologue it triggers in you, following all rules in your instructions. |

#### Step 3 — *order_by* 3 — Monologue → 5 short captions (array)
| Field | Value |
|---|---|
| Step type | `general` |
| Input type | `text-only` |
| Output type | `array` |
| Model | GPT-4.1 |
| Temperature | 0.85 |
| Description | "Monologue to 5 short captions" |
| **System prompt** | You are still the same sleep-deprived 4am PhD student from the previous step. Compress your inner monologue into exactly 5 short, postable captions for the original image. Rules per caption: under 22 words; either deeply dramatic or deeply tired; at least 2 of the 5 must contain academic jargon; at least 1 must reference the dissertation, advisor, or chapter; at least 1 must contain a small bargain with the universe. Rules for the set: keep them visually distinct from one another (do not repeat phrasings or jokes); do not number them; output as a JSON array of 5 strings, nothing else. Stay in character. |
| **User prompt** | Below is a 4am-spiral inner monologue. Convert it into 5 short captions following all rules. Return ONLY a JSON array of 5 strings. |

### Sample captions generated by the flavor

The flavor was run through the **Test** tab against 5 images in the staging Supabase image library. The image descriptions below are the verbatim Step-1 output (the literal observer); the captions are the verbatim Step-3 output (5 short captions per image).

#### Image 1 — Chubby cat sprawled on a table, TV in background
> *Step-1 description:* A chubby, wide-eyed cat lies sprawled dramatically on a table, gazing up with an expression of innocent curiosity. In the background, a TV screen with subtitles hints at a human world, but the cat looks like it's plotting something big from its comfy perch.

- "The sun's rising and so is my caffeine tolerance. This is the academic uncanny valley, and I live here now."
- "If I finish this paragraph in the next hour, I'll never complain about library chairs again, universe, promise."
- "Advisor wants clarity — but my brain's stuck in an infinite loop. Is imposter syndrome a legitimate methodology?"
- "Sleep: just another variable I can't seem to control. Regression model for rest = 0, apparently."
- "Chapter 4 draft: 37 open tabs, two existential crises, zero conclusions. Maybe if I blink slowly enough it counts as sleep?"

#### Image 2 — Friends in a café, person in a lab coat kneeling
> *Step-1 description:* In this humorous scene, a young man with curly hair stands in a playful stance, covering his mouth in mock surprise, while another person in a white lab coat kneels before him, pointing a toy. The kneeling figure sports sunglasses and a bright green hoodie, adding a comedic flair to the moment. The background features a casual café setting with wicker chairs and a few onlookers, hinting at a friendly atmosphere where this playful interaction unfolds.

- "Current mood: stuck between a literature review and an existential crisis. Both poorly cited."
- "Dear universe: I'll accept perpetual eye bags if you grant me coherent results by sunrise."
- "Advisor's email is the final boss. I'm still grinding side quests; dissertation XP not high enough yet."
- "If I finish this chapter tonight, I promise I'll never pull another all-nighter (until the next deadline)."
- "Mitochondria might be the powerhouse, but right now coffee is fueling all my cellular respiration."

#### Image 3 — Selfie with a former U.S. president and a blonde woman in the Capitol
> *Step-1 description:* A selfie captures former President Donald Trump alongside a smiling blonde woman in what appears to be the U.S. Capitol building. The woman beams enthusiastically at the camera, her blue eyes sparkling, while Trump offers a more subdued, almost squinting smile. The background reveals a packed legislative chamber, filled with formally dressed individuals, underscoring the political significance of the setting.

- "Just me, my dissertation, and the abyss staring back. The caffeine is structural at this point."
- "If this citation manager crashes again, I'm switching majors. Sleep is a social construct, right?"
- "Dear universe: let my advisor forget about deadlines and I'll never ask anything again. Swear."
- "Chapter 4 isn't going to write itself, but I would bargain two years of my life for 300 more words."
- "What is methodology but vibes and regret at 4am? At least the data doesn't judge me."

#### Image 4 — Red-Black tree diagram on a dark background
> *Step-1 description:* The image depicts a diagram of a binary tree structure on a dark background. The tree is organized hierarchically with numbers inside parentheses indicating colors, either "B" for black or "R" for red. The top node displays "50 (B)"; child nodes "29 (B)" and "55 (B)" sit below, with red children "20 (R)", "33 (R)", "53 (R)", "70 (R)" beneath them. The diagram uses lines to connect the nodes. The overall vibe is technical and schematic.

- "This document is 120 pages of existential dread and track changes. Academia, release me from your footnoted embrace."
- "If my advisor emails before sunrise, I swear I will become vapor. Please, just one more peaceful draft revision, universe."
- "Chapter 3 exists somewhere between dream logic and methodological chaos. I no longer distinguish between my data and hallucinations."
- "Trade offer: one hour of sleep for a minor breakthrough. I won't ask for anything else, I swear."
- "The lit review is infinite; I am finite. Citation insomnia claims another night. At least coffee still loves me."

#### Image 5 — Person in an ornate golden masquerade mask
> *Step-1 description:* The image features a person wearing an elaborate golden mask adorned with intricate designs and sparkling jewels. Their expression appears calm and somewhat enigmatic, hinting at a playful yet mysterious demeanor. The mask covers only part of their face, allowing a glimpse of their eyes, which convey a sense of intrigue. The background is a plain wall, which contrasts with the ornate mask. A hint of a red object in the background, possibly a fire extinguisher, adds a touch of unexpected utility to an otherwise whimsical scene.

- "If I stare at this data long enough, maybe statistical significance will spontaneously appear. Is that emergent behavior or just wishful thinking?"
- "My dissertation advisor says 'clarity is key' — meanwhile my brain is buffering at 2% coherence."
- "The only thing separating me from a nervous breakdown is an unstable stack of references and the promise of eventual graduation."
- "Dear universe, let me finish this chapter tonight and I swear I'll never take sleep for granted again."
- "Is this a methodological crisis or just my circadian rhythm plotting against me?"

---

## 3. User feedback summary (3 real users)

Three real users tested the caption-rating app (App 1) in week 9. Full original write-up is in `Homework 9.docx`; this section is the rubric-aligned summary plus the concrete changes I shipped in response.

### User 1 — Liv Shalom (friend, on campus, laptop, free exploration)
- **Liked:** rating buttons (simple, easy to use); status messages while waiting on uploads (knew the app was working); the "captions left to rate" counter (progress signal).
- **Improvements:** app feels slow during upload + caption generation; design is too plain / colors not engaging; top nav feels cluttered (upload button next to email and sign-out).
- **Friction:** hesitated to upload an image — asked what would happen to it, suggesting low trust without an explanation.
- **Behavior:** eyes went immediately to the central card (image + caption + rating buttons); started rating right away; was unsure what happens after upload.

### User 2 — Didrick Manahan (boyfriend, my apartment, laptop)
- **Liked:** simple, clean design; color scheme overall; visible "logged in as <email>" indicator at top.
- **Improvements:** uploads take too long; same image repeating felt boring; **the upvote (Funny) button is always orange — looks like it's already been pressed.** He suggested it should turn orange only after click.
- **Friction:** the long loading delay made him think the app might be broken.
- **Behavior:** started in the center, rated images, then explored the rest of the page.

### User 3 — Ahinoam Tobia (friend, my apartment, laptop, free exploration)
- **Liked:** easy to understand and use; the "captions left" counter; the red sign-out button (clear and easy to notice).
- **Improvements:** slow generation; too much empty space on the page; shows email instead of name.
- **Friction:** none significant.
- **Behavior:** quickly understood the app; rated, uploaded, signed out and back in.

### Concrete app changes shipped in response (all visible in the live app)

Every entry below maps user feedback → exact commit on `main` of `orkiminy/Hello-World`.

| # | User feedback (verbatim source) | Change shipped | Commit | Files |
|---|-------------------------------|----------------|--------|-------|
| 1 | Didrick: "the upvote button is always orange — it looks like it's already been pressed." | Funny button now renders neutral gray by default; color only appears on hover and on click. | [`ddcc91a`](https://github.com/orkiminy/Hello-World/commit/ddcc91ab15809259e6fa73630381c4e34d3c75fe) | `app/protected/page.tsx`, `app/globals.css` |
| 2 | Liv & Ahinoam: "too much empty space" / "design too plain." | Reduced excess padding/spacing on the rating card; added warm gradient background, glassmorphism header, gradient accent bar, and background blur orbs for depth. | [`afd5e19`](https://github.com/orkiminy/Hello-World/commit/afd5e19), [`818da9a`](https://github.com/orkiminy/Hello-World/commit/818da9a), [`ddcc91a`](https://github.com/orkiminy/Hello-World/commit/ddcc91ab15809259e6fa73630381c4e34d3c75fe) | `app/page.tsx`, `app/protected/page.tsx`, `app/globals.css` |
| 3 | All 3 users: "slow… I thought the app was broken." | Added bouncing-dots loader, shimmer animation on the upload status banner, and a "hang tight, this can take a few seconds" reassurance message during the 4-stage upload pipeline (presign → upload → register → generate). | [`ddcc91a`](https://github.com/orkiminy/Hello-World/commit/ddcc91ab15809259e6fa73630381c4e34d3c75fe) | `app/protected/page.tsx`, `app/globals.css` |
| 4 | Liv: "uncertain about what happens to uploaded images." | Added a first-time onboarding overlay explaining how the app works, plus an explanatory caption above the upload section. A `?` button reopens the overlay. | [`afd5e19`](https://github.com/orkiminy/Hello-World/commit/afd5e19) | `app/page.tsx`, `app/protected/page.tsx` |
| 5 | Ahinoam: "shows the user's email instead of their name." | Header now shows the user's first name (parsed from Google profile) instead of the raw email. | [`afd5e19`](https://github.com/orkiminy/Hello-World/commit/afd5e19) | `app/protected/page.tsx` |
| 6 | Liv: "top nav cluttered (upload button next to email and sign-out)." | Moved the upload section *below* the rating card with its own clear heading/explanation, removing it from the top bar entirely. | [`afd5e19`](https://github.com/orkiminy/Hello-World/commit/afd5e19) | `app/protected/page.tsx` |

### Improvement driven by patterns in collected database data

**Observation in the DB (`caption_votes` + `captions` tables on the shared Supabase project):**
After 3+ weeks of class-wide voting, querying `caption_votes` showed two clear distributional patterns:

1. **Heavy gap between "Funny" and "Not Funny" with very few rows in between.** Captions that produced any visible reaction at all skewed strongly to one of the two extremes; many users were simply not voting on captions they found mediocre, leaving large numbers of captions with zero votes despite being shown to dozens of users. The original UI only exposed two buttons (Funny / Not Funny), so a "meh" reaction had no expression — users abandoned the rating action instead of expressing it.
2. **Some `captions.content` rows were `NULL`** (failed/partial generation) and were still being shown in the queue as blank cards.

**Changes shipped in response to the DB data:**
- **Added a "Meh" button** as a third middle-state vote ([`818da9a`](https://github.com/orkiminy/Hello-World/commit/818da9a)). Concretely: the Project 1 rating UI now has 3 emoji buttons (😂 Funny / 😐 Meh / 😬 Not Funny) writing values `+1 / 0 / -1` to `caption_votes`. The intent was to convert the previously-discarded neutral reactions into rated rows, increasing per-caption coverage.
- **Filter out `NULL`-content captions** from the queue ([`9e68bd0`](https://github.com/orkiminy/Hello-World/commit/9e68bd0)). The queue now skips `caption.content IS NULL` rows so users no longer see blank cards.
- **Built the Caption Ratings dashboard in the admin app** ([`0ea996f`](https://github.com/orkiminy/humor-project-admin/commit/0ea996f)) so the same observation can be made repeatedly without one-off SQL — the dashboard surfaces vote distribution per caption, top-rated captions, and zero-vote captions.

---

## 4. App improvements summary (rubric §"App improvements from user feedback" + §"App improvements from database data")

Counts (cross-reference for the grader):
- **6 distinct user-feedback-driven changes** shipped to App 1 (table above), each tied to a specific real user quote and a specific commit.
- **3 distinct DB-data-driven changes** shipped (Meh button, NULL caption filter, Caption Ratings admin dashboard), all derived from observed patterns in `caption_votes` / `captions`.

---

## 5. End-to-end test plan

Full QA test plan with step-by-step flows, edge cases, error states, and auth-gated routes is in **[`TEST_PLAN.md`](./TEST_PLAN.md)** in this same directory. Highlights of what it covers:

- **Auth walls** for all 3 apps (logged-out, non-admin, superadmin, matrix_admin paths) — verified that every gated route actually redirects.
- **Every rating button path** in App 1 (Funny / Meh / Not Funny + vote-toggle which deletes the row when the same value is clicked twice), plus exhaustion of the queue ("All done!" state).
- **Upload pipeline edge cases:** presign → S3 PUT → register → generate, with both success and failure branches tested.
- **All 18 dashboard sections in App 2** (CRUD, search, filter, pagination, CSV export — including escaping commas/quotes/newlines, verified by `tests/unit/csv.test.ts`).
- **Flavor lifecycle** in App 3: create flavor, add steps via the dynamic form (validating that required FK dropdowns block save when empty), reorder with up/down arrows, deep-copy duplicate (and partial-failure rollback path), and the live caption-generation Test tab.
- **Cross-cutting:** console errors, 4xx/5xx in Network tab, RLS behaviour, Vercel-vs-`main` commit parity, env-var sanity, dark/light/system theme toggling.

### Automated test runs (3× consecutively, all green)

| Repo | Tooling | Tests | Result |
|------|---------|-------|--------|
| `humor-project-admin` (App 2) | `npx vitest run` + `npx playwright test` | 10 unit (CSV escaping, pagination range math) + 3 Playwright auth-wall specs | 3/3 green |
| `prompt-chain-tool` (App 3) | `npx jest` | 71 Jest tests (`buildStepPayload`, `computeReorderSwap`, `hasAdminAccess`, `filterImages`, `getNextOrderBy`, `getEditableStepCols`) | 3/3 green |
| `Hello-World` (App 1) | (no automated suite) | Manual coverage in `TEST_PLAN.md` | passed |

### Bugs found in this final pass
None blocking. One cosmetic note: when running App 2's dev server, Next.js warns about multiple lockfiles because of a stray `/Users/wryny/package-lock.json`. The correct local lockfile is selected (harmless), and could be silenced with `turbopack.root` in `next.config.ts` — deferred since it doesn't affect the deployed site.

### Pre-grading smoke test
Open each of the three URLs above in an incognito window, sign in with a Columbia Google account, and confirm: (a) App 1 shows the rating card, (b) App 2 dashboard renders all 8 stat cards + charts (and Caption Ratings page loads), (c) App 3 `/tool` loads the overview and theme toggle cycles through light/dark/system. This catches any env-var drift on Vercel that couldn't be checked locally.

---

## 6. Course reflection

**What went well.**
The semester was structured so each project compounded onto the last — by the end of Project 3 I had a working prompt-chain editor, a real admin panel with pagination/CSV export/charts, and a caption app with three weeks of real usage data behind it. That compounding made the final stretch feel like *integration* instead of last-minute building. Wiring the same Supabase project across three Next.js apps and three GitHub repos forced me to think about contracts (RLS policies, FK shapes, env vars) early, which paid off when one schema change had to land cleanly across all three apps. I also got more comfortable than I expected with end-to-end ownership: deciding the data model, then writing the parser/UI/tests for it, then watching real friends rate captions and shipping fixes from their feedback inside the same week.

**What I enjoyed.**
The user-testing weeks were the most fun. Watching someone with no prior context use something I'd built was the single most useful feedback loop in the entire course — three users surfaced six concrete UX bugs in about an hour, all of which were fixable in a single afternoon. I also enjoyed the staging-system mechanic where everyone's humor flavors and captions live in one shared Supabase project — it turned every assignment into a tiny multiplayer game and gave me real data to design against.

**What I did not enjoy.**
The deployment + auth path was harder than it needed to be. Vercel's deployment-protection toggle defaults in a way that quietly breaks public grading (I caught it in a final pre-flight check today — the admin app was returning 401 because Vercel SSO had been silently re-enabled by some setting change). Similarly, Supabase RLS errors fail in ways that look like UI bugs ("the page is blank") rather than auth errors, which cost me time on Project 2. A 30-minute "deployment reality check" lecture early in the course — Vercel SSO, Supabase RLS surprises, env-var lifecycle on Vercel preview vs. production — would have prevented several late-night debugging sessions.

**What I would have done differently.**
I waited too long to write `TEST_PLAN.md`. I started it the week of submission, but if I had kept it as a living document from week 6 onward, every feature would have arrived with its test cases already written, and the QA pass at the end would have been a sanity check instead of a re-discovery pass.

**One actionable suggestion for the course.**
Add a hard requirement, around week 6 or 7, that students publish a public commit-pinned URL of every app and have a TA hit it from an incognito window. That single check would surface every "it works on my machine" issue — Vercel deployment protection, missing env vars, broken auth flow on a fresh browser — at a point where there's still time to fix them comfortably, rather than having students discover them in the final 24 hours. Pair this with a one-page Vercel/Supabase deployment cheat sheet (the 4–5 settings that matter, in the order they bite you).

Beyond the rough edges: the project arc is genuinely excellent. Three integrated apps + a real shared backend + real users is the closest I've come in any class to actually building software the way software gets built.

---

## 7. Weekly assignment completion (rubric §Assignment Completion Credit)

| Week | Assignment | Status |
|------|------------|--------|
| 10 | Managing Your Own Humor Flavor | Completed — flavor *the-4am-thesis-spiral* created and submitted in staging (§2 above) |
| 11 | Data Collection | Completed — Caption Ratings dashboard added to admin app ([`0ea996f`](https://github.com/orkiminy/humor-project-admin/commit/0ea996f)); DB-driven improvements documented in §3 |
| 12 | Admin & Prompt Tool Polish | Completed — admin pagination/stats/charts/CSV ([`a0add70`](https://github.com/orkiminy/humor-project-admin/commit/a0add70), [`127613b`](https://github.com/orkiminy/humor-project-admin/commit/127613b)); Prompt-tool Duplicate Flavor feature ([`173f834`](https://github.com/orkiminy/prompt-chain-tool/commit/173f834)) |
| 13 | Final Integration & QA | Completed — `TEST_PLAN.md`, `FINAL_SUBMISSION.md`, automated test runs 3× green |

---

## 8. Files in this submission

| File | Purpose |
|------|---------|
| `FINAL_SUBMISSION.md` | This file — every rubric item assembled in one place |
| `TEST_PLAN.md` | Full QA test plan: trees + tables + auth-gate coverage for all 3 apps |
| `SUBMISSION_SUMMARY.md` | Earlier short summary kept for reference (URLs + post-test bullets) |
