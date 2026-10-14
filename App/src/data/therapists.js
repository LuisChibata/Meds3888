"use strict";
/*
  The 8 fictional therapists (seed data). All names and details are invented.
  Source: documents/MVP matching proposal.md, section 4. Schema: section 2.

  Every field is scored against a patient answer, so use only the option ids from questions.js:
    gender        "woman" | "man" | "non_binary"                     (Q18 gender)
    languages     Q5 ids                                             (Q5)
    formats       "in_person" | "video" | "phone"                    (Q19)
    fee_band      1 | 2 | 3  ($ / $$ / $$$, illustrative)            (Q20 cost)
    wait_days     days until a first session, illustrative           (Q20 wait)
    hours         "business" | "weekends" | "evenings_weekends"      (Q20 flexible)
    location      "near_campus" | "cbd" | "telehealth"               (Q20 location)
    accepting     false removes them from every shortlist
    qualities     Q16 ids, up to 3                                   (Q16, high weight)
    approach      Q17 ids                                            (Q17, Q10, Q9)
    modalities    formal training: "cbt" "act" "dbt" "ipt" "psychodynamic" "person_centred"
    focus_areas   Q6 ids the therapist SAYS they work on             (low weight: therapists oversell)
    context       "strong" | "some" | "none" for each Q18 context item and life stage

  No hand-written alignment per priority: matching.js computes it from these fields.

  photo (not scored) is a free stock photo, path relative to index.html; sources in img/therapists/CREDITS.md.
  Without one, the card falls back to the initials.
*/
window.FF = window.FF || {};

