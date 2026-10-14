# FIT-FIRST

A website prototype that helps 18–24-year-olds who haven't started therapy yet find a therapist who fits them. It's a University of Sydney MEDS3888 design project by Group 13 (Lived Experience). "FIT-FIRST" is a working name.

There are two prototypes:

- **`App/`, the basic prototype:** the full flow a person would go through, from 15 questions to a shortlist of three.
- **`Explainer/`, the matching explainer:** six questions and a behind-the-scenes view of how matching decides, with a choice of ranking systems. It's for the project team and supervisor, not for end users.

> **Demo only.** Every therapist profile is fictional. FIT-FIRST doesn't provide therapy, diagnosis or medical advice, and nothing you enter leaves your browser. If you need support now, call Lifeline on **13 11 14**, or **000** in an emergency.

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

## Try the matching explainer

Open `Explainer/index.html`. Answer six questions on the left, or load test patient A to E. The right-hand side updates as you go:

- **Ranking system:** choose how therapists are ranked. There are three:
  - *Research-guided*, the group's working spec.
  - *Simple checklist*, a naive baseline for comparison.
  - *Access first*, which puts cost and waiting time ahead of fit.
- **What happens:** how many therapists pass the filters, join the research group, and make the shortlist.
- **Every therapist:** each therapist's points as a stacked bar coloured by question. Arrows show who moved after your last change. Select a therapist to see how the decision was made: the filters, the group, and a table of what the person said, what the therapist has, the fit, the weight and the points.
- **Same answers, every ranking system:** who each system would shortlist, and what changes between them.

The page never scores anything itself. Matching is decoupled from the website: each ranking system is one file in `Explainer/matching/` that follows a shared contract (described at the top of `rankers.js`). The page lists, runs and explains whatever ranking systems are loaded. Adding one means adding a file and a `<script>` tag, with no changes to the page.

Shortcuts: `?patient=A`, `?ranker=access`, `?open=priya`, which can be combined (`?patient=A&ranker=access&open=priya`).

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

Each prototype has its own test page. For the explainer, `Explainer/tests.html` loads only the data and the ranking systems, with no website code. It checks three things:

- Every ranking system follows the contract.
- The research-guided system meets the test patients' expectations.
- Each system's description stays true.

Expectations the group hasn't settled are reported as OPEN, not as failures.

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
  index.html              page shell, colour tokens, CDN scripts
  tests.html              ranking-system tests (no website code)
  data/                   six questions, the 8 therapists, test patients A–E
  matching/rankers.js     the contract every ranking system follows, and run()
  matching/criteria.js    shared measurements (how well one answer fits one therapist)
  matching/research.js    ranking system: research-guided (working spec)
  matching/checklist.js   ranking system: simple checklist (baseline)
  matching/access.js      ranking system: access first
  site/                   the page: draws what a ranking system returns
documents/                reference material: research, questionnaire, meeting notes,
                          matching proposal, and the earlier clickable prototype
```

The scripts are plain `<script>` tags that share a global `FF` object, so the page opens straight from a file. The order they load in `index.html` matters.

## Status (14 October 2026)

- **Built:**
  - The basic prototype: the questionnaire, matching, and a results page with closest fits.
  - The matching explainer: three ranking systems that can be swapped, shown live.
- **Not built yet:** a therapist detail page, a feedback screen, and a "pick your top 3 priorities" step.
- **Left out of this version:** self-management features and therapist accounts.
