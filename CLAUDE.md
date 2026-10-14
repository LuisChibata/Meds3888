# FIT-FIRST: MEDS3888 G13 (Lived Experience)

USYD design project. A website prototype that helps 18–24-year-olds who have **not yet started therapy** find a therapist who fits them, plus light self-management support. Luis builds the prototype; the rest of the group (Allysa, Auriel, Gabriella, Shahad, Vanessa) does research and questions; supervisor is Dr Belal Chami. "FIT-FIRST" is a working name; the final name is undecided.

## Project rules (decided by the group, don't re-litigate)
- **Demo only.** All therapist data is fictional and badged "Fictional demo profile". No backend, nothing leaves the page. Keep the footer disclaimer and the Lifeline 13 11 14 / 000 line.
- **Not clinical.** No symptom or diagnosis questions, no advice. Plain, neutral lay language, no mental-health labels in questions (participants self-categorise at the end). Australian English.
- **Keep it simple.** Few features. Each one must trace back to interview or Google Form evidence. Website, not native app.
- **Matching follows the research doc** (`compass_artifact_…_text_markdown.md`, section "Recommendations"): risk screen first and it overrides matching; weight therapists' self-reported specialties low (they oversell); shortlist of 2–3; patient preferences are the last layer; never publicly rank therapists; any outcome data is synthetic and labelled as such.

## Layout
- `App/`: **the real code lives here.** Empty so far; development starts here, built from the prototype below.
- `documents/`: reference material only, not the place for app code.
  - `FIT-FIRST prototype (1).html`: the existing clickable prototype (the starting point for `App/`).
  - `MEDS3888 - G13 (LIVED EXPERIENCE) workflow.md`: questionnaire Q1–Q25 (Part A base profile, Part B needs / coping / therapist fit). Canonical wording. The therapist-side questions section is empty.
  - `compass_artifact_…_text_markdown.md`: evidence for the matching algorithm.
  - `workflow_wireframe.PNG`: hand sketch. Account creation → data → Home / Self-management / Therapist finder.
  - `MEDS3888 - G13 (LIVED EXPERIENCE) general notes.md`: meeting minutes 19/08–10/10, one meeting per line. **182 KB, almost all base64 images. Never Read it whole**; the text is lines 11–27. Don't `@`-import it.

Paths contain spaces: quote them in shell.

## Running and checking
No build, package.json or tests, and Node isn't installed here. The prototype runs by opening the HTML in a browser (needs internet for Tailwind 3.4.16, React 18.3.1 and Google Fonts from CDNs). Verify UI changes in a real browser: walk landing → done, in light and dark mode, and by keyboard only. Add the run and check commands for `App/` here once its stack is chosen.

## Prototype internals (`documents/FIT-FIRST prototype (1).html`)
- One self-contained file with an inline `<script>`. No JSX or Babel: components are `React.createElement` calls. The prototype gets shared with the supervisor and teammates, so keep `App/` openable by double-click too unless we agree to add a build step.
- Data constants sit at the top: `PRIORITIES`, `PRIOR_CHANGES`, `THERAPISTS`. Every therapist's `align` needs an entry for **every** priority id, or `alignmentFor` throws.
- The flow is a `step` state machine in `App`: landing → intro → prior → select → rank → profile → compare → detail → feedback → done. A new screen needs a `switch` case plus an entry in `STEP_STAGE` (header stage) and, if it is part of the Fit Profile, `FIT_STEPS`.
- Colours are CSS variables holding space-separated RGB, mapped to Tailwind tokens (`paper surface sunken ink muted line accent ochre`). Use the tokens, not hex. Light/dark comes from `prefers-color-scheme` plus `data-theme`; define both when adding a variable.
- Accessibility is deliberate: skip link, focus moves to `#screen-title` on every step change, reduced-motion respected, alignment is never conveyed by colour alone. Don't regress it.

## Where we are (update when this changes)
- **Built:** prior-therapy question → pick priorities → rank top 3 → fit profile → compare 3 fictional therapists → detail → feedback.
- **Not built:** the account-creation questionnaire (Part A/B in workflow.md) feeding the matching; self-management (exercises, journalling, notifications; only "if we have extra time"); therapist-side account and questions; a risk screen.
- **Open:** whether the priorities flow stays or is replaced by the Part A/B questionnaire; one-file vs build step; app name.
