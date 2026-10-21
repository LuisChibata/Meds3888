# Thera-Fits

A website prototype that helps 18–24-year-olds who haven't started therapy yet find a therapist who fits them. It's a University of Sydney MEDS3888 design project by Group 13 (Lived Experience).

There are two prototypes:

- **`App/`, the basic prototype:** the full flow a person would go through, from 15 questions to a shortlist of three.
- **`Explainer/`, the matching explainer:** how Thera-Fits builds a profile of the person and of each therapist, and how matching connects them. It has two pages:
  - `story.html`, the walkthrough, for anyone: an animated story of about three minutes that follows one fictional person.
  - `index.html`, the details, for the project team and supervisor: the same engine with every number on show, your own answers, and a choice of ranking systems.

`index.html` at the top of the repo is the front page: it explains the project, then links to the demo and the walkthrough, with the details one link further. It's published at https://thera-fits.netlify.app, which updates whenever `master` changes (see `netlify.toml`).

> **Demo only.** Every therapist profile is fictional. Thera-Fits doesn't provide therapy, diagnosis or medical advice, and nothing you enter leaves your browser. If you need support now, call Lifeline on **13 11 14**, or **000** in an emergency.

## Try the basic prototype

Open `App/index.html` in a browser. Double-clicking the file works. There's nothing to install or build, but it needs an internet connection to load React, Tailwind and fonts from CDNs.

The flow goes like this:

1. A landing page.
2. Safety information.
3. Up to 15 short questions, one per screen. You can skip any of them, and you can mark some answers as must-haves.
4. A shortlist of three fictional therapists. Each comes with the reasons they line up with your answers, the trade-offs, and anything they don't meet.

To go straight to the results for a fictional test patient, add `?patient=A` (A to E) to the end of the URL:

| Patient | Situation |
|---|---|
| A | International student, anxious, wants practical help |
| B | Family tension, faith matters, wants to feel understood |
| C | Low mood, tight budget, evenings only |
| D | Needs LGBTQ+ experience. Only one therapist meets the must-have, so the rest are shown as closest fits |
| E | No one meets the must-haves, so only closest fits are shown |

## Watch the walkthrough

Open `Explainer/story.html` and press Play. It follows Alex, a fictional international student (test patient A), in seven chapters:

1. Alex answers a few questions, after a safety screen, and sees their answers back as a plain profile.
2. Eight fictional therapists list what they work on. One lists every area.
3. Someone starts therapy and checks in every couple of sessions. Their first and latest answers show the change.
4. A synthetic year of check-ins builds each therapist's record in Alex's areas, one dot per person.
5. Where what therapists say and what their patients report disagree.
6. Matching: who is set aside and why, then track record, then Alex's preferences, then the shortlist of three. It also shows who would have been shortlisted without check-ins.
7. What Alex actually sees: three therapists and why each might fit. Then Alex checks in too.

It plays like a video, or step through it like slides: click a control in the player, then use ← and → (K plays and pauses). The chapter buttons jump to a part, and "Read it as text instead" shows every caption. With reduced motion turned on, it steps without animating. Add `?beat=12` to the URL to open step 12.

Everything in it comes from the same engine as the details page: the names, numbers and labels in the captions are read from the ranking system and the profiles, so they stay true when the data changes. Alex's picture is drawn, not a photo of a real person.

## Explore the details

Open `Explainer/index.html`. It walks through three steps.

1. **The person's profile.** Answer six questions on the left, or load test patient A to E. The profile above them is what the person would see: a few plain lines, never scores. Under "Once they start therapy", you can try the check-in as this person with a therapist you pick. After their second check-in, their profile shows how things have changed, and they count in that therapist's profile.
2. **Therapist profiles** (behind the scenes). For every therapist and area, what the therapist says they work on, next to what their patients report in check-ins. The person's areas are highlighted. Select a cell to see every counted person's change and the rule that labelled it. The timeline at the top replays a synthetic year of check-ins, so you can watch the profiles fill in.
3. **The shortlist** (behind the scenes). Choose a ranking system. There are four:
   - *Research-guided*, the group's working spec.
   - *Simple checklist*, a naive baseline for comparison.
   - *Access first*, which puts cost and waiting time ahead of fit.
   - *Track record*, Research-guided plus what patients report. Patients in the person's area got worse: filtered out. Got better: ranked first. With no check-ins it ranks exactly like Research-guided.

   You'll see how many therapists pass the filters, join the top group, and make the shortlist. Each therapist's points show as a stacked bar coloured by question, and arrows show who moved after your last change. Select a therapist to see how the decision was made: the filters, the group, and a table of what the person said, what the therapist has, the fit, the weight and the points. A last panel compares who each ranking system would shortlist.

Every check-in is synthetic, generated from a short recipe in `Explainer/data/check-ins.js`. The check-in proposal, its evidence and its rules are in section 7 of the matching proposal.

Neither page scores anything itself. Matching is decoupled from the website: each ranking system is one file in `Explainer/matching/` that follows a shared contract (described at the top of `rankers.js`), and the profile rules live in `records.js`. The details page lists, runs and explains whatever ranking systems are loaded. Adding one means adding a file and a `<script>` tag, with no changes to the page.

Shortcuts, which can be combined:

| Add to the URL | What it does |
|---|---|
| `?patient=A` | loads a test patient (A to E) |
| `?ranker=track-record` | picks a ranking system (`research`, `checklist`, `access`, `track-record`) |
| `?view=shortlist` | opens step 3 (`profiles` is step 2) |
| `?open=priya` | opens one therapist's breakdown in step 3 |
| `?week=0` | how far into the year of check-ins to look, 0 to 52 |
| `?cell=ben.anxiety` | opens one therapist's record in one area |

