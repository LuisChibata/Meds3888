"use strict";
/*
  Profiles built from check-ins: what patients report about each therapist, area by area, and each person's
  own progress. Proposal section 7. Pure functions: no page code, no weights, no ranking.

  For each course, compare the person's first check-in with their latest one (up to a given week). A person
  counts once they have both, so people who stop early still count, from their last check-in. Then, for each
  therapist and area, the average person's change gives one label:

    not_enough   fewer than MIN_PEOPLE people with a first and a later check-in
    helped       the average person is at least HELPED steps better
    worse        the average person is at least WORSE steps worse (deliberately quicker to flag harm)
    same         anything in between: no clear change either way

  A fixed threshold, not a comparison with other therapists: when harm is common, comparing with the average can
  make a harmful therapist look good (Kraus et al., 2011, note 2). MIN_PEOPLE follows Kraus, who used each
  therapist's first 10 patients. The steps are on our own 0 to 4 check-in scale, which isn't a validated measure.
*/
window.FF = window.FF || {};

(function () {
  const RULES = { MIN_PEOPLE: 10, HELPED: 1, WORSE: 0.5 };
  const LABELS = { helped: "Helped", same: "No clear change", worse: "Got worse", not_enough: "Not enough evidence yet" };
  const areaIds = () => FF.question("q6").options.map(([id]) => id);
  const people = (n) => `${n} ${n === 1 ? "person" : "people"}`;

  // One person's change: first check-in against their latest one up to `week`. Positive = better.
  // null if they hadn't started by then; measured is false until they have a second check-in.
  function change(course, week) {
    const until = week == null ? Infinity : week;
    const seen = course.checkIns.filter((c) => c.week <= until);
    if (!seen.length) return null;
    const first = seen[0];
    const latest = seen[seen.length - 1];
    const measured = seen.length > 1;
    const areas = {};
    course.areas.forEach((a) => { areas[a] = measured ? first.areas[a] - latest.areas[a] : null; });
    return { measured, first, latest, count: seen.length, areas, overall: measured ? first.overall - latest.overall : null };
  }

  // A single person's change in plain words. One step either way is the smallest change the scale can show.
  const direction = (d) => (d >= 1 ? "better" : d <= -1 ? "worse" : "same");

  function label(n, average) {
    if (n < RULES.MIN_PEOPLE) return "not_enough";
    if (average >= RULES.HELPED) return "helped";
    if (average <= -RULES.WORSE) return "worse";
    return "same";
  }

  const empty = () => ({ people: 0, waiting: 0, better: 0, same: 0, worse: 0, changes: [], average: null, label: "not_enough" });

  /* Every therapist's profile from patients' check-ins, as it stood at `week` (default: everything).
     record(therapistId, areaId) → { people, waiting, better, same, worse, changes, average, label }
       people    counted: a first and a later check-in
       waiting   checked in once so far, so not counted yet
       better / same / worse   how many of `people` changed which way
       changes   each counted person's change, in steps (positive = better) */
  function build(courses, opts) {
    const week = opts && opts.week != null ? opts.week : Infinity;
    const byTherapist = {};
    const slot = (tid, a) => {
      const t = byTherapist[tid] || (byTherapist[tid] = {});
      return t[a] || (t[a] = empty());
    };
    let counted = 0;
    let waiting = 0;
    (courses || []).forEach((c) => {
      const ch = change(c, week);
      if (!ch) return;
      if (ch.measured) counted += 1; else waiting += 1;
      c.areas.forEach((a) => {
        const rec = slot(c.therapist, a);
        if (!ch.measured) { rec.waiting += 1; return; }
        rec.people += 1;
        rec.changes.push(ch.areas[a]);
        rec[direction(ch.areas[a])] += 1;
      });
    });
    Object.keys(byTherapist).forEach((tid) => Object.keys(byTherapist[tid]).forEach((a) => {
      const rec = byTherapist[tid][a];
      rec.average = rec.people ? rec.changes.reduce((s, d) => s + d, 0) / rec.people : null;
      rec.label = label(rec.people, rec.average);
    }));
    const record = (tid, a) => (byTherapist[tid] && byTherapist[tid][a]) || empty();
    return { week, counted, waiting, record };
  }

  // One area of one therapist's record in words: "helped (12 people)", "not enough evidence yet (4 people)".
  function describe(rec) {
    if (rec.label === "not_enough") {
      if (rec.people) return `not enough evidence yet (${people(rec.people)})`;
      return rec.waiting ? "waiting for a second check-in" : "no check-ins yet";
    }
    return `${LABELS[rec.label].toLowerCase()} (${people(rec.people)})`;
  }

  // One person's own progress, for their profile: each area they picked, and overall.
  function progress(course, week) {
    const ch = change(course, week);
    if (!ch) return null;
    const line = (from, to, d) => ({ from, to, change: d, word: d == null ? null : direction(d) });
    return {
      measured: ch.measured,
      checkIns: ch.count,
      areas: course.areas.map((a) => ({ area: a, ...line(ch.first.areas[a], ch.latest.areas[a], ch.areas[a]) })),
      overall: line(ch.first.overall, ch.latest.overall, ch.overall),
    };
  }

  FF.records = { RULES, LABELS, areaIds, people, change, label, build, describe, progress };
})();
