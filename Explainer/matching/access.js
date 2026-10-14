"use strict";
/*
  Access first: optimises for getting into therapy cheaply and soon. Fees, waiting time and appointment hours
  count heavily for everyone, whether or not the person picked them in Q20. Personal fit counts a little.
  Here to show the trade-off behind proposal section 6 (patient A and Priya): change what counts most,
  and the shortlist changes.
*/
(function () {
  const C = FF.criteria;
  const WEIGHTS = { practical: 3, qualities: 1, communication: 1, experience: 1 };

  FF.rankers.register({
    id: "access",
    name: "Access first",
    summary: "Cheapest and soonest first. Fees, waiting time and hours count heavily for everyone; what the person wants in a therapist counts a little.",
    rules: [
      "Filter out anyone who doesn't offer the one session format picked, or who misses a must-have.",
      "Fees, waiting time and appointment hours always count ×3 each, even if the person didn't pick them.",
      "Qualities, communication and experience count ×1. Areas therapists list, and the research step, aren't used.",
    ],
    uses: {
      q6: "Not used",
      q16: "Points ×1",
      q17: "Points ×1",
      q18: "Points ×1 each. Must-haves filter",
      q19: "Filter",
      q20: "Not needed: fees, waiting time and hours always count ×3",
    },
    rank(answers, therapists) {
      return {
        results: therapists.map((t) => ({
          id: t.id,
          excluded: C.format(answers, t).concat(C.mustHaves(answers, t)),
          group: null,
          parts: C.weigh([
            C.cost(answers, t), C.wait(answers, t), C.hours(answers, t),
            C.qualities(answers, t), C.communication(answers, t), ...C.experience(answers, t),
          ], WEIGHTS),
        })),
      };
    },
  });
})();
