"use strict";
/*
  Patient check-ins: the short form a person fills in during therapy, and a synthetic year of them.
  Proposal section 7. Everything here is invented for the demo and labelled "synthetic" wherever it's shown.
  Nothing is real patient data, and nothing leaves the page.

  FF.CHECK_IN is the form. It asks the same questions every time, so change is measured, never asked:
    - for each area the person picked in Q6 (up to 3): how much it's getting in the way right now
    - one overall question
  Our own wording, inspired by brief outcome measures (ORS, MyLifeTracker) but not copied. Not a validated tool.

  FF.CHECK_INS is a synthetic year of courses, generated from RECIPE with a fixed seed per therapist, so it's the
  same on every load and changing one therapist's recipe doesn't reshuffle the others. The recipe is shaped like
  Kraus et al. (2011): each therapist helps with 2 or 3 areas, nobody with every area, and two therapists have an
  area where their patients got worse. The recipe is a group decision: change it here, and tests.html checks the
  profiles still come out the way it says.

  A course is one person's time with one therapist:
    { id: "c017", therapist: "ben", areas: ["anxiety", "study"], start: 12, finished: true,
      checkIns: [{ week: 12, session: 0, areas: { anxiety: 2, study: 3 }, overall: 2 }, ...] }
    week      weeks since the demo year began (0 to 52). The explainer's replay moves through these
    session   0 = before the first session
    areas     0 "Not at all" to 4 "Very much": higher means more in the way
    overall   0 "Really well" to 4 "Really badly": higher means worse
    finished  false if they stopped early, or haven't come back since their first check-in
*/
window.FF = window.FF || {};

