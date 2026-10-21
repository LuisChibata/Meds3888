"use strict";
/*
  Track record: Research-guided, plus what patients report in their check-ins (proposal section 7).

  It starts from the research-guided result, so with no check-ins it ranks exactly the same (tests.html checks
  this). Then, once enough people with an area have checked in (matching/records.js), what patients report
  outranks what therapists say about themselves and their training:
    - patients with one of the person's areas got worse      filtered out (do no harm)
    - patients with one of the person's areas got better     ranked first, ahead of training
    - patients got worse in an area the person didn't pick   ranked lower, as in Constantino et al. (2021)
  "No clear change" and "not enough evidence yet" change nothing: the research-guided order stands.
  Most of the trial's benefit came from steering people away from a therapist's weak areas, which is why
  "got worse" filters and demotes, while "helped" only reorders.

  Reads context.checkIns (courses, see data/check-ins.js) up to context.week.
*/
(function () {
  const C = FF.criteria;
  const REC = FF.records;
  const { MIN_PEOPLE, HELPED, WORSE } = REC.RULES;
  const research = () => FF.rankers.list().find((r) => r.id === "research");
  const area = (a) => FF.optionShort("q6", a);
  const steps = (n) => `${n} ${n === 1 ? "step" : "steps"}`;
  const GROUPS = {
    helped: { order: 0, label: "Helped people with this" },
    helpedCaution: { order: 1, label: "Helped, with a caution" },
    // 2 and 3: Research-guided's groups, when the track record doesn't settle it.
    unknown: { order: 3, label: "No track record of helping yet" },
    caution: { order: 4, label: "A caution in another area" },
  };

  FF.rankers.register({
    id: "track-record",
    name: "Track record",
    usesCheckIns: true,
    summary: "Research-guided, plus what patients report in their check-ins. Once enough people with an area have checked in, what they report outranks what therapists say about themselves.",
    rules: [
      "Start from Research-guided: the same filters, research group and points.",
      `For each therapist and area, compare each person's first check-in with their latest. Once ${MIN_PEOPLE} people with that area have both, the average person decides: ${steps(HELPED)} better or more is "helped", ${WORSE === 0.5 ? "half a step" : steps(WORSE)} worse or more is "got worse", anything between is "no clear change".`,
      "Patients with one of the person's areas got worse: filtered out.",
      "Patients with one of the person's areas got better: ranked first, ahead of training.",
      "Patients got worse in an area the person didn't pick: ranked lower.",
      "No clear change, or not enough evidence yet: the research-guided order stands.",
    ],
    uses: {
      ...research().uses,
      q6: "What patients report for each area picked: filter and groups. Then as Research-guided",
    },
    rank(answers, therapists, context) {
      const ctx = context || {};
      const profile = REC.build(ctx.checkIns || [], { week: ctx.week });
      const base = research().rank(answers, therapists);
      const mine = C.list(answers.q6);
      const others = REC.areaIds().filter((a) => mine.indexOf(a) === -1);
      const said = (tid, areas) => areas.map((a) => `${area(a)}, ${REC.describe(profile.record(tid, a))}`).join("; ");

      const results = base.results.map((r) => {
        const rec = (a) => profile.record(r.id, a);
        const helped = mine.filter((a) => rec(a).label === "helped");
        const worse = mine.filter((a) => rec(a).label === "worse");
        const worseElsewhere = others.filter((a) => rec(a).label === "worse");
        const report = mine.length ? `From patients' check-ins: ${said(r.id, mine)}.` : "No areas picked in Q6, so there's no track record to look at.";
        const caution = worseElsewhere.length ? ` Caution: ${said(r.id, worseElsewhere)}, not one of the person's areas.` : "";

        let group;
        if (helped.length) group = { ...(worseElsewhere.length ? GROUPS.helpedCaution : GROUPS.helped), why: report + caution };
        else if (worseElsewhere.length) group = { ...GROUPS.caution, why: report + caution };
        else if (r.group) group = { order: 2 + r.group.order, label: r.group.label, why: `${r.group.why} ${report}` };
        else group = { ...GROUPS.unknown, why: report };

        return {
          ...r,
          excluded: r.excluded.concat(worse.map((a) => ({ question: "q6", reason: `${area(a)}: patients tended to get worse (${REC.people(rec(a).people)}).` }))),
          group,
        };
      });

      // Everyone in one group means the track record changes nothing: show no groups, exactly like Research-guided.
      const flat = results.every((r) => r.group.order === results[0].group.order);
      const notes = profile.counted ? [] : ["No check-ins counted yet, so this ranks exactly like Research-guided."];
      return {
        notes: flat ? notes.concat(base.notes || []) : notes,
        results: flat ? results.map((r) => ({ ...r, group: null })) : results,
      };
    },
  });
})();
