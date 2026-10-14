"use strict";
/*
  Fictional test patients: the check that matching behaves sensibly. Source: proposal section 5.
  Run them by opening tests.html. Answers marked "filled in" weren't specified in the proposal.

  expect.top3        must be in the shortlist (passed every filter)
  expect.top3AnyOf   at least one of these must be in the shortlist
  expect.notShown    must not be shown at all (shortlist or closest fits)
  expect.status      "full" (3 passed) | "narrow" (1–2 passed) | "none" (nobody passed: closest fits only)
*/
window.FF = window.FF || {};

FF.TEST_PATIENTS = [
  {
    id: "A", label: "International student, anxious, wants practical help",
    answers: {
      q1: "20", q2: "uni", q3: "student_accom", q4: "international", q5: ["english", "indonesian"],
      q6: ["study", "anxiety"], q7: "often", q8: ["stress", "thoughts"], q9: "what_to_do", q10: "coping", // q7–q10 filled in
      q16: ["practical", "direct"], q17: "practical", q18: ["international"], q19: "video", q20: ["cost", "wait"],
    },
    expect: { top3: ["wei"], notShown: ["jordan", "priya"], status: "full" },
  },
  {
    id: "B", label: "Family tension, faith matters, wants to feel understood",
    answers: {
      q1: "22", q2: "both", q3: "family", q4: "no", q5: ["english"],
      q6: ["family", "self_esteem"], q7: "sometimes", q8: ["relationships", "emotions"], q9: "expressing", q10: "understand", // q7–q10 filled in
      q16: ["empathetic", "non_judgemental"], q17: "reflective", q18: ["cultural", "faith"], q19: "no_pref", q20: ["style"], // q19–q20 filled in
    },
    expect: { top3: ["priya"], top3AnyOf: ["maya", "layla"], notShown: ["jordan", "ben"], status: "full" },
  },
  {
    id: "C", label: "Low mood, tight budget, evenings only",
    answers: {
      q1: "23", q2: "part_time", q3: "housemates", q4: "relocated", q5: ["english"],
      q6: ["low_mood", "loneliness"], q7: "often", q8: ["mood", "connected"], q9: "expressing", q10: "supported", // q7–q10 filled in
      q16: ["calm", "gentle"], q17: "listening", q18: ["none"], q19: "video", q20: ["cost", "flexible", "wait"],
    },
    expect: { top3: ["sam"], notShown: ["priya", "ben"], status: "full" },
  },
  {
    id: "D", label: "Needs LGBTQ+ experience, emotions feel overwhelming",
    answers: {
      q1: "19", q2: "uni", q4: "no", q5: ["english"],
      q6: ["emotions", "self_esteem"], q8: ["emotions", "confidence"], q9: "overwhelming", q10: "understand", // q8–q10 filled in
      q16: ["non_judgemental", "direct"], q17: "reflective", q18: ["lgbtq"], q19: "no_pref", q20: ["style"],
      essential: { lgbtq: true },
    },
    // Narrow pool: only Riley passes the must-have, so the rest are honest closest fits.
    expect: { top3: ["riley"], notShown: ["ben"], status: "narrow" },
  },
  {
    id: "E", label: "Gap case: no one meets the must-haves",
    answers: {
      q1: "21", q2: "full_time", q4: "relocated", q5: ["english", "arabic"],
      q6: ["work"], q16: ["direct"], q17: "practical", // filled in
      q18: ["gender"], q18_gender: "man", q19: "in_person", q20: ["flexible"],
      essential: { language: true, gender: true },
    },
    // No fake "match": nobody passes, so the screen must show closest fits only.
    expect: { status: "none" },
  },
];
