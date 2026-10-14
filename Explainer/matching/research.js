"use strict";
/*
  Research-guided: the group's working spec (documents/MVP matching proposal.md section 1, simplified to six
  questions). Order from the research doc's "Recommendations": filters, then training in an approach with research
  support for what the person described, then preferences as the last layer. Self-listed areas count least.
*/
(function () {
  const C = FF.criteria;
  const WEIGHTS = { qualities: 3, communication: 3, experience: 3, practical: 2, areas: 1 };
  const PRACTICAL = { cost: C.cost, wait: C.wait, flexible: C.hours };

  FF.rankers.register({
    id: "research",
    name: "Research-guided",
    summary: "The group's working spec. Training with research support for what the person described comes first, then what they said they want in a therapist.",
    rules: [
      "Filter out anyone who doesn't offer the one session format picked, or who misses a must-have.",
      "If the person picked anxiety or managing emotions, therapists trained in the approach with research support for it (CBT, DBT skills) go first.",
      "Within each group, add up points. Qualities, communication and experience count ×3, practical factors the person picked ×2, and areas therapists list themselves ×1.",
      "A therapist who lists more than 3 areas gets less credit for each, because therapists oversell their own strengths.",
    ],
    uses: {
      q6: "Research group, and points ×1 (long lists count less)",
      q16: "Points ×3",
      q17: "Points ×3",
      q18: "Points ×3 each. Must-haves filter",
      q19: "Filter",
      q20: "Points ×2 each, only for the ones picked",
    },
    rank(answers, therapists) {
      const needs = C.sourcedNeeds(answers);
      const training = C.join(needs.map((n) => C.PAIRINGS[n].modalities.map((m) => C.MODALITY[m]).join(" or ")));
      const notes = needs.length ? [] : ["No research group yet: only anxiety and managing emotions have a sourced pairing, and neither is picked in Q6."];
      return {
        notes,
        results: therapists.map((t) => {
          const why = needs.length ? C.evidence(answers, t) : null;
          const practical = Object.keys(PRACTICAL).filter((f) => C.picked(answers, f)).map((f) => PRACTICAL[f](answers, t));
          return {
            id: t.id,
            excluded: C.format(answers, t).concat(C.mustHaves(answers, t)),
            group: !needs.length ? null
              : why ? { order: 0, label: "Research group", why }
                : { order: 1, label: "Everyone else", why: `Not trained in ${training}, so ranked after the research group.` },
            parts: C.weigh([C.qualities(answers, t), C.communication(answers, t), ...C.experience(answers, t), ...practical, C.areas(answers, t, true)], WEIGHTS),
          };
        }),
      };
    },
  });
})();
