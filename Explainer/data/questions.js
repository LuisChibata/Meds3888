"use strict";
/*
  The explainer's six questions: one for each layer of matching, so every layer has something to show.
  Wording is canonical (documents/MEDS3888 - G13 (LIVED EXPERIENCE) workflow.md); change it there first.
  Option lists are trimmed to what matching uses. "Other", "Not sure" and "No specific preference"
  are left out because leaving a question blank means the same thing here.

    Q6   challenging areas    research group (sourced pairings) + areas therapists list themselves
    Q16  qualities            personal fit
    Q17  communication        personal fit
    Q18  characteristics      personal fit, and a filter when marked "must-have" (gender and
                              "similar life circumstances" left out to keep it short)
    Q19  session format       filter when one format is picked
    Q20  practical factors    cost, waiting time, appointment hours

  Answers shape (option ids are what matching/ and therapists.js use):
    { q6: ["anxiety"], q16: ["practical", "direct"], q17: "practical", q18: ["lgbtq"], must: { lgbtq: true },
      q19: "video", q20: ["cost", "wait"] }
*/
window.FF = window.FF || {};

FF.QUESTIONS = [
  {
    id: "q6", n: 6, type: "multi", max: 3,
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
    ],
  },
  {
    id: "q16", n: 16, type: "multi", max: 3,
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
    ],
  },
  {
    id: "q17", n: 17, type: "single",
    text: "How would you prefer a therapist to communicate with you?",
    options: [
      ["listening", "Mostly listening and providing emotional support"],
      ["reflective", "Asking reflective questions to help me understand myself"],
      ["practical", "Providing practical advice and coping strategies"],
      ["structured", "Setting structured goals and tracking progress"],
      ["flexible", "A flexible combination of these approaches"],
    ],
  },
  {
    id: "q18", n: 18, type: "multi",
    text: "Are there any therapist characteristics or experiences that are particularly important to you?",
    hint: "Select all that apply. Mark any as a must-have to filter on it.",
    options: [
      ["cultural", "Understanding of my cultural background"],
      ["faith", "Respect for my religious or spiritual beliefs"],
      ["international", "Experience supporting international students"],
      ["lgbtq", "Experience supporting LGBTQ+ individuals"],
    ],
    mustHave: true,
  },
  {
    id: "q19", n: 19, type: "single",
    text: "How would you prefer to attend therapy sessions?",
    hint: "Picking one format filters on it. A combination, or no preference, doesn't.",
    options: [
      ["in_person", "In person"],
      ["video", "Online video consultation"],
      ["phone", "Telephone consultation"],
      ["combination", "Combination of online and in-person sessions"],
      ["no_pref", "No preference"],
    ],
  },
  {
    id: "q20", n: 20, type: "multi",
    text: "What practical factors are most important when choosing a therapist?",
    hint: "Select all that apply.",
    options: [
      ["cost", "Affordable session fees"],
      ["wait", "Short waiting times"],
      ["flexible", "Flexible appointment times"],
    ],
  },
];

FF.question = (id) => FF.QUESTIONS.find((q) => q.id === id);
FF.optionLabel = (qid, oid) => {
  const o = FF.question(qid).options.find(([id]) => id === oid);
  return o ? o[1] : oid;
};
