# MVP matching proposal (draft for group review)

Written by Luis + Claude, 14/10/26. **This is a proposal, not a decision.** Everything here is meant to be corrected by the group.

**MVP scope (agreed):** matchmaking only. Patient-focused. 8 fictional therapists as seeded data. No therapist account. No self-management yet (Q11–Q15 are out of the MVP flow).

Sources: questions from `MEDS3888 - G13 (LIVED EXPERIENCE) workflow.md` (Q1–Q20); matching rules from the research doc (`compass_artifact_…`, "Recommendations"); the case for patient check-ins (section 7) from the papers in `documents/articles/`.

---

## 1. How matching works

1. **Safety step first.** A static "if you need support now" screen (Lifeline 13 11 14 / 000). Not scored. Wording needs group sign-off.
2. **Hard filters.** Remove therapists who can't work for this person: not accepting clients, language or format the person has marked as essential.
3. **Clinical-fit band.** Only where the research doc names an evidence-based pairing (e.g. anxiety → CBT, difficulty managing emotions → DBT skills). Everyone else is "neutral". We have no outcome data, so nobody is ranked as "ineffective".
4. **Preference score.** Within each band, rank by how well the therapist's profile fits what the person said (Q16–Q20 mostly). Show the **top 3**, each with a one-line reason per priority (strong / partial / less aligned), as the current prototype does.

If fewer than 3 therapists pass the filters, show them plus the closest fits, and say plainly what each is missing. No fake perfect match.

> **Note for the group:** the research doc says preferences are the *last* layer. Because we only have sourced modality pairings for a few problems, most people will land in the neutral band, so in practice preferences will decide most rankings. That is honest for a no-data prototype, but worth knowing.

---

## 2. Therapist profile schema

Each fictional therapist is one record with these fields. Fields are chosen so every one can be scored against a patient answer.

| Field | Values | Used by | Role |
|---|---|---|---|
| `registration` | Psychologist / Clinical psychologist / Counselling psychologist / Mental health social worker | display | context |
| `gender` | woman / man / non-binary | Q18 | soft, or filter if "essential" |
| `languages` | English + any of Mandarin, Indonesian, Arabic, Hindi (Q5 options) | Q5 | filter if essential, else soft |
| `formats` | in person / video / phone | Q19 | filter if one format chosen |
| `fee_band` | $ / $$ / $$$ (illustrative, group to set real ranges) | Q20 | soft |
| `wait` | days until first session (illustrative) | Q20 | soft |
| `evening_weekend` | true / false | Q20 | soft |
| `location` | near campus / CBD / telehealth only | Q20 | soft |
| `accepting` | true / false | all | hard filter |
| `qualities` | up to 3 of the Q16 options | Q16 | soft, high weight |
| `approach` | listening and support / reflective questions / practical advice / structured goals / flexible mix | Q17, Q10 | soft, high weight |
| `modalities` | CBT / ACT / DBT skills / IPT / psychodynamic / person-centred (formal training) | Q6, Q8 | clinical-fit band |
| `focus_areas` | areas from Q6 the therapist *says* they work on | Q6 | soft, **low weight** (therapists oversell) |
| `context` | cultural background understanding / faith or spirituality / international students / LGBTQ+ / similar life circumstances: each strong / some / none | Q18, Q4 | soft, high weight when selected |
| `tradeoff` | one honest sentence | display | shown to user |

Design choice: alignment (strong / partial / less aligned) is **computed** from these fields, not hand-written per priority. That removes the prototype's gotcha where every therapist needs an `align` entry for every priority.

---

## 3. Question → matching map

MVP uses **15 questions** (Q1–Q10, Q16–Q20). Two of them (Q3, Q7) do no matching work and are candidates to drop, which would leave 13.

