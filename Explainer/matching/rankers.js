"use strict";
/*
  Ranking systems: the contract between matching and the website.

  Design decision (14/10/26): matching is decoupled from the website. The page never scores anything.
  It hands the answers and the therapists to a ranking system, and draws whatever comes back.
  A new ranking system is one file in this folder that calls FF.rankers.register(). Add a <script>
  for it to index.html and tests.html and the page lists it, runs it and explains it, with no other changes.

  A ranking system:
    {
      id:      "research"                        stable id: ?ranker=research, tests
      name:    "Research-guided"
      summary: "One plain sentence on what it puts first."
      rules:   ["Each rule in plain language, in the order it's applied.", ...]
      uses:    { q6: "Research group", q16: "Points ×3", ... }   how it uses each question (every id in FF.QUESTIONS)
      rank(answers, therapists) → { results: [Result, ...], notes: ["Optional plain-language note", ...] }
    }

  Result: one per therapist, in any order. rank() doesn't sort: run() does, the same way for every system,
  so the ordering rule shown on the page (ORDER_RULE) is always true.
    {
      id:       therapist id
      excluded: [{ question: "q19", reason: "Doesn't offer video sessions." }]    [] = passes every filter
      group:    { order: 0, label: "Research group", why: "Trained in CBT, …" }  or null.
                Lower order ranks first, whatever the points. Give every therapist a group, or none.
      parts:    [Part, ...]   how the points were built
    }
  Part:
    { kind, question, label, said, has, fit, weight, note }
    kind:    one of KINDS (the page colours the bars by kind; a new kind needs a colour in index.html)
    fit:     0..1, how well the therapist matches this one thing
    weight:  how much this ranking system cares about it. points = weight × fit
    said / has / note: plain text for the breakdown table (the person's answer / the therapist's side)
*/
window.FF = window.FF || {};

(function () {
  const KINDS = [
    { id: "qualities", label: "Qualities", question: "q16" },
    { id: "communication", label: "Communication", question: "q17" },
    { id: "experience", label: "Experience", question: "q18" },
    { id: "practical", label: "Practical", question: "q20" },
    { id: "areas", label: "Areas they list", question: "q6" },
  ];
  const SHORTLIST_SIZE = 3;
  const ORDER_RULE = [
    "Filtered-out therapists go last.",
    "Then by group, if the system uses groups.",
    "Then by points. Ties go alphabetically.",
    `The first ${SHORTLIST_SIZE} who aren't filtered out are the shortlist.`,
  ];

  const registry = [];
  const register = (ranker) => { registry.push(ranker); };
  const list = () => registry.slice();
  const get = (id) => registry.find((r) => r.id === id) || registry[0];

  const groupOrder = (r) => (r.group ? r.group.order : 1e9);
  const byOrder = (a, b) =>
    a.excluded.length - b.excluded.length ||      // passes everything first, then fewest misses
    groupOrder(a) - groupOrder(b) ||
    b.score - a.score ||
    a.therapist.name.localeCompare(b.therapist.name);

  // The only entry point the page uses.
  function run(id, answers, therapists) {
    const ranker = get(id);
    const out = ranker.rank(answers, therapists);
    const byId = {};
    therapists.forEach((t) => { byId[t.id] = t; });
    const results = out.results.map((r) => {
      const parts = r.parts.map((p) => ({ ...p, points: p.weight * p.fit }));
      return {
        ...r, therapist: byId[r.id], parts,
        score: parts.reduce((s, p) => s + p.points, 0),
        max: parts.reduce((s, p) => s + p.weight, 0),
      };
    });
    results.sort(byOrder);
    results.forEach((r, i) => {
      r.position = i + 1;
      r.shortlisted = r.excluded.length === 0 && i < SHORTLIST_SIZE;
    });
    const shortlist = results.filter((r) => r.shortlisted);
    return {
      ranker, results, shortlist, notes: out.notes || [],
      status: shortlist.length >= SHORTLIST_SIZE ? "full" : shortlist.length > 0 ? "narrow" : "none",
    };
  }

  // Contract check for tests.html: returns a list of problems, empty when the output is valid.
  function check(ranker, out, therapists) {
    const problems = [];
    ["id", "name", "summary"].forEach((k) => { if (typeof ranker[k] !== "string" || !ranker[k]) problems.push(`missing ${k}`); });
    if (!Array.isArray(ranker.rules) || !ranker.rules.length) problems.push("missing rules");
    (FF.QUESTIONS || []).forEach((q) => { if (!ranker.uses || !ranker.uses[q.id]) problems.push(`uses has no entry for ${q.id}`); });
    if (!out || !Array.isArray(out.results)) return problems.concat("rank() returned no results array");
    const ids = out.results.map((r) => r.id);
    therapists.forEach((t) => { if (ids.filter((x) => x === t.id).length !== 1) problems.push(`${t.id}: needs exactly one result`); });
    const grouped = out.results.filter((r) => r.group).length;
    if (grouped && grouped !== out.results.length) problems.push("some therapists have a group and some don't");
    const kinds = KINDS.map((k) => k.id);
    out.results.forEach((r) => {
      if (!Array.isArray(r.excluded) || r.excluded.some((e) => !e.reason || !e.question)) problems.push(`${r.id}: excluded needs { question, reason }`);
      if (r.group && (typeof r.group.order !== "number" || !r.group.label)) problems.push(`${r.id}: group needs order and label`);
      (r.parts || []).forEach((p) => {
        if (kinds.indexOf(p.kind) === -1) problems.push(`${r.id}: unknown kind "${p.kind}"`);
        if (!FF.question || !FF.question(p.question)) problems.push(`${r.id}: unknown question "${p.question}"`);
        if (!(p.fit >= 0 && p.fit <= 1)) problems.push(`${r.id}/${p.label}: fit ${p.fit} outside 0..1`);
        if (!(p.weight >= 0)) problems.push(`${r.id}/${p.label}: weight ${p.weight} below 0`);
        if (!p.label || p.said == null || p.has == null) problems.push(`${r.id}: part needs label, said and has`);
      });
    });
    return problems;
  }

  FF.rankers = { KINDS, SHORTLIST_SIZE, ORDER_RULE, register, list, get, run, check };
})();
