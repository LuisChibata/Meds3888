"use strict";
/*
  Fictional test patients, cut down to the explainer's six questions. Source: proposal section 5.
  Patient E is new: the proposal's E used language and gender, which the explainer doesn't ask.

  expect applies to the "research" ranking system (the group's working spec):
    shortlist        must be shortlisted
    shortlistAnyOf   at least one of these must be shortlisted
    notShortlisted   must not be shortlisted
    status           "full" (3 shortlisted) | "narrow" (1–2) | "none" (nobody passes the filters)
  open lists expectations the group hasn't settled. tests.html reports them as OPEN, not as failures.
  Don't edit an expectation to make it pass; that's a group decision.
*/
window.FF = window.FF || {};

FF.TEST_PATIENTS = [
  {
    id: "A", label: "International student, anxious, wants practical help",
    answers: { q6: ["study", "anxiety"], q16: ["practical", "direct"], q17: "practical", q18: ["international"], q19: "video", q20: ["cost", "wait"] },
    expect: { shortlist: ["wei"], notShortlisted: ["jordan"], status: "full" },
    open: [{
      notShortlisted: ["priya"],
      note: "Priya is the only other therapist strong on international students (weight 3), but fails both practical picks (weight 2 each). Proposal section 6: group to decide.",
    }],
  },
  {
    id: "B", label: "Family tension, faith matters, wants to feel understood",
    answers: { q6: ["family", "self_esteem"], q16: ["empathetic", "non_judgemental"], q17: "reflective", q18: ["cultural", "faith"], q19: "no_pref" },
    expect: { shortlist: ["priya"], shortlistAnyOf: ["maya", "layla"], notShortlisted: ["jordan", "ben"], status: "full" },
  },
  {
    id: "C", label: "Low mood, tight budget, evenings only",
    answers: { q6: ["low_mood", "loneliness"], q16: ["calm", "gentle"], q17: "listening", q19: "video", q20: ["cost", "flexible", "wait"] },
    expect: { shortlist: ["sam"], notShortlisted: ["priya", "ben"], status: "full" },
  },
  {
    id: "D", label: "Needs LGBTQ+ experience, emotions feel overwhelming",
    answers: { q6: ["emotions", "self_esteem"], q16: ["non_judgemental", "direct"], q17: "reflective", q18: ["lgbtq"], must: { lgbtq: true }, q19: "no_pref" },
    expect: { shortlist: ["riley"], notShortlisted: ["ben"], status: "narrow" },
  },
  {
    id: "E", label: "Gap case: no one meets both must-haves",
    answers: { q6: ["family"], q16: ["direct"], q17: "practical", q18: ["faith", "lgbtq"], must: { faith: true, lgbtq: true }, q19: "in_person" },
    expect: { status: "none" },
  },
];