| Q | Asks about | Role in matching | Notes |
|---|---|---|---|
| Q1 | Age | Eligibility gate (18–24) | Not scored |
| Q2 | Study / work situation | Soft: "similar life circumstances" | Low weight |
| Q3 | Living situation | **Unused** | Candidate to drop |
| Q4 | Living away from home / support | Soft: international-student and cultural context | Low weight |
| Q5 | Language | Filter if essential, else soft | Needs an "essential" toggle |
| Q6 | Challenging areas (up to 3) | Clinical-fit band (sourced pairings only) + low-weight focus-area match | Mapping beyond anxiety/emotions needs clinical check |
| Q7 | How often it affects daily life | **Not scored.** Only drives a gentle "talk to a GP / headspace" note | Not a validated measure; needs sign-off |
| Q8 | What to improve (up to 3) | Soft: hints at approach (e.g. "managing difficult thoughts" → CBT-type) | Mapping is our guess, flagged |
| Q9 | What is hardest | Soft: "finding someone I can trust" boosts non-judgemental / gentle qualities and "knowing what to expect" | Medium |
| Q10 | Goal of support | Soft: maps to approach (supported → listening; coping strategies → practical; understand myself → reflective; daily functioning → structured goals) | Medium |
| Q16 | Qualities wanted (up to 3) | Soft, **highest weight**: match `qualities` | Direct patient preference |
| Q17 | Communication preference | Soft, **highest weight**: match `approach` | |
| Q18 | Important characteristics | Soft, high weight. Add an "essential" toggle per item to make it a filter | Gender, cultural, faith, international, LGBTQ+, circumstances |
| Q19 | Session format | Filter when one format is chosen. "Combination" / "no preference" → ignore | |
| Q20 | Practical factors (up to 3) | **Re-weights** cost, wait, hours, location, language, expertise, style | Boosts what they picked |

Starting weights (to tune against the test patients in section 5): qualities 3, approach 3, Q18 items selected 3, practical factors picked in Q20 2 each, focus areas 1, everything else 1.

---

## 4. The 8 fictional therapists

All names and details are invented. Badge each as "Fictional demo profile". Maya, Jordan and Priya carry over from the current prototype. The other five are new.

**Logistics (feeds filters)**

| # | Name | Registration | Gender | Languages | Formats | Fee | Wait | Eve/Wknd | Location |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Dr Maya Chen | Clinical psychologist | woman | English, Mandarin | in person, video | $$ | ~2 wks | no | CBD |
| 2 | Jordan Smith | Psychologist | non-binary | English | in person | $ | ~5 days | yes | near campus |
| 3 | Priya Raman | Counselling psychologist | woman | English, Hindi | video, in person | $$$ | ~3 wks | no | CBD |
| 4 | Sam Okafor | Mental health social worker | man | English | video, phone | $ | ~1 wk | yes | telehealth only |
| 5 | Dr Layla Haddad | Clinical psychologist | woman | English, Arabic | in person, video | $$ | ~2 wks | no | CBD |
| 6 | Wei Santoso | Psychologist | man | English, Indonesian | video | $$ | ~4 days | yes | telehealth only |
| 7 | Riley Park | Counselling psychologist | non-binary | English | in person, video | $$ | ~10 days | weekends | near campus |
| 8 | Dr Ben Whitfield | Clinical psychologist | man | English | in person | $$$ | ~1 wk | no | CBD |

**Fit (feeds scoring)**

| # | Qualities (Q16) | Approach (Q17) | Modalities | Focus areas (self-listed) | Context | Trade-off |
|---|---|---|---|---|---|---|
| 1 | Empathetic, patient and gentle, non-judgemental | Reflective questions | Person-centred, psychodynamic | Family, anxiety, major life changes | Cultural: strong. Faith: some | Less structured if you want a clear plan from session one |
| 2 | Direct and honest, practical, structured | Structured goals | CBT | Study stress, anxiety | Students: strong. Family and cultural: none | In person only, less family or cultural focus |
| 3 | Empathetic, non-judgemental, encouraging | Flexible mix | IPT, ACT | Family, self-esteem, major life changes | Cultural: strong. Faith: strong. International students: strong | Highest cost and longest wait |
| 4 | Calm and reassuring, patient and gentle, encouraging | Listening and support | Person-centred | Loneliness, low mood, major life changes | Working young adults: strong | No in-person; less goal-structured |
| 5 | Non-judgemental, calm and reassuring, direct and honest | Reflective questions + practical advice | CBT, DBT skills | Difficulty managing emotions, anxiety, self-esteem | Faith: strong. Cultural: strong | Longer wait, no evenings |
| 6 | Encouraging, practical, patient and gentle | Practical advice | CBT, ACT | Work stress, study stress, low motivation | International students: strong. Students: strong | Video only; less room for open-ended reflection |
| 7 | Non-judgemental, empathetic, direct and honest | Reflective questions | Person-centred, DBT skills, IPT | Self-esteem, relationships, difficulty managing emotions | LGBTQ+: strong. Cultural: some | Weekend-only hours |
| 8 | Calm and reassuring, empathetic, structured | Flexible mix | CBT | **8 areas listed** (everything in Q6) | Cultural: some | Broad list but one trained modality; highest fee |