(function () {
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  FF.CHECK_IN = {
    EVERY: 2,             // sessions between check-ins
    YEAR_WEEKS: 52,
    when: "Before the first session, after every second session, and when they finish or stop.",
    area: {
      text: (areaId) => `How much is ${lowerFirst(FF.optionLabel("q6", areaId))} getting in the way of your day-to-day life right now?`,
      options: ["Not at all", "A little", "Somewhat", "A lot", "Very much"],
    },
    overall: {
      text: "Overall, how are things going for you right now?",
      options: ["Really well", "Fairly well", "Okay", "Not so well", "Really badly"],
    },
  };

  /* By the end of the year: for each area, how many of the therapist's patients have a first and a later
     check-in, and what mostly happened to them. "helped", "same" (no clear change) or "worse".
     Fewer than 10 people is deliberate: those areas should read "not enough evidence yet". */
  const RECIPE = {
    maya:   { family: [12, "helped"], life_changes: [11, "helped"], anxiety: [6, "same"], low_mood: [4, "helped"] },
    // Lists anxiety and is trained in CBT, but patients with anxiety report no clear change.
    jordan: { study: [13, "helped"], work: [10, "helped"], anxiety: [11, "same"] },
    priya:  { family: [11, "helped"], self_esteem: [12, "helped"], life_changes: [5, "helped"], anxiety: [4, "same"] },
    // Doesn't list anxiety, but people who came about low mood or loneliness also report it, and got better.
    sam:    { low_mood: [13, "helped"], loneliness: [12, "helped"], anxiety: [11, "helped"], life_changes: [4, "same"] },
    layla:  { emotions: [13, "helped"], anxiety: [12, "helped"], self_esteem: [6, "same"] },
    wei:    { study: [12, "helped"], work: [11, "helped"], low_mood: [10, "same"], anxiety: [5, "helped"] },
    // Lists family difficulties, but those patients got worse.
    riley:  { self_esteem: [11, "helped"], emotions: [12, "helped"], family: [10, "worse"] },
    // Lists all nine areas and is trained in CBT, but patients with anxiety got worse.
    ben:    { study: [11, "helped"], low_mood: [12, "helped"], anxiety: [12, "worse"], work: [4, "same"], family: [3, "same"], self_esteem: [3, "helped"] },
  };

  /* Each person's change in an area by their last check-in, in steps on the 0 to 4 scale (positive = better).
     People are dealt these in a shuffled order, reshuffled each time a pattern runs out.
     Averages: helped +1.6, same 0, worse −1. Any 10 to 13 in a row stay on the same side of the rules in
     matching/records.js, so the labels at the end of the year always match the recipe. */
  const PATTERN = {
    helped: [2, 1, 2, 3, 1, 0, 2, 2, 1, 2],
    same: [0, 1, 0, -1, 0, 1, -1, 0, 0, 0],
    worse: [-1, -2, -1, 0, -1, -1, -2, 0, -1, -1],
  };

  /* ---------- seeded randomness (FNV-1a hash of the text, then mulberry32) ---------- */
  function seeded(text) {
    let a = 2166136261;
    for (let i = 0; i < text.length; i++) a = Math.imul(a ^ text.charCodeAt(i), 16777619);
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const shuffle = (r, arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = int(r, 0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const weighted = (r, items, weight) => {
    let x = r() * items.reduce((s, it) => s + weight(it), 0);
    return items.find((it) => (x -= weight(it)) < 0) || items[items.length - 1];
  };
  const clamp = (n) => Math.max(0, Math.min(4, n));

  function sessionsUpTo(last) {
    const s = [];
    for (let k = 0; k <= last; k += FF.CHECK_IN.EVERY) s.push(k);
    if (s[s.length - 1] !== last) s.push(last);   // always check in at the end
    return s;
  }

  // Check-ins move in a straight line from the starting answers to the final ones.
  function course(r, tid, areas, change) {
    const stopped = r() < 0.2;
    const last = stopped ? [2, 4][int(r, 0, 1)] : [6, 8, 10, 12][int(r, 0, 3)];
    const start = int(r, 0, FF.CHECK_IN.YEAR_WEEKS - 14);
    // Start where the final answer stays on the scale: 2 ("Somewhat") or higher, since they picked the area.
    const from = {};
    areas.forEach((a) => { from[a] = int(r, Math.max(2, change[a]), Math.min(4, 4 + change[a])); });
    const mean = areas.reduce((s, a) => s + change[a], 0) / areas.length;
    const overallFrom = int(r, 2, 3);
    const overallTo = clamp(overallFrom - Math.round(mean));
    const sessions = sessionsUpTo(last);
    return {
      therapist: tid, areas, start, finished: !stopped,
      checkIns: sessions.map((session, i) => {
        const f = i / (sessions.length - 1);
        const at = (a, b) => Math.round(a + (b - a) * f);
        const values = {};
        areas.forEach((a) => { values[a] = at(from[a], from[a] - change[a]); });
        return { week: start + session, session, areas: values, overall: at(overallFrom, overallTo) };
      }),
    };
  }

  const q6Order = (areas) => {
    const order = FF.question("q6").options.map(([id]) => id);
    return areas.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
  };

  function coursesFor(tid) {
    const r = seeded(`thera-fits/${tid}`);
    const recipe = RECIPE[tid];
    const queue = {};
    const nextChange = (a) => {
      if (!queue[a] || !queue[a].length) queue[a] = shuffle(r, PATTERN[recipe[a][1]]);
      return queue[a].shift();
    };
    const left = {};
    Object.keys(recipe).forEach((a) => { left[a] = recipe[a][0]; });

    // Deal the recipe's places out to people, 1 to 3 areas each, like Q6.
    const out = [];
    for (;;) {
      const open = Object.keys(left).filter((a) => left[a] > 0);
      if (!open.length) break;
      const k = Math.min(open.length, [1, 2, 2, 3][int(r, 0, 3)]);
      const areas = [];
      while (areas.length < k) areas.push(weighted(r, open.filter((a) => areas.indexOf(a) === -1), (a) => left[a]));
      areas.forEach((a) => { left[a] -= 1; });
      const change = {};
      areas.forEach((a) => { change[a] = nextChange(a); });
      out.push(course(r, tid, q6Order(areas), change));
    }

    // One person who checked in before their first session and never again: they don't count yet.
    const areas = [weighted(r, Object.keys(recipe), (a) => recipe[a][0])];
    const start = int(r, 10, FF.CHECK_IN.YEAR_WEEKS - 4);
    out.push({
      therapist: tid, areas, start, finished: false,
      checkIns: [{ week: start, session: 0, areas: { [areas[0]]: int(r, 2, 4) }, overall: int(r, 2, 3) }],
    });
    return out;
  }

  const all = Object.keys(RECIPE).reduce((acc, tid) => acc.concat(coursesFor(tid)), []);
  all.sort((a, b) => a.start - b.start || a.therapist.localeCompare(b.therapist));
  all.forEach((c, i) => { c.id = "c" + String(i + 1).padStart(3, "0"); });

  FF.CHECK_IN_RECIPE = RECIPE;
  FF.CHECK_IN_PATTERN = PATTERN;
  FF.CHECK_INS = all;
})();
