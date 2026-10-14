"use strict";
/*
  Matching engine. Pure functions, no UI, no storage: answers + therapists in, ranked shortlist out.
  Spec: documents/MVP matching proposal.md (sections 1–3). Order of operations:
    1. Safety step       handled by the UI before the questionnaire; never scored.
    2. Hard filters      accepting, a specific session format, and anything marked "must-have".
    3. Clinical-fit band only the research doc's sourced pairings (EVIDENCE_PAIRINGS). Everyone else is neutral.
    4. Preference score  weighted average of the components below, 0..1. Ranks therapists within a band.
  Shortlist = top 3 that pass the filters. If fewer than 3 pass, the rest are "closest fits"
  that say plainly what they're missing.

  Answers shape (ids from questions.js):
    { q1: "20", q2: "uni", q5: ["english", "indonesian"], q6: ["anxiety"], ..., q18: ["gender", "lgbtq"],
      q18_gender: "man", q19: "video", q20: ["cost", "wait"], essential: { language: true, lgbtq: true } }
*/
window.FF = window.FF || {};

(function () {
  // Starting weights from the proposal; tune against the test patients, not by eye.
  const WEIGHTS = {
    qualities: 3, approach: 3, context: 3, gender: 3, circumstances: 3,
    practical: 2,            // each Q20 factor picked
    lifeStage: 1, international: 1, language: 1, focus: 1, goal: 1, improve: 1, hardest: 1, combination: 1,
    styleBoost: 1.5,         // Q20 "communication style" multiplies qualities + approach
    languageBoost: 2,        // Q20 "language compatibility" adds to language
  };
  const LEVEL_POINTS = { strong: 1, some: 0.5, none: 0 };

  // Sourced pairings only (research doc). Anything else needs clinical sign-off: proposal open question 3.
  const EVIDENCE_PAIRINGS = {
    anxiety: { modalities: ["cbt"], text: "CBT, an approach with research support for worry and anxiety" },
    emotions: { modalities: ["dbt"], text: "DBT skills, an approach with research support for managing strong emotions" },
  };

  // Our guesses, flagged in the proposal. Low weight on purpose.
  const GOAL_APPROACH = { supported: "listening", coping: "practical", understand: "reflective", functioning: "structured" };
  const IMPROVE_HINTS = {
    stress: { approach: "practical" },
    emotions: { approach: "reflective" },
    routines: { approach: "structured" },
    motivation: { approach: "structured" },
    thoughts: { modalities: ["cbt", "act"] },
    relationships: { modalities: ["ipt"] },
  };
  const HARDEST_HINTS = {
    why: { approach: "reflective" },
    overwhelming: { modalities: ["dbt"] },
    what_to_do: { approach: "practical" },
    trust: { qualities: ["non_judgemental", "gentle"] },
    motivation: { approach: "structured" },
    expressing: { approach: "listening" },
    responsibilities: { approach: "structured" },
  };

  const SKIP = new Set(["not_sure", "no_pref", "none", "prefer_not", "other"]);
  const CONTEXT_ITEMS = ["cultural", "faith", "international", "lgbtq"];

  const QUALITY = { empathetic: "empathetic", gentle: "patient and gentle", non_judgemental: "non-judgemental", direct: "direct and honest",
    encouraging: "encouraging", calm: "calm and reassuring", practical: "practical", structured: "structured" };
  const APPROACH = { listening: "listening and emotional support", reflective: "reflective questions", practical: "practical advice and strategies",
    structured: "structured goals and tracking", flexible: "a flexible mix of approaches" };
  const CONTEXT = { cultural: "understanding cultural background", faith: "respecting religious or spiritual beliefs",
    international: "supporting international students", lgbtq: "supporting LGBTQ+ individuals",
    students: "supporting students", working: "supporting young people who work" };
  const LANGUAGE = { english: "English", mandarin: "Mandarin", indonesian: "Indonesian", arabic: "Arabic", hindi: "Hindi" };
  const FORMAT = { in_person: "in-person sessions", video: "video sessions", phone: "phone sessions" };
  const GENDER = { woman: "a woman", man: "a man", non_binary: "non-binary" };
  const FEE = { 1: "Lower example fee ($)", 2: "Mid-range example fee ($$)", 3: "Higher example fee ($$$)" };

  /* ---------------- helpers ---------------- */
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const picks = (answers, qid) => list(answers[qid]).filter((id) => !SKIP.has(id));
  const has = (arr, id) => arr.indexOf(id) !== -1;
  const join = (items) => (items.length <= 1 ? items.join("") : items.slice(0, -1).join(", ") + " and " + items[items.length - 1]);
  const essential = (answers, key) => !!(answers.essential && answers.essential[key]);
  const waitText = (d) => (d < 14 ? `about ${d} days` : `about ${Math.round(d / 7)} weeks`);

  function levelFor(score) {
    if (score >= 0.75) return "strong";
    if (score >= 0.35) return "partial";
    return "limited";
  }

  function approachFit(want, t) {
    if (has(t.approach, want)) return 1;
    if (want === "flexible") return t.approach.length > 1 ? 1 : 0.5;
    if (has(t.approach, "flexible") || t.approach.length > 1) return 0.5;
    return 0;
  }

  function hintFit(hint, t) {
    if (hint.approach) return approachFit(hint.approach, t);
    if (hint.modalities) return hint.modalities.some((m) => has(t.modalities, m)) ? 1 : 0;
    if (hint.qualities) return hint.qualities.some((q) => has(t.qualities, q)) ? 1 : 0;
    return 0;
  }

  // Non-English languages the person is fluent in, and whether English works for them at all.
  function languageNeeds(answers) {
    const langs = picks(answers, "q5");
    const other = langs.filter((l) => l !== "english");
    const noEnglish = langs.length > 0 && !has(langs, "english");
    return { other, required: other.length > 0 && (noEnglish || essential(answers, "language")) };
  }

  function lifeStages(answers) {
    const s = answers.q2;
    if (s === "uni" || s === "tafe") return ["students"];
    if (s === "full_time" || s === "part_time") return ["working"];
    if (s === "both") return ["students", "working"];
    return [];
  }

  function sourcedNeeds(answers) {
    return picks(answers, "q6").filter((id) => EVIDENCE_PAIRINGS[id]);
  }

  /* ---------------- 2. hard filters ---------------- */
  function filterMisses(answers, t) {
    const misses = [];
    if (!t.accepting) misses.push("Not taking new clients right now.");

    const format = answers.q19;
    if (FORMAT[format] && !has(t.formats, format)) misses.push(`Doesn't offer ${FORMAT[format]}.`);

    const lang = languageNeeds(answers);
    if (lang.required && !lang.other.some((l) => has(t.languages, l))) {
      misses.push(`Doesn't speak ${join(lang.other.map((l) => LANGUAGE[l] || l))}.`);
    }

    const q18 = picks(answers, "q18");
    if (has(q18, "gender") && answers.q18_gender && essential(answers, "gender") && t.gender !== answers.q18_gender) {
      misses.push(`Isn't ${GENDER[answers.q18_gender]}, which you marked as a must-have.`);
    }
    CONTEXT_ITEMS.forEach((item) => {
      if (has(q18, item) && essential(answers, item) && t.context[item] === "none") {
        misses.push(`No listed experience ${CONTEXT[item]}, which you marked as a must-have.`);
      }
    });
    if (has(q18, "circumstances") && essential(answers, "circumstances")) {
      const stages = lifeStages(answers);
      if (stages.length && stages.every((s) => t.context[s] === "none")) {
        misses.push("No listed experience with people in your situation, which you marked as a must-have.");
      }
    }
    return misses;
  }

  /* ---------------- 4. preference components ---------------- */
  // Each returns { key, label, weight, score 0..1, note }. weight 0 = shown as information, not scored.
  function components(answers, t) {
    const out = [];
    const add = (key, label, weight, score, note) => out.push({ key, label, weight, score, level: levelFor(score), note });
    const q20 = picks(answers, "q20");
    const style = has(q20, "style") ? WEIGHTS.styleBoost : 1;
    const q18 = picks(answers, "q18");

    // Clinical-fit band, as information (ranking is done by band, not by score).
    sourcedNeeds(answers).forEach((need) => {
      const p = EVIDENCE_PAIRINGS[need];
      const ok = p.modalities.some((m) => has(t.modalities, m));
      add("evidence_" + need, "Approach with research support", 0, ok ? 1 : 0,
        ok ? `Trained in ${p.text}.` : "Not trained in the approaches with the clearest research support for what you described.");
    });

    // Q16 qualities
    const wantQ = picks(answers, "q16");
    if (wantQ.length) {
      const hit = wantQ.filter((q) => has(t.qualities, q));
      add("qualities", "Qualities you want", WEIGHTS.qualities * style, hit.length / wantQ.length,
        hit.length ? `Described as ${join(hit.map((q) => QUALITY[q]))} (${hit.length} of your ${wantQ.length}).`
          : `Described as ${join(t.qualities.map((q) => QUALITY[q]))} rather than the qualities you picked.`);
    }

    // Q17 communication
    const wantA = picks(answers, "q17")[0];
    if (wantA) {
      const s = approachFit(wantA, t);
      const theirs = join(t.approach.map((a) => APPROACH[a]));
      add("approach", "How they communicate", WEIGHTS.approach * style, s,
        s === 1 ? `Works through ${theirs}, as you asked.` : s > 0 ? `Mixes approaches: ${theirs}.` : `Works mainly through ${theirs} rather than ${APPROACH[wantA]}.`);
    }

    // Q18 context items
    CONTEXT_ITEMS.forEach((item) => {
      if (!has(q18, item)) return;
      const lvl = t.context[item];
      add(item, CONTEXT[item][0].toUpperCase() + CONTEXT[item].slice(1), WEIGHTS.context, LEVEL_POINTS[lvl],
        lvl === "strong" ? `Strong experience ${CONTEXT[item]}.` : lvl === "some" ? `Some experience ${CONTEXT[item]}.` : `No listed experience ${CONTEXT[item]}. Worth asking about.`);
    });

    // Q18 gender
    if (has(q18, "gender") && answers.q18_gender) {
      const ok = t.gender === answers.q18_gender;
      add("gender", "Therapist gender", WEIGHTS.gender, ok ? 1 : 0, ok ? `Is ${GENDER[t.gender]}.` : `Is ${GENDER[t.gender]}, not ${GENDER[answers.q18_gender]}.`);
    }

    // Q2 (+ Q18 "similar life circumstances")
    const stages = lifeStages(answers);
    if (stages.length) {
      const best = stages.map((s) => [s, LEVEL_POINTS[t.context[s]]]).sort((a, b) => b[1] - a[1])[0];
      const w = has(q18, "circumstances") ? WEIGHTS.circumstances : WEIGHTS.lifeStage;
      add("circumstances", "People in your situation", w, best[1],
        best[1] === 1 ? `Strong experience ${CONTEXT[best[0]]}.` : best[1] > 0 ? `Some experience ${CONTEXT[best[0]]}.` : `No listed experience ${CONTEXT[stages[0]]}.`);
    }

    // Q4 international (only if Q18 didn't already ask for it)
    if (answers.q4 === "international" && !has(q18, "international")) {
      const lvl = t.context.international;
      add("international_q4", "Supporting international students", WEIGHTS.international, LEVEL_POINTS[lvl],
        lvl === "none" ? "No listed experience supporting international students." : `${lvl === "strong" ? "Strong" : "Some"} experience supporting international students.`);
    }

    // Q5 language (soft part; the filter handles must-haves)
    const lang = languageNeeds(answers);
    if (lang.other.length) {
      const shared = lang.other.filter((l) => has(t.languages, l));
      const w = WEIGHTS.language + (has(q20, "language") ? WEIGHTS.languageBoost : 0);
      add("language", "Language", w, shared.length ? 1 : 0,
        shared.length ? `Speaks ${join(shared.map((l) => LANGUAGE[l]))}.` : `Sessions in ${join(t.languages.map((l) => LANGUAGE[l] || l))}.`);
    }

    // Q19 format
    const format = answers.q19;
    if (FORMAT[format]) {
      // Closest fits can lack the format; the filter lists it as a miss, so don't claim it here.
      const ok = has(t.formats, format);
      add("format", "Session format", 0, ok ? 1 : 0, ok ? `Offers ${FORMAT[format]}.` : `Offers ${join(t.formats.map((f) => FORMAT[f]))} only.`);
    } else if (format === "combination") {
      const both = has(t.formats, "in_person") && has(t.formats, "video");
      const one = has(t.formats, "in_person") || has(t.formats, "video");
      add("format", "Session format", WEIGHTS.combination, both ? 1 : one ? 0.5 : 0,
        both ? "Offers both in-person and video sessions." : `Offers ${join(t.formats.map((f) => FORMAT[f]))} only.`);
    }

    // Q6 self-listed focus areas: low weight, and discounted when a therapist lists many (therapists oversell).
    const areas = picks(answers, "q6");
    if (areas.length) {
      const hit = areas.filter((a) => has(t.focus_areas, a));
      const breadth = Math.min(1, 3 / t.focus_areas.length);
      add("focus", "Areas you find challenging", WEIGHTS.focus, (hit.length / areas.length) * breadth,
        hit.length ? `Lists ${hit.length} of your ${areas.length} areas among their ${t.focus_areas.length} focus areas.` : "Doesn't list the areas you picked.");
    }

    // Q10 goal → approach
    const goal = GOAL_APPROACH[answers.q10];
    if (goal) {
      const s = approachFit(goal, t);
      add("goal", "What you want from support", WEIGHTS.goal, s,
        s === 1 ? "Their way of working suits what you want to achieve." : s > 0 ? "Partly suits what you want to achieve." : "Their way of working is less suited to what you want to achieve.");
    }

    // Q8 and Q9 hints (our guesses, low weight)
    const improve = picks(answers, "q8").map((id) => IMPROVE_HINTS[id]).filter(Boolean);
    if (improve.length) {
      const s = improve.reduce((sum, h) => sum + hintFit(h, t), 0) / improve.length;
      add("improve", "What you'd like to improve", WEIGHTS.improve, s,
        s >= 0.75 ? "Works in a way that suits what you'd like to improve." : s > 0 ? "Partly suits what you'd like to improve." : "Less focused on what you'd like to improve.");
    }
    const hardest = HARDEST_HINTS[answers.q9];
    if (hardest) {
      const s = hintFit(hardest, t);
      add("hardest", "What you find hardest", WEIGHTS.hardest, s,
        s === 1 ? "Works in a way that suits what you find hardest." : s > 0 ? "Partly suits what you find hardest." : "Less focused on what you find hardest.");
    }

    // Q20 practical factors
    q20.forEach((f) => {
      const w = WEIGHTS.practical;
      if (f === "cost") add("cost", "Affordable fees", w, { 1: 1, 2: 0.5, 3: 0 }[t.fee_band], FEE[t.fee_band] + ".");
      if (f === "wait") add("wait", "Short waiting time", w, t.wait_days <= 7 ? 1 : t.wait_days <= 14 ? 0.5 : 0, `First session in ${waitText(t.wait_days)}.`);
      if (f === "flexible") add("flexible", "Flexible appointment times", w, { evenings_weekends: 1, weekends: 0.5, business: 0 }[t.hours],
        { evenings_weekends: "Evening and weekend appointments.", weekends: "Weekend appointments only.", business: "Weekday business hours only." }[t.hours]);
      // Placeholder: we don't ask where the person lives, so "near campus" scores highest for a student audience.
      if (f === "location") add("location", "Convenient location", w, { near_campus: 1, cbd: 0.5, telehealth: 0.5 }[t.location],
        { near_campus: "Practice near campus.", cbd: "Practice in the CBD.", telehealth: "Telehealth only, so no travel." }[t.location]);
      if (f === "online") add("online", "Online sessions", w, has(t.formats, "video") ? 1 : 0, has(t.formats, "video") ? "Offers video sessions." : "No online sessions.");
      if (f === "expertise") {
        const needs = sourcedNeeds(answers);
        // Only comparable where we have a sourced pairing; otherwise skipped rather than guessed.
        if (needs.length) {
          const ok = needs.some((n) => EVIDENCE_PAIRINGS[n].modalities.some((m) => has(t.modalities, m)));
          add("expertise", "Professional expertise", w, ok ? 1 : 0, ok ? "Trained in an approach with research support for what you described." : "Not trained in the approaches with the clearest research support for what you described.");
        }
      }
    });
    return out;
  }

  /* ---------------- 3 + 4. score one therapist ---------------- */
  function evaluate(answers, t) {
    const needs = sourcedNeeds(answers);
    const reasons = components(answers, t);
    const total = reasons.reduce((s, r) => s + r.weight, 0);
    const score = total ? reasons.reduce((s, r) => s + r.weight * r.score, 0) / total : 0;
    const inBand = needs.length > 0 && needs.some((n) => EVIDENCE_PAIRINGS[n].modalities.some((m) => has(t.modalities, m)));
    const misses = filterMisses(answers, t);
    // Most important first: scored reasons by weight, then information-only rows.
    reasons.sort((a, b) => (b.weight || -1) - (a.weight || -1));
    return { therapist: t, passed: misses.length === 0, misses, band: inBand ? "evidence" : "neutral", score, reasons };
  }

  const byRank = (a, b) =>
    (a.band === b.band ? 0 : a.band === "evidence" ? -1 : 1) ||
    b.score - a.score ||
    a.therapist.name.localeCompare(b.therapist.name);

  /* ---------------- public: match ---------------- */
  function match(answers, therapists, size) {
    size = size || 3;
    const all = therapists.map((t) => evaluate(answers, t));
    const passed = all.filter((r) => r.passed).sort(byRank);
    // Closest fits: fewest missed must-haves first, then the usual ranking.
    const failed = all.filter((r) => !r.passed).sort((a, b) => a.misses.length - b.misses.length || byRank(a, b));
    const shortlist = passed.slice(0, size);
    const closest = failed.slice(0, Math.max(0, size - shortlist.length));
    return {
      status: shortlist.length >= size ? "full" : shortlist.length > 0 ? "narrow" : "none",
      shortlist,
      closest,
      ranked: passed.concat(failed),
      needs: sourcedNeeds(answers),
    };
  }

  FF.match = match;
  FF.matching = { WEIGHTS, EVIDENCE_PAIRINGS, LEVEL_POINTS, levelFor, evaluate, filterMisses, components };
})();