Therapist 8 is deliberate: it tests the "self-reported specialties count for little" rule. A long list should not push them to the top.

---

## 5. Fictional test patients

These are the check that the matching behaves sensibly. Each has "must appear" and "must not appear" expectations. If a weight change breaks one, we see it immediately.

| # | Patient | Key answers | Must appear in top 3 | Must not appear |
|---|---|---|---|---|
| A | International student, anxious, wants practical help | Q5 Indonesian, Q6 study stress + anxiety, Q16 practical + direct, Q17 practical advice, Q18 international students, Q19 video, Q20 cost + wait | #6 Wei | #2 Jordan (in person only), #3 Priya (cost, wait) |
| B | Family tension, faith matters, wants to feel understood | Q6 family + self-esteem, Q16 empathetic + non-judgemental, Q17 reflective, Q18 cultural + faith | #3 Priya, one of #1 / #5 | #2 Jordan, #8 Ben |
| C | Low mood, tight budget, evenings only | Q6 low mood + loneliness, Q16 calm + patient, Q17 emotional support, Q19 video or phone, Q20 cost + flexible hours + wait | #4 Sam | Any $$$ therapist |
| D | Needs LGBTQ+ experience, emotions feel overwhelming | Q6 emotions + self-esteem, Q16 non-judgemental + direct, Q18 LGBTQ+ **essential** | #7 Riley | #8 Ben |
| E | Gap case: no one meets the must-haves | Arabic essential, man essential, in person essential, evenings | Closest-fit message, not a fake "match" | A confident "great match" label |

Case D is also a **narrow-pool** test: only one therapist passes the essential filter, so the screen must show Riley plus honest closest fits.

---

## 6. Choices made while building (14/10, in `App/`)

Small calls the proposal didn't settle. All easy to reverse.

