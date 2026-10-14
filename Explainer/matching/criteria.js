"use strict";
/*
  Shared measurements that ranking systems build on. Each one compares one answer with one therapist and says
  how well they fit (0..1) in plain words. Measurements carry no weight: deciding how much each one matters
  is exactly what makes ranking systems different, so that stays in each system's file.
*/
window.FF = window.FF || {};

(function () {
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const has = (arr, x) => arr.indexOf(x) !== -1;
  const join = (items) => (items.length <= 1 ? items.join("") : items.slice(0, -1).join(", ") + " and " + items[items.length - 1]);
  // Commas, not "and": option labels already contain "and" ("Direct and honest").
  const labels = (qid, ids) => ids.map((id) => FF.optionLabel(qid, id)).join(", ");
  const LEVEL = { strong: 1, some: 0.5, none: 0 };
  const LEVEL_TEXT = { strong: "Strong experience", some: "Some experience", none: "None listed" };
  const FORMAT = { in_person: "in-person sessions", video: "video sessions", phone: "phone sessions" };
  const EXPERIENCE = {
    cultural: "understanding cultural background", faith: "respecting religious or spiritual beliefs",
    international: "supporting international students", lgbtq: "supporting LGBTQ+ individuals",
  };
  const EXPERIENCE_SHORT = { cultural: "Cultural background", faith: "Faith or beliefs", international: "International students", lgbtq: "LGBTQ+ individuals" };
  const MODALITY = { cbt: "CBT", act: "ACT", dbt: "DBT skills", ipt: "IPT", psychodynamic: "psychodynamic therapy", person_centred: "person-centred therapy" };

  // The research doc's sourced pairings only. Anything else needs clinical sign-off (proposal open question 3).
  const PAIRINGS = {
    anxiety: { modalities: ["cbt"], text: "worry and anxiety" },
    emotions: { modalities: ["dbt"], text: "managing strong emotions" },
  };

  const part = (kind, question, label, fit, said, has, note) => ({ kind, question, label, fit, said, has, note: note || "" });

  /* ---------- filters: return { question, reason } for each miss ---------- */
  function format(answers, t) {
    const f = answers.q19;
    return FORMAT[f] && !has(t.formats, f) ? [{ question: "q19", reason: `Doesn't offer ${FORMAT[f]}.` }] : [];
  }
  function mustHaves(answers, t) {
    const must = answers.must || {};
    return list(answers.q18).filter((k) => must[k] && t.context[k] === "none")
      .map((k) => ({ question: "q18", reason: `No listed experience ${EXPERIENCE[k]}, a must-have.` }));
  }

  /* ---------- research group: is the therapist trained in a sourced pairing for what was described? ---------- */
  function sourcedNeeds(answers) {
    return list(answers.q6).filter((id) => PAIRINGS[id]);
  }
  function evidence(answers, t) {
    const hit = sourcedNeeds(answers).find((n) => PAIRINGS[n].modalities.some((m) => has(t.modalities, m)));
    if (!hit) return null;
    const p = PAIRINGS[hit];
    const m = p.modalities.find((x) => has(t.modalities, x));
    return `Trained in ${MODALITY[m]}, which has research support for ${p.text}.`;
  }

  /* ---------- parts ---------- */
  function qualities(answers, t) {
    const want = list(answers.q16);
    if (!want.length) return null;
    const hit = want.filter((q) => has(t.qualities, q));
    return part("qualities", "q16", "Qualities", hit.length / want.length, labels("q16", want), labels("q16", t.qualities),
      `${hit.length} of the ${want.length} picked`);
  }

  function communication(answers, t) {
    const want = answers.q17;
    if (!want) return null;
    let fit = 0;
    if (has(t.approach, want)) fit = 1;
    else if (want === "flexible") fit = t.approach.length > 1 ? 1 : 0.5;
    else if (has(t.approach, "flexible") || t.approach.length > 1) fit = 0.5;
    return part("communication", "q17", "Communication", fit, FF.optionLabel("q17", want), labels("q17", t.approach),
      fit === 1 ? "Works this way" : fit > 0 ? "Mixes approaches, so partly" : "Works a different way");
  }

  function experience(answers, t) {
    const must = answers.must || {};
    return list(answers.q18).map((k) => part("experience", "q18", `Experience: ${EXPERIENCE_SHORT[k]}`, LEVEL[t.context[k]],
      FF.optionLabel("q18", k) + (must[k] ? " (must-have)" : ""), LEVEL_TEXT[t.context[k]]));
  }

  // Practical parts always measure; `said` records whether the person picked the factor in Q20.
  const picked = (answers, f) => has(list(answers.q20), f);
  const saidQ20 = (answers, f) => (picked(answers, f) ? FF.optionLabel("q20", f) : "Not picked");
  function cost(answers, t) {
    return part("practical", "q20", "Fees", { 1: 1, 2: 0.5, 3: 0 }[t.fee_band], saidQ20(answers, "cost"),
      { 1: "$ (lower)", 2: "$$ (mid-range)", 3: "$$$ (higher)" }[t.fee_band], "Illustrative fee band");
  }
  function wait(answers, t) {
    const d = t.wait_days;
    return part("practical", "q20", "Waiting time", d <= 7 ? 1 : d <= 14 ? 0.5 : 0, saidQ20(answers, "wait"),
      d < 14 ? `About ${d} days` : `About ${Math.round(d / 7)} weeks`, "1 week or less is full, 2 weeks half");
  }
  function hours(answers, t) {
    return part("practical", "q20", "Appointment hours", { evenings_weekends: 1, weekends: 0.5, business: 0 }[t.hours], saidQ20(answers, "flexible"),
      { evenings_weekends: "Evenings and weekends", weekends: "Weekends only", business: "Weekday business hours" }[t.hours]);
  }

  // discount: a therapist who lists more than 3 areas has each match scaled by 3 / number listed,
  // because therapists judge their own strengths no better than chance (research doc, Constantino 2023).
  function areas(answers, t, discount) {
    const want = list(answers.q6);
    if (!want.length) return null;
    const hit = want.filter((a) => has(t.focus_areas, a));
    const n = t.focus_areas.length;
    const scale = discount ? Math.min(1, 3 / n) : 1;
    let note = `${hit.length} of the ${want.length} picked are on their list of ${n}`;
    if (scale < 1) note += `. Lists ${n}, so each match counts ${3}/${n}`;
    return part("areas", "q6", "Areas they list", (hit.length / want.length) * scale, labels("q6", want), labels("q6", t.focus_areas), note);
  }

  // Ranking systems set the weights: { kind: weight }. Parts of a kind not listed are dropped.
  function weigh(parts, weights) {
    return parts.filter((p) => p && weights[p.kind] != null).map((p) => ({ ...p, weight: weights[p.kind] }));
  }

  FF.criteria = { PAIRINGS, MODALITY, list, join, picked, format, mustHaves, sourcedNeeds, evidence, qualities, communication, experience, cost, wait, hours, areas, weigh };
})();
