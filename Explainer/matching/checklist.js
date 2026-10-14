"use strict";
/*
  Simple checklist: a deliberately naive baseline, the way a basic directory filter might rank.
  Here for comparison with the research-guided system: no research step, every question worth the same,
  and it believes every area a therapist lists (watch Dr Ben Whitfield, who lists all nine).
*/
(function () {
  const C = FF.criteria;
  const WEIGHTS = { qualities: 1, communication: 1, experience: 1, practical: 1, areas: 1 };
  const PRACTICAL = { cost: C.cost, wait: C.wait, flexible: C.hours };

  FF.rankers.register({
    id: "checklist",
    name: "Simple checklist",
    summary: "One point for each thing that matches, like a basic directory. Shown for comparison: no research step, and it takes every therapist's list of areas at face value.",
    rules: [
      "Filter out anyone who doesn't offer the one session format picked, or who misses a must-have.",
      "Every item is worth up to 1 point: qualities, communication, each experience, each practical factor picked, and the areas therapists list.",
      "No research group, and a long list of areas counts in full.",
    ],
    uses: {
      q6: "Points ×1 (long lists count in full)",
      q16: "Points ×1",
      q17: "Points ×1",
      q18: "Points ×1 each. Must-haves filter",
      q19: "Filter",
      q20: "Points ×1 each, only for the ones picked",
    },
    rank(answers, therapists) {
      return {
        results: therapists.map((t) => ({
          id: t.id,
          excluded: C.format(answers, t).concat(C.mustHaves(answers, t)),
          group: null,
          parts: C.weigh([
            C.qualities(answers, t), C.communication(answers, t), ...C.experience(answers, t),
            ...Object.keys(PRACTICAL).filter((f) => C.picked(answers, f)).map((f) => PRACTICAL[f](answers, t)),
            C.areas(answers, t, false),
          ], WEIGHTS),
        })),
      };
    },
  });
})();