- **Q19:** choosing one format is a filter (as in section 3), so it has no separate "essential" toggle. The question now says so on screen.
- **Q5:** treated as "select all that apply" (the workflow doc doesn't say). Language is a filter if the person ticks "I need sessions in a language other than English", or doesn't tick English at all.
- **Focus areas:** besides the low weight, a therapist who lists more than 3 areas has their match scaled down (×3 / number listed). This is what keeps Ben from benefiting from his long list.
- **Q20 "expertise":** only scored when the person picked an area with a sourced pairing (anxiety, emotions). Otherwise it is skipped rather than guessed.
- **Q20 "location":** we don't ask where people live, so "near campus" scores highest, CBD and telehealth-only score half. Placeholder.
- **Q3 and Q7** are asked but not scored, until the group decides on open question 2.

**Test results:** 44/45 checks pass. The one failure: **patient A gets Priya at #3.** She fails both of A's practical picks (cost, wait), but she is the only other therapist strong on international students, which A selected in Q18 (weight 3). The alternatives (Sam, Riley, Maya) match almost nothing A asked for. Either the expectation changes (Priya is allowed, with her trade-off shown) or Q20 factors get more weight than Q18 items. Group to decide.

---

## 7. Proposal: therapist profiles built from patient check-ins (15/10, demo 21/10)

**Status: proposal, outside the agreed MVP.** A demo is built in `Explainer/` (21/10) so the group can see how it works. Nothing goes into `App/` until the group decides (open question 7). Watch it: `Explainer/story.html`, a three-minute animated walkthrough that follows test patient A (22/10). Try it yourself: `Explainer/index.html?patient=A&ranker=track-record`.

### The idea

Thera-Fits builds two kinds of profile in the same vocabulary (the options of Q6 and Q16–Q20): one of the person, and one of each therapist (what they say, next to what their patients report). Matching connects them. The profiles are the part nobody else has. Matching is one use of them: the deeper problem is getting reliable data on how well therapists help, and on how much patients improve.

| Profile | Comes from | Exists today? |
|---|---|---|
| The person's profile | their questionnaire answers, then their check-ins | Questionnaire: yes. Check-ins: demo |
| What the therapist **says** | a therapist questionnaire (open question 5) | Seeded (section 4) |
| What patients **report** | short check-ins from patients during therapy | Demo, with a synthetic year of check-ins |

Over time, what patients report replaces what therapists say about their own strengths.

**People see very little of this.** The person sees a few plain lines about themselves ("Working on: Study · Anxiety", then later "Since they started: Study: better · Overall: better"), never the data behind them, and never a therapist's record. Therapist profiles only shape the shortlist (open question 8).

### Why: the argument from the evidence

1. **Therapists are good at different things.** Of 696 therapists (6,960 patients), 96% were effective in at least one of 12 problem areas, typically 5, and none in all 12. A therapist's ranking in one area shared only 1–9% of its variance with their ranking in another (Kraus et al., 2011). In the matching trial, 76% of therapists had at least one measured strength and one weakness (Coyne et al., 2024).
2. **Some do harm in specific areas.** Depending on the area, up to 16% of therapists left their average patient reliably worse (Kraus et al., 2011). Under usual assignment, 36% of patients got a therapist who was ineffective in at least one area (Constantino et al., 2021).
3. **Therapists can't tell which areas are which.** On average they rated themselves more effective than their outcomes showed in 6.4 of 12 areas (Coyne et al., 2024). Most clinicians believe they are above average and can't predict which patients will get worse (Kraus et al., 2011, citing Hannan et al., 2005).
4. **What patients see today is that self-assessment.** Therapist directories "largely reflect these flawed, non-measurement-based self-assessments" (Coyne et al., 2024).
5. **Patients' own reports reveal the real profile, and using it helps.** All three studies built therapist profiles from patient-reported outcomes. Matching patients to those measured strengths beat usual assignment (d = 0.75 on overall impairment; Constantino et al., 2021).

So routine patient check-ins are the only source of this information that the evidence supports.

Suggested wording for the report:

> Therapists' effectiveness varies by problem area: most are effective with some concerns, none with all, and a minority leave patients in specific areas worse off (Kraus et al., 2011). Therapists cannot reliably identify these strengths themselves, overestimating their effectiveness in about half of problem areas (Coyne et al., 2024), yet the directories patients rely on are built from those self-assessments. Matching patients to strengths measured from patient-reported outcomes improved results over usual assignment (Constantino et al., 2021). Thera-Fits therefore proposes brief, routine patient check-ins during therapy. These build each therapist's profile from what patients report over time, mark areas as "not enough evidence yet" until enough patients have reported, and use the profile only to shape the shortlist, never as a public rating. This evidence comes from US adults; whether it transfers to 18–24-year-olds in Australia is untested.

### What a check-in asks

Change, not satisfaction. None of the papers measured how much patients liked their therapist. A "how good was your therapist?" score measures likeability, and turns into the public rating the group has ruled out.

The same questions every time, so change is **measured** (first answer against latest), never asked. The studies did the same: they measured at the start and later, rather than asking afterwards how much things had changed.

| Question (plain language) | Answers | Feeds |
|---|---|---|
| "How much is *[each Q6 area they picked, up to 3]* getting in the way of your day-to-day life right now?" | Not at all / A little / Somewhat / A lot / Very much | the therapist's record in that area, and the person's own progress |
| "Overall, how are things going for you right now?" | Really well / Fairly well / Okay / Not so well / Really badly | the person's own progress |

Our own wording, inspired by brief outcome measures (ORS, MyLifeTracker) but not copied, and not a validated tool. The area question reuses the Q6 option text, so no new labels are introduced.

Not in the demo: asking whether the therapist came across as their listed Q16 qualities, communicated as they said (Q17), or understood the person's Q18 items. These would refine the preference layer, but none of the papers tested whether patients can judge them, so they aren't evidence of skill.

**When:** before the first session, after every second session, and when they finish or stop. The first check-in is the baseline, so intake doesn't need a per-area Q7 (open question 9). The trial measured about every two weeks, and Constantino et al. (2021) say a start and a follow-up are enough to build profiles. Every second session keeps it light, while people who stop early still count from their last check-in (trial patients averaged about 6 sessions).

### How it feeds matching

The rules, as built in `Explainer/matching/records.js` (the numbers are ours; open question 10):

- **Each person's change in an area** = their first check-in minus their latest, in steps on the 0–4 scale. A person counts once they have two check-ins.
- **Per therapist, per area, one of four labels**, from the average person's change against a fixed threshold, not compared with other therapists. Kraus et al. (2011) explain why: when harm is common, comparing with the average can make a harmful therapist look good.
  - *Not enough evidence yet:* fewer than 10 people (Kraus used each therapist's first 10). Rare areas may never get there, so this is the normal state, not a failure.
  - *Helped:* the average person is at least 1 step better.
  - *Got worse:* the average person is at least half a step worse. Deliberately quicker to flag harm than help.
  - *No clear change:* anything between.

The **Track record** ranking system (`Explainer/matching/track-record.js`) starts from Research-guided and adds:

| Track record, for the person's areas | Group | Closest match level in the trial (Constantino et al., 2021) |
|---|---|---|
| "Got worse" in any of the person's areas | filtered out, with a reason (do no harm: research doc, Stage 4 step 1) | stricter than the trial, which could still match at level 4 |
| "Helped" in one of them, no "got worse" anywhere | 1st: Helped people with this | levels 1–2 |
| "Helped" in one of them, "got worse" in another area | 2nd: Helped, with a caution | levels 3–4 |
| Neither: no clear change, or not enough evidence yet | Research-guided's groups, in its order | level 5 |
| "Got worse" in another area, not "helped" in theirs | last: A caution in another area | not matched |

The order follows the trial's five match levels. Even its lowest, a therapist who wasn't effective in the patient's main areas but wasn't ineffective in any area, beat usual assignment (d = 0.75), and 58.6% of matched patients got only that level. So avoiding a therapist's weak areas carries most of the benefit, which is why "got worse" filters or demotes while "helped" only reorders. With no check-ins, Track record ranks exactly like Research-guided (`Explainer/tests.html` checks this).

**Never shown to patients as a score or rating.** It only shapes the shortlist, as in the trial, where neither patients nor therapists saw the profiles. Published ratings push therapists to avoid hard cases (research doc, Caveats).

The ranking-system contract (`Explainer/matching/rankers.js`) gained an optional third argument, `context`: the check-ins, and the week to read them up to. A ranking system that reads it says so (`usesCheckIns: true`). The others ignore it, and the page still never scores anything.

### What's built (21/10, in `Explainer/` only)

`App/` and its tests don't move.

- **`data/check-ins.js`:** the check-in, and a synthetic year of them. 151 people across the 8 therapists, generated from a short, readable recipe with a fixed seed, so it's the same on every load. About a fifth stop early, and each therapist has one person who checked in once and never came back. It is shaped like Kraus et al. (2011): each therapist helps with 2 or 3 areas, none with all, and two have an area where patients got worse. The stories the recipe tells:
  - Ben lists all 9 areas and is CBT-trained, but his patients with anxiety got worse.
  - Jordan lists anxiety and is CBT-trained, but shows no clear change with it.
  - Sam doesn't list anxiety, but people who came about low mood or loneliness also reported it, and got better.
  - Riley lists family difficulties, but those patients got worse.

  The recipe is invented, so the group should sign it off (open question 11).
- **`matching/records.js`:** builds both profiles from check-ins (the rules above). No page code, no ranking.
- **`matching/track-record.js`:** the ranking system above.
- **The page, in three steps:**
  1. **The person's profile:** what the person would see, in plain lines. Below it, "Once they start therapy" lets you try the check-in as this person with a therapist you pick. Their second check-in shows their own progress, and adds them to that therapist's profile.
  2. **Therapist profiles (behind the scenes):** every therapist and area, what they say next to what patients report, with the person's areas highlighted. A timeline replays the year, and selecting a cell shows every counted person's change and the rule that labelled it.
  3. **The shortlist:** the existing behind-the-scenes view, for any ranking system.
- **Tests:** `Explainer/tests.html` now has 67 checks (1 open). New ones check the rules at their boundaries, that the year-end labels match the recipe, and that Track record ranks like Research-guided when there's no data.

Links: `?week=0` starts at the beginning of the year; `?cell=ben.anxiety` opens one therapist's record in one area; `?view=shortlist` opens step 3.

**What changes for the test patients** (end of the synthetic year, Track record against Research-guided):

| Patient | Research-guided | Track record |
|---|---|---|
| A | Wei, Layla, Priya | Wei, Layla, **Sam**: his patients with anxiety got better. Priya hasn't treated enough people with anxiety to count |
| B | Priya, Layla, Maya | the same three, Maya ahead of Layla (family: helped) |
| C | Sam, Wei, Layla | the same |
| D | Riley | Riley, now "Helped, with a caution" (family) |
| E | nobody meets the must-haves | the same |

Patient A shows the open trade-off: Sam has 4 of 14 preference points, against Priya's 4.5, and still makes the shortlist on his track record (open question 12).

### Caveats to state openly

- **Our check-in isn't their questionnaire.** The studies used the TOP (58 tested items, about 8 minutes, covering clinical areas such as depression and suicidality). Our "not clinical" rule means a plain-language substitute with no known reliability. It's a prototype of the mechanism, not a validated tool.
- **The year of check-ins is invented.** It is there to show the mechanism. Real check-ins would be noisier: with 10 to 13 people in an area, a label could flip back and forth. The demo's never does, by design.
- **Harder caseloads look worse.** The trial adjusted for how hard each patient's case was; we can't. Another reason to keep profiles internal.
- **"Strength" depends on the rule.** Kraus's rule (did patients reliably improve?) gives about 5 strengths per therapist; the trial's (did they improve more than expected?) gives about 1.5. The demo follows Kraus (open question 10).
- **Narrow evidence.** All three studies are US adults in one network of clinics; nothing tests this in 18–24-year-olds or in Australia (research doc). Whether effectiveness is really area-specific is disputed (Nissen-Lie et al., 2016, find it mostly general); even then, asking patients beats asking therapists. Kraus founded the company behind the TOP. In Coyne et al. (2024), how much a therapist overestimated themselves did not change how much matching helped (a small, exploratory study).

### Sources

Kept locally in `documents/articles/`, not in the repo (publisher copyright):
- Kraus, D. R., Castonguay, L., Boswell, J. F., Nordberg, S. S., & Hayes, J. A. (2011). Therapist effectiveness: Implications for accountability and patient care. *Psychotherapy Research, 21*(3), 267–276. doi:10.1080/10503307.2011.563249 (`kraus2011.pdf`)
- Constantino, M. J., Boswell, J. F., Coyne, A. E., Swales, T. P., & Kraus, D. R. (2021). Effect of matching therapists to patients vs assignment as usual on adult psychotherapy outcomes: A randomized clinical trial. *JAMA Psychiatry, 78*(9), 960–969. doi:10.1001/jamapsychiatry.2021.1221 (`Constantino.pdf`)
- Coyne, A. E., Constantino, M. J., Boswell, J. F., Gaines, A. N., & Kraus, D. R. (2024). Therapist-level moderators of patient-therapist match effectiveness in community psychotherapy. *Administration and Policy in Mental Health and Mental Health Services Research, 51*, 738–752. doi:10.1007/s10488-024-01360-8 (file named after the title)

Cited through the research doc only, not checked against the full text: Constantino et al. (2023), therapists no better than chance at judging their own strengths; Nissen-Lie et al. (2016); Hannan et al. (2005).

---

## 8. Open questions for the group

1. Is an "essential" toggle on language, gender, format and Q18 items acceptable? (Without it, we can't separate "nice to have" from "must have".)
2. Can Q3 and Q7 be dropped from the MVP? Q7 needs a decision either way, because a frequency question implies we do something with high answers.
3. Who signs off the Q6/Q8 → modality mapping? We only have sourced pairings for anxiety (CBT) and emotion regulation (DBT skills). Anything else is a guess.
4. Fee bands and wait times are placeholders. Do we want real Australian ranges, or leave it as $ / $$ / $$$?
5. Auriel's therapist questions should produce the same fields as section 2, so the future therapist form and our seed data match.
6. Wording for the safety step. Not for us to invent.
7. Do we take on patient check-ins (section 7)? They go beyond the agreed MVP: the therapist side is deferred, and check-ins happen after someone has started therapy. The demo is in `Explainer/`. Does it go into `App/` too?
8. Should patients ever see anything from a therapist's track record? Section 7 recommends no: it only shapes the shortlist, as in the trial. The person sees only their own plain-language profile.
9. Is the check-in question ("How much is *[area]* getting in the way of your day-to-day life right now?", Not at all to Very much) acceptable under the "not clinical" rule? It's asked before the first session too, which replaces a per-area Q7 at intake (open question 2).
10. Which rule decides "helped": did patients reliably improve (Kraus), or improve more than expected (the trial)? The demo uses Kraus-style fixed thresholds: 10 people per area, 1 step better on average for "helped", half a step worse for "got worse". Are those the right numbers?
11. Who signs off the synthetic recipe in `Explainer/data/check-ins.js`, which decides each therapist's strengths and weaknesses in the demo?
12. Should a good track record be able to outrank weak preference fit? For patient A, Track record shortlists Sam (4 of 14 preference points) over Priya (4.5), on what his patients with anxiety report. In the trial, the match level came first, and the coordinator went down the list only until a therapist met practical needs such as insurance. Do we want a floor on preference points?
