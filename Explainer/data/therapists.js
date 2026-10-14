"use strict";
/*
  The same 8 fictional therapists as App/, cut down to the fields the explainer's questions use.
  All names and details are invented. Source: documents/MVP matching proposal.md, section 4.

    formats      "in_person" | "video" | "phone"                       Q19 filter
    fee_band     1 | 2 | 3  ($ / $$ / $$$, illustrative)              Q20 cost
    wait_days    days until a first session, illustrative             Q20 wait
    hours        "business" | "weekends" | "evenings_weekends"        Q20 flexible
    qualities    Q16 ids, up to 3                                     Q16
    approach     Q17 ids                                              Q17
    modalities   formal training: "cbt" "act" "dbt" "ipt" "psychodynamic" "person_centred"   Q6 research group
    focus_areas  Q6 ids the therapist SAYS they work on (therapists oversell)                  Q6
    context      "strong" | "some" | "none" for each Q18 id            Q18
*/
window.FF = window.FF || {};

FF.THERAPISTS = [
  {
    id: "maya", name: "Dr Maya Chen", initials: "MC", registration: "Clinical psychologist",
    formats: ["in_person", "video"], fee_band: 2, wait_days: 14, hours: "business",
    qualities: ["empathetic", "gentle", "non_judgemental"], approach: ["reflective"],
    modalities: ["person_centred", "psychodynamic"], focus_areas: ["family", "anxiety", "life_changes"],
    context: { cultural: "strong", faith: "some", international: "none", lgbtq: "none" },
  },
  {
    id: "jordan", name: "Jordan Smith", initials: "JS", registration: "Psychologist",
    formats: ["in_person"], fee_band: 1, wait_days: 5, hours: "evenings_weekends",
    qualities: ["direct", "practical", "structured"], approach: ["structured"],
    modalities: ["cbt"], focus_areas: ["study", "anxiety"],
    context: { cultural: "none", faith: "none", international: "none", lgbtq: "none" },
  },
  {
    id: "priya", name: "Priya Raman", initials: "PR", registration: "Counselling psychologist",
    formats: ["video", "in_person"], fee_band: 3, wait_days: 21, hours: "business",
    qualities: ["empathetic", "non_judgemental", "encouraging"], approach: ["flexible"],
    modalities: ["ipt", "act"], focus_areas: ["family", "self_esteem", "life_changes"],
    context: { cultural: "strong", faith: "strong", international: "strong", lgbtq: "none" },
  },
  {
    id: "sam", name: "Sam Okafor", initials: "SO", registration: "Mental health social worker",
    formats: ["video", "phone"], fee_band: 1, wait_days: 7, hours: "evenings_weekends",
    qualities: ["calm", "gentle", "encouraging"], approach: ["listening"],
    modalities: ["person_centred"], focus_areas: ["loneliness", "low_mood", "life_changes"],
    context: { cultural: "none", faith: "none", international: "none", lgbtq: "none" },
  },
  {
    id: "layla", name: "Dr Layla Haddad", initials: "LH", registration: "Clinical psychologist",
    formats: ["in_person", "video"], fee_band: 2, wait_days: 14, hours: "business",
    qualities: ["non_judgemental", "calm", "direct"], approach: ["reflective", "practical"],
    modalities: ["cbt", "dbt"], focus_areas: ["emotions", "anxiety", "self_esteem"],
    context: { cultural: "strong", faith: "strong", international: "none", lgbtq: "none" },
  },
  {
    id: "wei", name: "Wei Santoso", initials: "WS", registration: "Psychologist",
    formats: ["video"], fee_band: 2, wait_days: 4, hours: "evenings_weekends",
    qualities: ["encouraging", "practical", "gentle"], approach: ["practical"],
    modalities: ["cbt", "act"], focus_areas: ["work", "study", "low_mood"],
    context: { cultural: "none", faith: "none", international: "strong", lgbtq: "none" },
  },
  {
    id: "riley", name: "Riley Park", initials: "RP", registration: "Counselling psychologist",
    formats: ["in_person", "video"], fee_band: 2, wait_days: 10, hours: "weekends",
    qualities: ["non_judgemental", "empathetic", "direct"], approach: ["reflective"],
    modalities: ["person_centred", "dbt", "ipt"], focus_areas: ["self_esteem", "family", "emotions"],
    context: { cultural: "some", faith: "none", international: "none", lgbtq: "strong" },
  },
  {
    // Deliberate test case: lists every area but has one trained approach.
    // Shows why self-listed areas should count for little.
    id: "ben", name: "Dr Ben Whitfield", initials: "BW", registration: "Clinical psychologist",
    formats: ["in_person"], fee_band: 3, wait_days: 7, hours: "business",
    qualities: ["calm", "empathetic", "structured"], approach: ["flexible"],
    modalities: ["cbt"],
    focus_areas: ["study", "work", "anxiety", "low_mood", "family", "loneliness", "self_esteem", "life_changes", "emotions"],
    context: { cultural: "some", faith: "none", international: "none", lgbtq: "none" },
  },
];
