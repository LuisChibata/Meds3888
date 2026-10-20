# Thera-Fits: MEDS3888 G13 (Lived Experience)

USYD design project. A website prototype that helps 18–24-year-olds who have **not yet started therapy** find a therapist who fits them. Self-management is out of the MVP. Luis builds the prototype; the rest of the group (Allysa, Auriel, Gabriella, Shahad, Vanessa) does research and questions; supervisor is Dr Belal Chami. The site is called "Thera-Fits" (renamed from the working name "FIT-FIRST" on 15/10).

## Project rules (decided by the group, don't re-litigate)
- **MVP scope: matchmaking only, patient-focused.** 8 fictional therapists as plain seeded data in their own file. No therapist account, no self-management (questionnaire Q11–Q15 are out of the flow). Verify matching against fictional test patients, not by eye.
- **Demo only.** All therapist data is fictional and badged "Fictional demo profile". No backend, nothing leaves the page. Keep the footer disclaimer and the Lifeline 13 11 14 / 000 line.
- **Not clinical.** No symptom or diagnosis questions, no advice. Plain, neutral lay language, no mental-health labels in questions (participants self-categorise at the end). Australian English.
- **Keep it simple.** Few features. Each one must trace back to interview or Google Form evidence. Website, not native app.
- **Matching follows the research doc** (`compass_artifact_…_text_markdown.md`, section "Recommendations"): risk screen first and it overrides matching; weight therapists' self-reported specialties low (they oversell); shortlist of 2–3; patient preferences are the last layer; never publicly rank therapists; any outcome data is synthetic and labelled as such.

## Design decisions (Luis; carry these forward)
- **Matching is decoupled from the website** (14/10). A page never scores anything: it passes answers and therapists to a ranking system and draws what comes back. Ranking systems are swappable, one file each, registered with `FF.rankers.register()` and following the contract at the top of `Explainer/matching/rankers.js` (filters with reasons, an optional group, weighted parts with plain-language "said" / "has"). Ranking systems don't sort: `FF.rankers.run()` does, the same way for all of them, so the explanation on screen is always true. New matching work follows this, including any port of `App/`, which predates it and still calls `FF.match` directly.

