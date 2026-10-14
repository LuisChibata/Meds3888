"use strict";
/*
  Patient questionnaire for the MVP flow (Q1–Q10, Q16–Q20).
  Wording is canonical: copied from documents/MEDS3888 - G13 (LIVED EXPERIENCE) workflow.md.
  Change wording there first, then here. Option ids are what matching.js and therapists.js use.

  type:      "single" | "multi"
  max:       limit for "multi" (omitted = select all that apply)
  exclusive: option ids that clear every other choice (Not sure, No preference, ...)
  other:     option id that opens a free-text field (never scored)
  scored:    false = asked but not used by matching (candidates to drop, see proposal section 6)
*/
window.FF = window.FF || {};

FF.SECTIONS = [
  { id: "about", title: "About you" },
  { id: "needs", title: "What's been going on" },
  { id: "fit", title: "Your therapist" },
];

FF.QUESTIONS = [
  {
    id: "q1", n: 1, section: "about", type: "single",
    text: "What is your age?",
    options: [["18", "18"], ["19", "19"], ["20", "20"], ["21", "21"], ["22", "22"], ["23", "23"], ["24", "24"]],
  },
  {
    id: "q2", n: 2, section: "about", type: "single",
    text: "Which best describes your current situation?",
    options: [
      ["uni", "University student"],
      ["tafe", "TAFE / Vocational student"],
      ["full_time", "Working full-time"],
      ["part_time", "Working part-time"],
      ["both", "Both studying and working"],
      ["neither", "Not currently studying or working"],
      ["other", "Other (please specify)"],
      ["prefer_not", "Prefer not to answer"],
    ],
    other: "other",
  },
  {
    id: "q3", n: 3, section: "about", type: "single", scored: false,
    text: "Which best describes your current living situation?",
    options: [
      ["family", "Living with family"],
      ["housemates", "Living with housemates"],
      ["alone", "Living alone"],
      ["partner", "Living with a partner"],
      ["student_accom", "Student accommodation"],
      ["other", "Other"],
      ["prefer_not", "Prefer not to answer"],
    ],
  },
  {
    id: "q4", n: 4, section: "about", type: "single",
    text: "Are you currently living away from your home country, hometown, or usual support network?",
    options: [
      ["international", "Yes, I am an international student"],
      ["relocated", "Yes, I have relocated within Australia"],
      ["other_reason", "Yes, for another reason"],
      ["no", "No"],
      ["prefer_not", "Prefer not to answer"],
    ],
  },
  {
    // Workflow doc doesn't say single or multi. Multi, because people can be fluent in several.
    id: "q5", n: 5, section: "about", type: "multi",
    text: "What language are you fluent in?",
    hint: "Select all that apply.",
    options: [
      ["english", "English"],
      ["mandarin", "Mandarin"],
      ["indonesian", "Indonesian"],
      ["arabic", "Arabic"],
      ["hindi", "Hindi"],
      ["other", "Other (please specify)"],
      ["no_pref", "No preference"],
    ],
    exclusive: ["no_pref"],
    other: "other",
    essential: { key: "language", label: "I need sessions in a language other than English" },
  },
  {
    id: "q6", n: 6, section: "needs", type: "multi", max: 3,
    text: "Which areas of your life have been most challenging recently?",
    hint: "Select up to three.",
    options: [
      ["study", "Academic pressure or study-related stress"],
      ["work", "Work-related stress"],
      ["anxiety", "Anxiety or excessive worrying"],
      ["low_mood", "Low mood or lack of motivation"],
      ["family", "Family or relationship difficulties"],
      ["loneliness", "Loneliness or social isolation"],
      ["self_esteem", "Self-esteem or confidence"],
      ["life_changes", "Major life changes"],
      ["emotions", "Difficulty managing emotions"],
      ["other", "Other (please specify)"],
      ["not_sure", "Not sure"],
    ],
    exclusive: ["not_sure"],
    other: "other",
  },
  {
    id: "q7", n: 7, section: "needs", type: "single", scored: false,
    text: "How frequently have these challenges affected your daily life recently?",
    options: [
      ["never", "Never"],
      ["rarely", "Rarely"],
      ["sometimes", "Sometimes"],
      ["often", "Often"],
      ["daily", "Almost every day"],
      ["prefer_not", "Prefer not to answer"],
    ],
  },
  {
    id: "q8", n: 8, section: "needs", type: "multi", max: 3,
    text: "Which aspect of your wellbeing would you most like to improve?",
    hint: "Select up to three.",
    options: [
      ["stress", "Managing stress"],
      ["emotions", "Understanding my emotions"],
      ["mood", "Improving my mood"],
      ["confidence", "Building confidence"],
      ["relationships", "Improving relationships"],
      ["routines", "Developing healthier routines"],
      ["motivation", "Improving concentration and motivation"],
      ["thoughts", "Managing difficult thoughts"],
      ["connected", "Feeling more connected to others"],
      ["not_sure", "Not sure"],
    ],
    exclusive: ["not_sure"],
  },
  {
    id: "q9", n: 9, section: "needs", type: "single",
    text: "When you experience emotional difficulties, what do you usually find most challenging?",
    options: [
      ["why", "Understanding why I feel a certain way"],
      ["overwhelming", "Managing overwhelming emotions"],
      ["what_to_do", "Knowing what to do to feel better"],
      ["trust", "Finding someone I can trust"],
      ["motivation", "Staying motivated"],
      ["expressing", "Expressing my thoughts or feelings"],
      ["responsibilities", "Managing responsibilities"],
      ["other", "Other (please specify)"],
    ],
    other: "other",
  },
  {
    id: "q10", n: 10, section: "needs", type: "single",
    text: "What would you most like to achieve through mental health support?",
    options: [
      ["supported", "Feel emotionally supported and understood"],
      ["coping", "Learn practical coping strategies"],
      ["understand", "Better understand myself"],
      ["functioning", "Improve my daily functioning"],
      ["resilience", "Develop long-term emotional resilience"],
      ["specific", "Work through a specific difficulty"],
      ["explore", "Explore what kind of support might help"],
      ["not_sure", "Not sure"],
    ],
  },
  {
    id: "q16", n: 16, section: "fit", type: "multi", max: 3,
    text: "What qualities would make you feel most comfortable with a therapist?",
    hint: "Select up to three.",
    options: [
      ["empathetic", "Empathetic and understanding"],
      ["gentle", "Patient and gentle"],
      ["non_judgemental", "Non-judgemental"],
      ["direct", "Direct and honest"],
      ["encouraging", "Encouraging and supportive"],
      ["calm", "Calm and reassuring"],
      ["practical", "Practical and solution-focused"],
      ["structured", "Structured and goal-oriented"],
      ["not_sure", "Not sure"],
    ],
    exclusive: ["not_sure"],
  },
  {
    id: "q17", n: 17, section: "fit", type: "single",
    text: "How would you prefer a therapist to communicate with you?",
    options: [
      ["listening", "Mostly listening and providing emotional support"],
      ["reflective", "Asking reflective questions to help me understand myself"],
      ["practical", "Providing practical advice and coping strategies"],
      ["structured", "Setting structured goals and tracking progress"],
      ["flexible", "A flexible combination of these approaches"],
      ["not_sure", "Not sure"],
    ],
  },
  {
    id: "q18", n: 18, section: "fit", type: "multi",
    text: "Are there any therapist characteristics or experiences that are particularly important to you?",
    hint: "Select all that apply.",
    options: [
      ["gender", "Therapist gender"],
      ["cultural", "Understanding of my cultural background"],
      ["faith", "Respect for my religious or spiritual beliefs"],
      ["international", "Experience supporting international students"],
      ["lgbtq", "Experience supporting LGBTQ+ individuals"],
      ["circumstances", "Experience with people in similar life circumstances"],
      ["none", "No specific preferences"],
      ["prefer_not", "Prefer not to answer"],
      ["other", "Other (please specify)"],
    ],
    exclusive: ["none", "prefer_not"],
    other: "other",
    // Each selected item (except none / prefer_not / other) gets a "must-have" toggle. Proposal open question 1.
    essentialPerItem: true,
  },
  {
    id: "q19", n: 19, section: "fit", type: "single",
    text: "How would you prefer to attend therapy sessions?",
    // Our helper text, not workflow wording: choosing one format is a filter (proposal section 3).
    hint: "If you choose one format, we'll only show therapists who offer it.",
    options: [
      ["in_person", "In person"],
      ["video", "Online video consultation"],
      ["phone", "Telephone consultation"],
      ["combination", "Combination of online and in-person sessions"],
      ["no_pref", "No preference"],
    ],
  },
  {
    id: "q20", n: 20, section: "fit", type: "multi", max: 3,
    text: "What practical factors are most important when choosing a therapist?",
    hint: "Select up to three.",
    options: [
      ["cost", "Affordable session fees"],
      ["flexible", "Flexible appointment times"],
      ["location", "Convenient location"],
      ["online", "Availability of online sessions"],
      ["wait", "Short waiting times"],
      ["expertise", "Therapist's professional expertise"],
      ["style", "Therapist's communication style"],
      ["language", "Language compatibility"],
      ["none", "No specific preference"],
    ],
    exclusive: ["none"],
  },
];

// Q18 "Therapist gender" follow-up (the workflow doc allows an optional field to specify).
FF.GENDER_OPTIONS = [["woman", "Woman"], ["man", "Man"], ["non_binary", "Non-binary"]];

FF.question = (id) => FF.QUESTIONS.find((q) => q.id === id);
FF.optionLabel = (qid, oid) => {
  const o = FF.question(qid).options.find(([id]) => id === oid);
  return o ? o[1] : oid;
};
