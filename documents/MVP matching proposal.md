# MVP matching proposal (draft for group review)

Written by Luis + Claude, 14/10/26. **This is a proposal, not a decision.** Everything here is meant to be corrected by the group.

**MVP scope (agreed):** matchmaking only. Patient-focused. 8 fictional therapists as seeded data. No therapist account. No self-management yet (Q11–Q15 are out of the MVP flow).

Sources: questions from `MEDS3888 - G13 (LIVED EXPERIENCE) workflow.md` (Q1–Q20); matching rules from the research doc (`compass_artifact_…`, "Recommendations").

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

## 7. Open questions for the group

1. Is an "essential" toggle on language, gender, format and Q18 items acceptable? (Without it, we can't separate "nice to have" from "must have".)
2. Can Q3 and Q7 be dropped from the MVP? Q7 needs a decision either way, because a frequency question implies we do something with high answers.
3. Who signs off the Q6/Q8 → modality mapping? We only have sourced pairings for anxiety (CBT) and emotion regulation (DBT skills). Anything else is a guess.
4. Fee bands and wait times are placeholders. Do we want real Australian ranges, or leave it as $ / $$ / $$$?
5. Auriel's therapist questions should produce the same fields as section 2, so the future therapist form and our seed data match.
6. Wording for the safety step. Not for us to invent.