## Layout
- `index.html` (repo root): **the front page** (15/10). Plain HTML, no React: explains the premise (why, how matching works, demo-only), then links to `App/` and `Explainer/`, whose headers link back ("About"). Same colour tokens. Its claims come from the meeting notes and the research doc; keep them in step with those.
- `netlify.toml`: publishing. A push to `master` deploys Netlify site `thera-fits` (https://thera-fits.netlify.app). Only `index.html`, `App/` and `Explainer/` are copied, keeping the repo's folder names so relative links work from file:// and online. Netlify paths are case-insensitive and redirect to lower case (`/App/` → `/app/`). A new top-level folder isn't published unless the build command changes.
- `App/`: **the basic prototype** (MVP foundation, the full 15-question flow). No build step; classic `<script>`s sharing a global `FF` namespace (ES modules don't load from file://), so load order in `index.html` matters.
  - `src/data/questions.js`: Q1–Q10, Q16–Q20 with option ids. Wording copied from the workflow doc; change it there first.
  - `src/data/therapists.js`: the 8 fictional therapists. Fields must use the option ids from questions.js (tests.html checks this).
  - `src/data/test-patients.js`: patients A–E with expectations.
  - `src/matching.js`: pure engine, `FF.match(answers, therapists)` → `{ status, shortlist, closest, ranked }`. Weights and the sourced evidence pairings are constants at the top.
  - `src/ui.js` (building blocks from the prototype), `src/app.js` (flow: landing → safety → one question per screen → results).
- `Explainer/`: **the matching explainer** (14/10). Six questions (Q6, Q16–Q20) on one page. A behind-the-scenes panel shows every therapist's filters, group and points, a per-therapist breakdown, and a switch between ranking systems. For the team and supervisor, not end users: it ranks therapists openly. Same stack and colour tokens as `App/`; its own data, so changing one prototype doesn't move the other.
  - `data/`: the six questions (canonical wording, trimmed options), the same 8 therapists cut down to the fields used, test patients A–E (E is new). `open` in a test patient = an expectation the group hasn't settled; tests report it as OPEN, not FAIL.
  - `matching/`: `rankers.js` (contract, registry, `run`, `check`), `criteria.js` (shared measurements, no weights), then one file per ranking system: `research.js` (the working spec), `checklist.js` (naive baseline: equal weights, believes self-listed areas), `access.js` (cost and waiting time first). Knows nothing about the page.
  - `site/`: `ui.js`, `app.js`. Never scores. Bar colours per kind of points are `--kind-*` in `index.html` (a validated colour-blind-safe palette, in that order; a new kind needs a colour).
  - Adding a ranking system: a new file in `matching/`, plus a `<script>` after `criteria.js` in both `index.html` and `tests.html`. The first one registered is the default.
- `documents/`: reference material only, not the place for app code.
  - `FIT-FIRST prototype (1).html`: the existing clickable prototype (the starting point for `App/`).
  - `MEDS3888 - G13 (LIVED EXPERIENCE) workflow.md`: questionnaire Q1–Q20 written (Part A base profile, Part B needs / coping / therapist fit; the Section 3 heading says Q21–Q25 but they don't exist). Canonical wording. The therapist-side questions section is empty.
  - `MVP matching proposal.md`: **draft for group review.** Therapist schema, question → matching map, the 8 fictional therapists, test patients. Not yet agreed; treat as the working spec. Section 7 (15/10) proposes patient check-ins that build therapist profiles; outside the MVP until the group agrees.
  - `compass_artifact_…_text_markdown.md`: evidence for the matching algorithm.
  - `articles/`: the papers behind section 7. **Local only, gitignored** (the GitHub repo is public; publisher copyright). Kraus 2011 (twice: `kraus2011.pdf` and a copy under its title), Constantino 2021 (`Constantino.pdf`, the matching trial; it does **not** measure therapist self-assessment), Coyne 2024 (file named after its title, no `.pdf` extension, line breaks in the name; has the self-assessment data).
  - `workflow_wireframe.PNG`: hand sketch. Account creation → data → Home / Self-management / Therapist finder.
  - `MEDS3888 - G13 (LIVED EXPERIENCE) general notes.md`: meeting minutes 19/08–10/10, one meeting per line. **182 KB, almost all base64 images. Never Read it whole**; the text is lines 11–27. Don't `@`-import it.

Paths contain spaces: quote them in shell.

## Running and checking
No build or package.json. Node is installed on the Linux machine, not on the Windows one; nothing needs it. Open `App/index.html`, `Explainer/index.html` (or the prototype) in a browser; needs internet for Tailwind 3.4.16, React 18.3.1 and Google Fonts from CDNs. `App/index.html?patient=A` (A–E) jumps straight to a test patient's results. `Explainer/index.html?patient=A&ranker=access&open=priya` loads a patient, picks a ranking system and opens a breakdown.
- **Matching tests:** open `App/tests.html`. Headless from PowerShell (the page title is `PASS n/n` or `FAIL n/n`):
  `& "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --user-data-dir="<scratchpad>\edge" --virtual-time-budget=3000 --dump-dom "file:///D:/Luis/uni/meds3888/App/tests.html"`
  On the Linux machine (Chromium), from the repo root; prints just the title:
  `chromium --headless=new --disable-gpu --user-data-dir="<scratchpad>/chr" --virtual-time-budget=5000 --dump-dom "file://$PWD/App/tests.html" 2>/dev/null | grep -o '<title>[^<]*'`
  Run after any change to weights, therapists or questions. Don't edit a test patient's expectation to make it pass; that's a group decision.
- **Explainer tests:** `Explainer/tests.html`, same commands with that path. Title is `PASS n/n (k open)`. Loads only `data/` and `matching/`, no page code. Checks every ranking system against the contract, the research-guided one against the test patients, and that each system's description stays true.
- Verify UI changes in a real browser: walk landing → results, in light and dark mode, and by keyboard only. Headless Edge `--screenshot` works for a quick look, but `--virtual-time-budget` can freeze CSS transitions mid-way (selected buttons look unselected); judge colours in a real browser.

## Prototype internals (`documents/FIT-FIRST prototype (1).html`)
- One self-contained file with an inline `<script>`. No JSX or Babel: components are `React.createElement` calls. The prototype gets shared with the supervisor and teammates, so keep `App/` openable by double-click too unless we agree to add a build step.
- Data constants sit at the top: `PRIORITIES`, `PRIOR_CHANGES`, `THERAPISTS`. Every therapist's `align` needs an entry for **every** priority id, or `alignmentFor` throws.
- The flow is a `step` state machine in `App`: landing → intro → prior → select → rank → profile → compare → detail → feedback → done. A new screen needs a `switch` case plus an entry in `STEP_STAGE` (header stage) and, if it is part of the Fit Profile, `FIT_STEPS`.
- Colours are CSS variables holding space-separated RGB, mapped to Tailwind tokens (`paper surface sunken ink muted line accent ochre`). Use the tokens, not hex. Light/dark comes from `prefers-color-scheme` plus `data-theme`; define both when adding a variable.
- Accessibility is deliberate: skip link, focus moves to `#screen-title` on every step change, reduced-motion respected, alignment is never conveyed by colour alone. Don't regress it.

## Where we are (update when this changes)
- **Built (prototype, `documents/`):** prior-therapy question → pick priorities → rank top 3 → fit profile → compare 3 fictional therapists → detail → feedback.
- **Built (`App/`, 14/10):** MVP foundation. Landing → safety screen (placeholder wording) → Q1–Q10, Q16–Q20 with must-have toggles → shortlist of 3 with per-item reasons, trade-offs and honest closest fits. 8 therapists, matching engine, tests (49/50: patient A shows Priya at #3, an open question for the group).
- **Built (`Explainer/`, 14/10):** six questions → live behind-the-scenes view: three ranking systems (research-guided, simple checklist, access first), step counts, every therapist's stacked points bar with moves after each change, per-therapist breakdown table, shortlist comparison across systems. Tests 42/42, 1 open (the same patient A / Priya question).
- **Built (front page, 15/10):** `index.html`: the premise, then a choice between the demo (`App/`) and the explainer.
- **Not built in `App/`:** therapist detail page, feedback screen, top-3-priorities step.
- **Deferred:** self-management (only "if we have extra time"); therapist-side account and questions.
- **Open:** whether the priorities flow stays or the questionnaire replaces it (leaning: questionnaire → top 3 priorities → shortlist of 3); deadline and what is assessed (not in the notes); Q3/Q7 and the "essential" toggle (see the proposal's open questions); whether to take on patient check-ins that build therapist profiles (proposal section 7, open questions 7–10).