For example, `?patient=A&ranker=track-record&cell=ben.anxiety`.

## How matching works (basic prototype)

The engine is `App/src/matching.js`. It's a pure function with no UI or storage: answers go in, and a shortlist comes out. It follows the recommendations in the research doc:

1. **Safety comes first.** The safety screen is shown before any questions and is never scored.
2. **Hard filters.** These cover session format, language where English won't work, and anything the person marked as a must-have. A therapist who fails a filter only appears as a "closest fit", with what they're missing spelt out.
3. **Research-backed approaches.** Where the research supports a pairing, therapists trained in that approach rank first. The two pairings are CBT for worry and anxiety, and DBT skills for strong emotions.
4. **Preferences.** A weighted score covers the qualities the person wants in a therapist, how the therapist communicates, shared background and experience, and practical factors like cost and waiting time. Areas therapists list as specialties get a low weight, because therapists tend to list many.

The result is a shortlist of three. Therapists are never ranked against each other publicly. The weights are constants at the top of `matching.js`.

- Spec: [`documents/MVP matching proposal.md`](documents/MVP%20matching%20proposal.md), a draft for group review
- Evidence: [`documents/compass_artifact_…_text_markdown.md`](documents/compass_artifact_wf-5fb8fa61-52f5-5e5d-9f8e-25e276749d72_text_markdown.md), section "Recommendations"
- Question wording: [`documents/MEDS3888 - G13 (LIVED EXPERIENCE) workflow.md`](documents/MEDS3888%20-%20G13%20(LIVED%20EXPERIENCE)%20workflow.md)

## Tests

Each prototype has its own test page. For the explainer, `Explainer/tests.html` loads only the data and the ranking systems, with no website code. It checks five things:

- Every ranking system follows the contract.
- The research-guided system meets the test patients' expectations.
- Each system's description stays true.
- Therapist profiles follow their rules, and the synthetic year comes out the way its recipe says.
- Track record ranks exactly like Research-guided when there are no check-ins.

Expectations the group hasn't settled are reported as OPEN, not as failures. The walkthrough has no test page of its own: it only draws what the ranking systems and profiles return, which `Explainer/tests.html` checks.

For the basic prototype, open `App/tests.html`. The page title reads `PASS n/n` or `FAIL n/n`. It checks two things:

- The therapist data only uses answer options the questionnaire actually has.
- Each test patient's shortlist matches what the group expects.

Run it after any change to weights, therapists or questions.

To run it headless from the repo root (Linux, Chromium):

```sh
chromium --headless=new --disable-gpu --user-data-dir=/tmp/ff-chr --virtual-time-budget=5000 \
  --dump-dom "file://$PWD/App/tests.html" 2>/dev/null | grep -o '<title>[^<]*'
```

Swap in `Explainer/tests.html` for the explainer.

## Layout

```
index.html                front page: what Thera-Fits is, links to the demo and the walkthrough
netlify.toml              how the site is published (front page, App/, Explainer/ only)
App/                      the basic prototype (no build step)
  index.html              page shell, colour tokens, CDN scripts
  tests.html              matching tests
  src/data/questions.js   the questions and their answer options
  src/data/therapists.js  the 8 fictional therapists
  src/data/test-patients.js  test patients A–E and what they should get
  src/matching.js         matching engine
  src/ui.js               shared components
  src/app.js              screens and flow
Explainer/                the matching explainer (no build step)
  story.html              the walkthrough: page shell, CDN scripts
  index.html              the details: page shell, CDN scripts
  tests.html              ranking-system tests (no website code)
  data/                   six questions, the 8 therapists, test patients A–E,
                          check-ins.js: the check-in and a synthetic year of them
  matching/rankers.js     the contract every ranking system follows, and run()
  matching/criteria.js    shared measurements (how well one answer fits one therapist)
  matching/records.js     profiles from check-ins: each therapist, area by area,
                          and each person's own progress
  matching/research.js    ranking system: research-guided (working spec)
  matching/checklist.js   ranking system: simple checklist (baseline)
  matching/access.js      ranking system: access first
  matching/track-record.js  ranking system: research-guided plus check-ins
  site/                   the pages: draw what the ranking systems and profiles return
    theme.css, theme.js   colour tokens and Tailwind settings, shared by both pages
    player.js             the walkthrough's player: clock, controls, captions, transcript
    story.js              the walkthrough's story, built from the engine's results
    ui.js, profiles.js, app.js   the details page
documents/                reference material: research, questionnaire, meeting notes,
                          matching proposal, and the earlier clickable prototype
```

The scripts are plain `<script>` tags that share a global `FF` object, so the pages open straight from a file. The order they load in each page's HTML matters.

## Status (22 October 2026)

- **Built:**
  - The basic prototype: the questionnaire, matching, and a results page with closest fits.
  - The matching explainer: four ranking systems that can be swapped, shown live, and profiles of both sides built from a synthetic year of patient check-ins.
  - The walkthrough: an animated story of the same engine, for people new to the project.
- **Proposed, for the group to decide:** patient check-ins that build therapist profiles (section 7 of the matching proposal). They're shown in the explainer and the walkthrough only, not in the basic prototype.
- **Not built yet:** a therapist detail page, a feedback screen, and a "pick your top 3 priorities" step.
- **Left out of this version:** self-management features and therapist accounts.