FF.THERAPISTS = [
  {
    id: "maya", name: "Dr Maya Chen", initials: "MC", photo: "img/therapists/maya.jpg",
    registration: "Clinical psychologist",
    gender: "woman", languages: ["english", "mandarin"], formats: ["in_person", "video"],
    fee_band: 2, wait_days: 14, hours: "business", location: "cbd", accepting: true,
    qualities: ["empathetic", "gentle", "non_judgemental"],
    approach: ["reflective"],
    modalities: ["person_centred", "psychodynamic"],
    focus_areas: ["family", "anxiety", "life_changes"],
    context: { cultural: "strong", faith: "some", international: "none", lgbtq: "none", students: "none", working: "none" },
    about: "Maya works mostly with young adults navigating relationships, family expectations and anxiety. She's interested in how someone's history and circumstances shape what they're going through now.",
    tradeoff: "Less structured if you'd like a clear plan from the first session.",
  },
  {
    id: "jordan", name: "Jordan Smith", initials: "JS", photo: "img/therapists/jordan.jpg",
    registration: "Psychologist",
    gender: "non_binary", languages: ["english"], formats: ["in_person"],
    fee_band: 1, wait_days: 5, hours: "evenings_weekends", location: "near_campus", accepting: true,
    qualities: ["direct", "practical", "structured"],
    approach: ["structured"],
    modalities: ["cbt"],
    focus_areas: ["study", "anxiety"],
    context: { cultural: "none", faith: "none", international: "none", lgbtq: "none", students: "strong", working: "none" },
    about: "Jordan works with university students on stress, anxiety and building routines that hold up during busy periods. Sessions are goal-focused and structured.",
    tradeoff: "In person only, and less focus on family or cultural context.",
  },
  {
    id: "priya", name: "Priya Raman", initials: "PR", photo: "img/therapists/priya.jpg",
    registration: "Counselling psychologist",
    gender: "woman", languages: ["english", "hindi"], formats: ["video", "in_person"],
    fee_band: 3, wait_days: 21, hours: "business", location: "cbd", accepting: true,
    qualities: ["empathetic", "non_judgemental", "encouraging"],
    approach: ["flexible"],
    modalities: ["ipt", "act"],
    focus_areas: ["family", "self_esteem", "life_changes"],
    context: { cultural: "strong", faith: "strong", international: "strong", lgbtq: "none", students: "none", working: "none" },
    about: "Priya works with young adults on identity, family relationships and the pressure of balancing different expectations. Her approach blends reflection with practical tools.",
    tradeoff: "Highest cost and the longest wait.",
  },
  {
    id: "sam", name: "Sam Okafor", initials: "SO", photo: "img/therapists/sam.jpg",
    registration: "Mental health social worker",
    gender: "man", languages: ["english"], formats: ["video", "phone"],
    fee_band: 1, wait_days: 7, hours: "evenings_weekends", location: "telehealth", accepting: true,
    qualities: ["calm", "gentle", "encouraging"],
    approach: ["listening"],
    modalities: ["person_centred"],
    focus_areas: ["loneliness", "low_mood", "life_changes"],
    context: { cultural: "none", faith: "none", international: "none", lgbtq: "none", students: "none", working: "strong" },
    about: "Sam supports young adults who feel stretched thin or isolated, often while juggling work. Sessions are unhurried and centred on being heard.",
    tradeoff: "No in-person sessions, and less goal-structured.",
  },
  {
    id: "layla", name: "Dr Layla Haddad", initials: "LH", photo: "img/therapists/layla.jpg",
    registration: "Clinical psychologist",
    gender: "woman", languages: ["english", "arabic"], formats: ["in_person", "video"],
    fee_band: 2, wait_days: 14, hours: "business", location: "cbd", accepting: true,
    qualities: ["non_judgemental", "calm", "direct"],
    approach: ["reflective", "practical"],
    modalities: ["cbt", "dbt"],
    focus_areas: ["emotions", "anxiety", "self_esteem"],
    context: { cultural: "strong", faith: "strong", international: "none", lgbtq: "none", students: "none", working: "none" },
    about: "Layla helps young adults understand strong emotions and build skills to manage them. She's comfortable working with faith and family values when they matter to you.",
    tradeoff: "Longer wait, and no evening appointments.",
  },
  {
    id: "wei", name: "Wei Santoso", initials: "WS", photo: "img/therapists/wei.jpg",
    registration: "Psychologist",
    gender: "man", languages: ["english", "indonesian"], formats: ["video"],
    fee_band: 2, wait_days: 4, hours: "evenings_weekends", location: "telehealth", accepting: true,
    qualities: ["encouraging", "practical", "gentle"],
    approach: ["practical"],
    modalities: ["cbt", "act"],
    focus_areas: ["work", "study", "low_mood"],
    context: { cultural: "none", faith: "none", international: "strong", lgbtq: "none", students: "strong", working: "none" },
    about: "Wei works with students and young workers, many of them far from home, on stress and motivation. Sessions focus on practical steps you can try straight away.",
    tradeoff: "Video only, and less room for open-ended reflection.",
  },
  {
    id: "riley", name: "Riley Park", initials: "RP", photo: "img/therapists/riley.jpg",
    registration: "Counselling psychologist",
    gender: "non_binary", languages: ["english"], formats: ["in_person", "video"],
    fee_band: 2, wait_days: 10, hours: "weekends", location: "near_campus", accepting: true,
    qualities: ["non_judgemental", "empathetic", "direct"],
    approach: ["reflective"],
    modalities: ["person_centred", "dbt", "ipt"],
    focus_areas: ["self_esteem", "family", "emotions"],
    context: { cultural: "some", faith: "none", international: "none", lgbtq: "strong", students: "none", working: "none" },
    about: "Riley works with young adults on identity, relationships and feelings that can get overwhelming. Many of their clients are LGBTQ+.",
    tradeoff: "Weekend appointments only.",
  },
  {
    // Deliberate test case: lists every focus area but has one trained modality.
    // Checks that self-reported specialties don't push a therapist to the top.
    id: "ben", name: "Dr Ben Whitfield", initials: "BW", photo: "img/therapists/ben.jpg",
    registration: "Clinical psychologist",
    gender: "man", languages: ["english"], formats: ["in_person"],
    fee_band: 3, wait_days: 7, hours: "business", location: "cbd", accepting: true,
    qualities: ["calm", "empathetic", "structured"],
    approach: ["flexible"],
    modalities: ["cbt"],
    focus_areas: ["study", "work", "anxiety", "low_mood", "family", "loneliness", "self_esteem", "life_changes", "emotions"],
    context: { cultural: "some", faith: "none", international: "none", lgbtq: "none", students: "none", working: "none" },
    about: "Ben sees adults across a broad range of concerns in a CBD practice.",
    tradeoff: "Broad list of areas but one trained approach, and the highest fee.",
  },
];
