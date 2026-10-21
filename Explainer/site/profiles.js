"use strict";
/*
  The two profiles Thera-Fits builds, in the same language (the Q6 areas and the other answers):
    PersonProfile   what the person would see about themselves: a few plain lines, never scores
    CheckIn         try the check-in as this person: it feeds their own progress and their therapist's profile
    Timeline        how far into the synthetic year of check-ins the therapist profiles are shown, with a replay
    TherapistGrid   each therapist: the areas they say they work on, next to what their patients report
    CellDetail      one therapist and one area: every counted person's change, and the rule that labelled it
    HowBuilt        what a check-in asks, and the rules, taken from data/check-ins.js and matching/records.js
  These draw what matching/records.js returns. They never decide a label themselves.
*/
window.FF = window.FF || {};

(function () {
  const { useState, useEffect, useRef } = React;
  const { h, IconCheck, IconPlay, IconPause, IconRestart, Button, Notice, DemoBadge, Tag, RECORD_LOOK: LOOK, recordLook: lookOf } = FF.ui;
  const REC = FF.records;
  const { MIN_PEOPLE, HELPED, WORSE } = REC.RULES;

  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const areaIds = () => REC.areaIds();
  const short = (a) => FF.optionShort("q6", a);
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const andList = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
  const training = (t) => t.modalities.map((m) => FF.criteria.MODALITY[m]).join(", ");
  const steps = (n) => `${n} ${n === 1 ? "step" : "steps"}`;
  const halfOr = (n) => (n === 0.5 ? "half a step" : steps(n));
  const averageText = (avg) => {
    const n = Math.round(Math.abs(avg) * 10) / 10;
    return n === 0 ? "no change on average" : `${steps(n)} ${avg > 0 ? "better" : "worse"} on average`;
  };


  /* ---------------- the person's profile ---------------- */
  const CHANGE_WORD = { better: "better", same: "about the same", worse: "worse" };

  // The lines the person sees, as [term, value] pairs. Also used by the walkthrough (site/story.js).
  function profileRows(answers, course, week) {
    const must = answers.must || {};
    const progress = course ? REC.progress(course, week) : null;
    const join = (items) => items.filter(Boolean).join(" · ");
    const rows = [
      ["Working on", join(list(answers.q6).map(short))],
      ["Wants a therapist who is", join(list(answers.q16).map((id) => FF.optionLabel("q16", id)))],
      ["Prefers", answers.q17 ? upperFirst(FF.optionLabel("q17", answers.q17).replace(/^Mostly /, "")) : ""],
      ["Experience that matters", join(list(answers.q18).map((id) => FF.optionLabel("q18", id) + (must[id] ? " (must-have)" : "")))],
      ["Sessions", answers.q19 ? FF.optionLabel("q19", answers.q19) : ""],
      ["Practical", join(list(answers.q20).map((id) => FF.optionLabel("q20", id)))],
    ];
    if (progress) {
      rows.push(["Since they started", progress.measured
        ? progress.areas.map((p) => `${short(p.area)}:\u00a0${CHANGE_WORD[p.word]}`).concat(`Overall:\u00a0${CHANGE_WORD[progress.overall.word]}`).join(" · ")
        : "Shown after their next check-in"]);
    }
    return rows;
  }

  function PersonProfile({ answers, course, week }) {
    const rows = profileRows(answers, course, week);
    const any = rows.some(([, v]) => v);
    return h("section", { "aria-labelledby": "person-profile-title", className: "rounded-2xl border border-accent/30 bg-surface p-4 shadow-[0_1px_0_rgb(var(--line))] sm:p-5" },
      h("div", { className: "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1" },
        h("h3", { id: "person-profile-title", className: "font-display text-lg font-semibold text-ink" }, "What the person sees"),
        h("p", { className: "text-xs text-muted" }, "Plain words. The data behind it stays behind the scenes.")),
      any
        ? h("dl", { className: "mt-3 grid gap-x-4 gap-y-2 text-[0.95rem] sm:grid-cols-[auto_1fr]" },
          rows.map(([term, value]) => [
            h("dt", { key: term + "t", className: "text-sm font-bold text-muted sm:pt-px" }, term),
            h("dd", { key: term + "d", className: `m-0 leading-snug ${value ? "text-ink" : "text-muted"}` }, value || "Not answered yet"),
          ]))
        : h("p", { className: "mt-2 text-[0.95rem] text-muted" }, "Nothing yet. Their answers below build it."));
  }

  /* ---------------- trying the check-in as this person ---------------- */
  function Scale({ name, legend, options, value, onChange }) {
    // One row of five at every width, so the scale always reads in order from left to right.
    return h("fieldset", { className: "mt-4" },
      h("legend", { className: "text-[0.95rem] font-bold leading-snug text-ink" }, legend),
      h("div", { className: "mt-2 grid grid-cols-5 gap-1" }, options.map((label, v) =>
        h("label", { key: v, className: "relative flex cursor-pointer" },
          h("input", { type: "radio", name, checked: value === v, onChange: () => onChange(v), className: "peer sr-only" }),
          h("span", { className: "flex min-h-[2.75rem] w-full items-center justify-center rounded-lg border border-line-strong bg-surface px-0.5 py-1.5 text-center text-[0.75rem] leading-tight text-ink transition-colors hover:border-ink/60 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:shadow-[inset_0_0_0_1px_rgb(var(--accent))] sm:peer-checked:font-bold peer-focus-visible:outline peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent sm:text-sm" }, label)))));
  }

  function CheckInForm({ course, week, onSend, onCancel }) {
    const CI = FF.CHECK_IN;
    const [values, setValues] = useState({});
    const set = (k, v) => setValues({ ...values, [k]: v });
    const done = course.areas.every((a) => values[a] != null) && values.overall != null;
    const n = course.checkIns.length;
    const t = FF.THERAPISTS.find((x) => x.id === course.therapist);
    const when = n === 0 ? `before your first session with ${t.name}` : `after session ${n * CI.EVERY} with ${t.name}`;
    const send = (e) => {
      e.preventDefault();
      const areas = {};
      course.areas.forEach((a) => { areas[a] = values[a]; });
      onSend({ week, session: n * CI.EVERY, areas, overall: values.overall });
    };
    return h("form", { onSubmit: send, "aria-labelledby": "checkin-title", className: "mt-3 rounded-2xl border-2 border-accent/40 bg-paper p-3 sm:p-4" },
      h("p", { className: "text-xs font-bold uppercase tracking-wide text-muted" }, "What the person fills in"),
      h("h4", { id: "checkin-title", className: "mt-1 font-display text-lg font-semibold text-ink" }, `Check-in, ${when}`),
      h("p", { className: "mt-1 text-sm text-muted" }, "The same questions every time. There are no right answers."),
      course.areas.map((a) => h(Scale, { key: a, name: `ci-${a}`, legend: CI.area.text(a), options: CI.area.options, value: values[a], onChange: (v) => set(a, v) })),
      h(Scale, { name: "ci-overall", legend: CI.overall.text, options: CI.overall.options, value: values.overall, onChange: (v) => set("overall", v) }),
      h("div", { className: "mt-4 flex flex-wrap items-center gap-2" },
        h(Button, { type: "submit", disabled: !done }, "Send check-in"),
        h(Button, { variant: "quiet", onClick: onCancel }, "Cancel"),
        !done && h("span", { className: "text-sm text-muted" }, "Answer each question to send.")),
      h("p", { className: "mt-3 text-sm text-ink" }, "If things feel like too much: Lifeline ", h("span", { className: "font-bold" }, "13 11 14"), ", or ", h("span", { className: "font-bold" }, "000"), " in an emergency."));
  }

  function CheckIn({ answers, course, setCourse, week, trace }) {
    const [formOpen, setFormOpen] = useState(false);
    const mine = list(answers.q6);
    const options = trace.shortlist.concat(trace.results.filter((r) => !r.shortlisted && !r.excluded.length)).map((r) => r.therapist);
    const [pick, setPick] = useState("");
    const chosen = options.find((t) => t.id === pick) || options[0];
    // Check-ins go forward in time: none before the last one.
    const last = course && course.checkIns.length ? course.checkIns[course.checkIns.length - 1].week : null;
    const behind = last != null && week < last;

    let body;
    if (!course) {
      body = !mine.length
        ? h("p", { className: "mt-2 text-[0.95rem] text-muted" }, "Pick at least one area in Q6 first: the check-in asks about those.")
        : !options.length
          ? h("p", { className: "mt-2 text-[0.95rem] text-muted" }, "Nobody passes the filters, so there's no one to start with.")
          : h("div", { className: "mt-3 flex flex-wrap items-end gap-2" },
            h("label", { className: "flex min-w-0 flex-col gap-1 text-sm font-bold text-muted" }, "Pretend they started with",
              h("select", { value: chosen.id, onChange: (e) => setPick(e.target.value), className: "rounded-xl border border-line-strong bg-surface px-3 py-2 text-[0.95rem] font-normal text-ink" },
                options.map((t) => h("option", { key: t.id, value: t.id }, t.name + (trace.shortlist.some((r) => r.id === t.id) ? " (shortlisted)" : ""))))),
            h(Button, { onClick: () => { setCourse({ id: "this-person", therapist: chosen.id, areas: mine.slice(), start: week, finished: false, checkIns: [] }); setFormOpen(true); } }, "Start and check in"));
    } else {
      const t = FF.THERAPISTS.find((x) => x.id === course.therapist);
      const n = course.checkIns.length;
      body = h("div", null,
        h("p", { className: "mt-2 text-[0.95rem] text-ink" },
          `Seeing ${t.name}. `, n ? `${n} check-in${n === 1 ? "" : "s"} so far` : "No check-ins yet",
          n === 1 ? ": they count once they check in again." : n > 1 ? `: they count in ${t.name}'s profile for ${andList(course.areas.map(short))}.` : "."),
        behind && h(Notice, { tone: "ochre", className: "mt-2" }, `Their last check-in was in week ${last}, but the timeline is at week ${week}. Move it to week ${last} or later to see their check-ins and add another.`),
        !formOpen && h("div", { className: "mt-3 flex flex-wrap gap-2" },
          h(Button, { onClick: () => setFormOpen(true), disabled: behind }, n === 0 ? "Check in before the first session" : `Check in after session ${n * FF.CHECK_IN.EVERY}`),
          h(Button, { variant: "quiet", onClick: () => { setCourse(null); setFormOpen(false); } }, "Start over")),
        formOpen && h(CheckInForm, {
          course, week,
          onSend: (ci) => { setCourse({ ...course, checkIns: course.checkIns.concat(ci) }); setFormOpen(false); },
          onCancel: () => { setFormOpen(false); if (!course.checkIns.length) setCourse(null); },
        }));
    }

    return h("section", { "aria-labelledby": "try-title", className: "mt-4 rounded-2xl border border-line bg-surface p-4 sm:p-5" },
      h("h3", { id: "try-title", className: "font-display text-lg font-semibold text-ink" }, "Once they start therapy"),
      h("p", { className: "mt-1 text-sm text-muted" }, "Try the check-in as this person. It updates their own progress above, and their therapist's profile behind the scenes. Nothing is saved."),
      body);
  }

  /* ---------------- timeline of check-ins ---------------- */
  const MARKS = [[0, "Start"], [13, "3 months"], [26, "6 months"], [39, "9 months"], [52, "1 year"]];

  function Timeline({ week, setWeek, profile, ranker, useTrackRecord }) {
    const W = FF.CHECK_IN.YEAR_WEEKS;
    const [playing, setPlaying] = useState(false);
    useEffect(() => {
      if (!playing) return undefined;
      const id = setInterval(() => setWeek((w) => Math.min(W, w + 1)), 160);
      return () => clearInterval(id);
    }, [playing]);
    useEffect(() => { if (playing && week >= W) setPlaying(false); }, [week, playing]);
    const play = () => { if (week >= W) setWeek(0); setPlaying(true); };
    const months = Math.round((week / W) * 12);
    const when = week === 0 ? "the start of the year" : week >= W ? "the end of the year" : `week ${week}, about ${months} ${months === 1 ? "month" : "months"} in`;

    return h("section", { "aria-labelledby": "timeline-title", className: "rounded-2xl border border-line bg-surface p-4" },
      h("div", { className: "flex flex-wrap items-center justify-between gap-2" },
        h("div", { className: "min-w-0" },
          h("h3", { id: "timeline-title", className: "font-bold text-ink" }, "Patients' check-ins so far"),
          h("p", { className: "text-sm text-muted" }, `Therapist profiles as they stood at ${when}.`)),
        h("div", { className: "flex items-center gap-2" },
          h(DemoBadge, null, "Synthetic check-ins"),
          h(Button, { variant: "secondary", className: "!px-3 !py-2", onClick: playing ? () => setPlaying(false) : play, "aria-label": playing ? "Pause the replay" : week >= W ? "Replay the year from the start" : "Play the year from here" },
            h(playing ? IconPause : week >= W ? IconRestart : IconPlay, { className: "h-4 w-4", strokeWidth: 2.5 }),
            playing ? "Pause" : week >= W ? "Replay" : "Play"))),
      h("input", {
        type: "range", min: 0, max: W, step: 1, value: week, "aria-label": "Week of the year",
        "aria-valuetext": `Week ${week} of ${W}`, onChange: (e) => { setPlaying(false); setWeek(Number(e.target.value)); },
        className: "mt-3 w-full cursor-pointer accent-[rgb(var(--accent))]",
      }),
      h("div", { className: "relative mt-0.5 h-4 text-[0.72rem] text-muted", "aria-hidden": "true" },
        MARKS.map(([w, label], i) => h("span", {
          key: w, className: "absolute top-0 whitespace-nowrap",
          style: i === 0 ? { left: 0 } : i === MARKS.length - 1 ? { right: 0 } : { left: `${(w / W) * 100}%`, transform: "translateX(-50%)" },
        }, label))),
      h("p", { className: "mt-2 text-sm text-ink" },
        h("span", { className: "font-bold" }, REC.people(profile.counted)), " counted (a first and a later check-in)",
        profile.waiting ? ` · ${profile.waiting} waiting for a second one` : ""),
      !ranker.usesCheckIns && h("div", { className: "mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sunken px-3 py-2 text-sm text-ink" },
        h("span", null, `The shortlist uses ${ranker.name}, which doesn't read check-ins.`),
        h(Button, { variant: "quiet", onClick: useTrackRecord }, "Use Track record")));
  }

  /* ---------------- therapist profiles ---------------- */
  function Cell({ t, a, rec, on, active, onSelect, onKeyDown, cellRef }) {
    const look = lookOf(rec);
    const counted = rec.people || rec.waiting;
    return h("button", {
      type: "button", onClick: onSelect, onKeyDown, ref: cellRef, "aria-pressed": on, tabIndex: active ? 0 : -1, "aria-describedby": "grid-keys",
      "aria-label": `${t.name}, ${short(a)}: ${REC.describe(rec)}. Show details.`,
      className: `flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-lg border text-xs font-bold tabular-nums transition-colors ${look.cell} ${on ? "outline outline-[2.5px] outline-offset-1 outline-ink" : "hover:border-ink/50"}`,
    },
      look.Icon ? h(look.Icon, { className: "h-4 w-4", strokeWidth: 3 }) : h("span", { className: "h-4" }),
      h("span", { className: "leading-none" }, counted ? rec.people : ""));
  }

  function statusTag(trace, tid) {
    const r = trace.results.find((x) => x.id === tid);
    if (!r) return null;
    if (r.excluded.length) return h(Tag, null, "Filtered out");
    return r.shortlisted ? h(Tag, { tone: "accent" }, "Shortlist") : null;
  }

  function TherapistGrid({ profile, answers, trace, selected, onSelect }) {
    const mine = list(answers.q6);
    const areas = areaIds();
    const T = FF.THERAPISTS;
    // One tab stop for the whole grid: arrow keys move between cells, Enter or Space opens one.
    const [cursor, setCursor] = useState(() => (selected ? { r: T.findIndex((t) => t.id === selected.tid), c: areas.indexOf(selected.area) } : { r: 0, c: 0 }));
    const refs = useRef({});
    const moveTo = (r, c) => {
      const next = { r: Math.max(0, Math.min(T.length - 1, r)), c: Math.max(0, Math.min(areas.length - 1, c)) };
      setCursor(next);
      const el = refs.current[`${next.r}.${next.c}`];
      if (el) el.focus();
    };
    const onKeyDown = (r, c) => (e) => {
      const moves = { ArrowRight: [r, c + 1], ArrowLeft: [r, c - 1], ArrowDown: [r + 1, c], ArrowUp: [r - 1, c], Home: [r, 0], End: [r, areas.length - 1] };
      if (!moves[e.key]) return;
      e.preventDefault();
      moveTo(moves[e.key][0], moves[e.key][1]);
    };
    // The person's areas get a band down the column, so their match is easy to follow.
    const band = (a) => (mine.indexOf(a) !== -1 ? "bg-accent-soft" : "");
    // Row labels stay in view when the table scrolls sideways on a phone. Opaque, matching the panel behind.
    const pinned = "sticky left-0 z-10 bg-paper before:absolute before:inset-0 before:-z-10 before:bg-sunken/60 before:content-['']";
    return h("div", null,
      // Scrolls sideways on narrow screens; focusable so keyboard users can scroll it too.
      h("div", { tabIndex: 0, role: "region", "aria-label": "Therapist profiles table", className: "-mx-1 overflow-x-auto px-1 pb-1" },
        h("table", { className: "w-full min-w-[35rem] table-fixed border-separate border-spacing-x-[3px] border-spacing-y-0 text-sm" },
          h("caption", { className: "sr-only" }, "For each therapist: the areas they list, and what their patients report in each area.",
            h("span", { id: "grid-keys" }, " Use the arrow keys to move between cells.")),
          h("colgroup", null, h("col", { className: "w-[6.5rem]" }), areas.map((a) => h("col", { key: a }))),
          h("thead", null, h("tr", null,
            h("td", { className: pinned }),
            areas.map((a) => {
              const picked = mine.indexOf(a) !== -1;
              return h("th", { key: a, scope: "col", className: `rounded-lg px-0.5 pb-1.5 pt-1.5 align-bottom text-[0.72rem] font-bold leading-tight ${picked ? "bg-accent-soft text-accent" : "text-muted"}` },
                picked && h(IconCheck, { className: "mx-auto mb-0.5 h-3.5 w-3.5", strokeWidth: 3 }),
                short(a), picked && h("span", { className: "sr-only" }, " (one of the person's areas)"));
            }))),
          T.map((t, r) => h("tbody", { key: t.id },
            h("tr", null, h("th", { colSpan: areas.length + 1, scope: "rowgroup", className: "pt-3 text-left font-normal" },
              h("span", { className: "sticky left-0 inline-flex max-w-[calc(100vw-4rem)] flex-wrap items-center gap-x-2 gap-y-1" },
                h("span", { className: "font-bold text-ink" }, t.name),
                h("span", { className: "text-xs text-muted" }, `${t.registration} · ${training(t)}`),
                statusTag(trace, t.id)))),
            h("tr", null,
              h("th", { scope: "row", className: `${pinned} pr-1 text-left text-xs font-normal text-muted` }, "Says"),
              areas.map((a) => h("td", { key: a, className: `h-7 rounded-t-lg pt-0.5 text-center ${band(a)}` },
                t.focus_areas.indexOf(a) !== -1
                  ? h("span", { className: "inline-flex items-center justify-center", title: "Lists this area" },
                    h("span", { "aria-hidden": "true", className: "block h-2.5 w-2.5 rounded-full bg-ink/70" }), h("span", { className: "sr-only" }, "Lists it"))
                  : h("span", { className: "sr-only" }, "Doesn't list it")))),
            h("tr", null,
              h("th", { scope: "row", className: `${pinned} pr-1 text-left text-xs font-normal leading-tight text-muted` }, "Patients report"),
              areas.map((a, c) => h("td", { key: a, className: `rounded-b-lg px-1 pb-1 ${band(a)}` },
                h(Cell, {
                  t, a, rec: profile.record(t.id, a), on: !!selected && selected.tid === t.id && selected.area === a,
                  active: cursor.r === r && cursor.c === c, onKeyDown: onKeyDown(r, c), cellRef: (el) => { refs.current[`${r}.${c}`] = el; },
                  onSelect: () => { setCursor({ r, c }); onSelect({ tid: t.id, area: a }); },
                })))))))),
      h(GridLegend));
  }

  function GridLegend() {
    const item = (look, label) => h("li", { className: "flex items-center gap-1.5" },
      h("span", { "aria-hidden": "true", className: `inline-flex h-5 w-6 items-center justify-center rounded-md border ${look.cell}` }, look.Icon && h(look.Icon, { className: "h-3 w-3", strokeWidth: 3 })),
      label);
    return h("ul", { className: "mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted", "aria-label": "What the table shows" },
      h("li", { className: "flex items-center gap-1.5" }, h("span", { "aria-hidden": "true", className: "inline-block h-2.5 w-2.5 rounded-full bg-ink/70" }), "Lists this area"),
      item(LOOK.helped, "Helped"), item(LOOK.same, "No clear change"), item(LOOK.worse, "Got worse"), item(LOOK.not_enough, "Not enough evidence yet"),
      h("li", null, "Number: people counted"));
  }

  /* ---------------- one therapist, one area ---------------- */
  // Each counted person is a dot over their change (positive = better). The band underneath shows the rule:
  // where the average person lands decides the label.
  function DotPlot({ rec, mark }) {
    const lo = -4, hi = 4, W = 360, padX = 18, col = (W - 2 * padX) / (hi - lo + 1), r = 4.6, gap = 10.5;
    const x = (v) => padX + (v - lo + 0.5) * col;
    const stacks = {};
    rec.changes.forEach((d) => { stacks[d] = (stacks[d] || 0) + 1; });
    const tallest = Math.max(5, ...Object.values(stacks));
    const base = 10 + tallest * gap;   // the line the dots stand on
    const bandY = base + 18;           // the rule, under the tick labels
    const H = bandY + 38;
    const tone = (d) => (d >= 1 ? "var(--accent)" : d <= -1 ? "var(--ochre)" : "var(--muted)");
    const dots = [];
    Object.keys(stacks).forEach((k) => { for (let i = 0; i < stacks[k]; i++) dots.push(h("circle", { key: `${k}-${i}`, cx: x(Number(k)), cy: base - r - i * gap, r, fill: `rgb(${tone(Number(k))})` })); });
    // The person trying the check-in is counted last, so they're the top dot of their stack.
    if (mark != null && stacks[mark]) {
      const cy = base - r - (stacks[mark] - 1) * gap;
      dots.push(h("circle", { key: "you", cx: x(mark), cy, r: r + 3, fill: "none", stroke: "rgb(var(--ink))", strokeWidth: 2 }));
      dots.push(h("text", { key: "you-label", x: x(mark) + r + 7, y: cy + 3.5, fontSize: 10, fontWeight: 700, fill: "rgb(var(--ink))" }, "this person"));
    }
    const zone = (from, to, fill, opacity) => h("rect", { x: x(from), y: bandY, width: x(to) - x(from), height: 9, fill, opacity });
    const avg = rec.average;
    const summary = rec.people
      ? `Each person's change: ${rec.better} better, ${rec.same} about the same, ${rec.worse} worse. The average person lands at ${avg > 0 ? "+" : ""}${Math.round(avg * 10) / 10}.`
      : "Nobody counted yet.";
    return h("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": summary, className: "mt-3 w-full max-w-[26rem]" },
      h("line", { x1: padX, x2: W - padX, y1: base, y2: base, stroke: "rgb(var(--line-strong))" }),
      dots,
      zone(lo - 0.5, -WORSE, "rgb(var(--ochre))", 0.35),
      zone(-WORSE, HELPED, "rgb(var(--line))", 1),
      zone(HELPED, hi + 0.5, "rgb(var(--accent))", 0.35),
      [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((v) => h("text", { key: v, x: x(v), y: base + 12, fontSize: 9.5, fill: "rgb(var(--muted))", textAnchor: "middle" }, v > 0 ? `+${v}` : String(v))),
      h("text", { x: x(lo - 0.5), y: bandY + 21, fontSize: 10, fill: "rgb(var(--ochre))", fontWeight: 700 }, "Got worse"),
      h("text", { x: x(hi + 0.5), y: bandY + 21, fontSize: 10, fill: "rgb(var(--accent))", fontWeight: 700, textAnchor: "end" }, "Helped"),
      avg != null && h("g", null,
        h("path", { d: `M ${x(avg)} ${bandY + 10} l -5 8 h 10 z`, fill: "rgb(var(--ink))" }),
        h("text", { x: x(avg), y: bandY + 32, fontSize: 10, fill: "rgb(var(--ink))", fontWeight: 700, textAnchor: "middle" }, `average ${avg > 0 ? "+" : ""}${Math.round(avg * 10) / 10}`)));
  }

  function CellDetail({ sel, profile, onClose, course, week }) {
    const t = FF.THERAPISTS.find((x) => x.id === sel.tid);
    const a = sel.area;
    const rec = profile.record(t.id, a);
    const lists = t.focus_areas.indexOf(a) !== -1;
    const evidence = FF.criteria.evidence({ q6: [a] }, t);
    const look = LOOK[rec.label];
    return h("section", { "aria-labelledby": "cell-title", "aria-live": "polite", className: "mt-4 rounded-2xl border border-line bg-surface p-4" },
      h("div", { className: "flex items-start justify-between gap-3" },
        h("div", null,
          h("h4", { id: "cell-title", className: "font-display text-lg font-semibold text-ink" }, `${t.name} · ${short(a)}`),
          h("p", { className: "text-sm text-muted" }, FF.optionLabel("q6", a))),
        h(Button, { variant: "quiet", onClick: onClose, "aria-label": "Close details" }, "Close")),
      h("div", { className: "mt-3 grid gap-3 sm:grid-cols-2" },
        h("div", { className: "rounded-xl bg-sunken p-3" },
          h("p", { className: "text-xs font-bold uppercase tracking-wide text-muted" }, "What they say"),
          h("p", { className: "mt-1 text-[0.95rem] text-ink" }, lists ? `Lists ${lowerFirst(short(a))} as an area they work on.` : `Doesn't list ${lowerFirst(short(a))}.`),
          evidence && h("p", { className: "mt-1 text-[0.95rem] text-ink" }, evidence)),
        h("div", { className: `rounded-xl border p-3 ${look.cell}` },
          h("p", { className: "text-xs font-bold uppercase tracking-wide" }, "What patients report"),
          h("p", { className: "mt-1 flex items-center gap-1.5 font-bold" }, look.Icon && h(look.Icon, { className: "h-4 w-4", strokeWidth: 3 }), REC.LABELS[rec.label]),
          h("p", { className: "mt-1 text-[0.95rem] text-ink" },
            rec.people
              ? `${REC.people(rec.people)} with a first and a later check-in: ${rec.better} better, ${rec.same} about the same, ${rec.worse} worse. ${averageText(rec.average)}.`
              : "Nobody with a first and a later check-in yet.",
            rec.waiting ? ` ${rec.waiting} more waiting for a second check-in.` : ""))),
      h(DotPlot, { rec, mark: yourChange(course, week, t.id, a) }),
      h("p", { className: "mt-1 text-sm text-muted" },
        rec.label === "not_enough"
          ? `A label needs ${MIN_PEOPLE} people${rec.people ? `: ${MIN_PEOPLE - rec.people} more to go` : ""}.`
          : `Where the average person lands decides it: ${steps(HELPED)} better or more is "helped", ${halfOr(WORSE)} worse or more is "got worse".`));
  }

  /* ---------------- how a therapist profile is built ---------------- */
  function HowBuilt() {
    const CI = FF.CHECK_IN;
    return h("section", { "aria-labelledby": "how-built-title", className: "mt-8" },
      h("h3", { id: "how-built-title", className: "font-display text-xl font-semibold text-ink" }, "How a therapist profile is built"),
      h("ol", { className: "mt-2 list-decimal space-y-1.5 pl-5 text-[0.95rem] leading-relaxed text-ink" },
        h("li", null, `People check in ${lowerFirst(CI.when)}`),
        h("li", null, "Every check-in asks the same short questions, so change is measured, never asked. Nobody rates their therapist."),
        h("li", null, "Each person's change is their first check-in compared with their latest, so people who stop early still count."),
        h("li", null, `Once ${MIN_PEOPLE} people with an area have both, the average person decides the label: ${steps(HELPED)} better or more is "helped", ${halfOr(WORSE)} worse or more is "got worse", anything between is "no clear change". A fixed line, not a comparison between therapists.`),
        h("li", null, "Nobody sees the labels, not the person and not the therapist. They only shape the shortlist.")),
      h("details", { className: "mt-3 rounded-xl border border-line bg-surface p-3" },
        h("summary", { className: "cursor-pointer font-bold text-accent" }, "What a check-in asks"),
        h("div", { className: "mt-2 space-y-2 text-[0.95rem] text-ink" },
          h("p", null, "For each area the person picked (up to three), for example:"),
          h("p", { className: "rounded-lg bg-sunken px-3 py-2" }, h("span", { className: "font-bold" }, CI.area.text("anxiety")), h("br"), CI.area.options.join(" · ")),
          h("p", null, "And once:"),
          h("p", { className: "rounded-lg bg-sunken px-3 py-2" }, h("span", { className: "font-bold" }, CI.overall.text), h("br"), CI.overall.options.join(" · ")),
          h("p", { className: "text-sm text-muted" }, "Our own wording, inspired by brief outcome measures (ORS, MyLifeTracker). Not a validated tool."))));
  }

  // ?cell=ben.anxiety opens that cell's details, so a link can point straight at one.
  function cellFromUrl() {
    const [tid, area] = (new URLSearchParams(window.location.search).get("cell") || "").split(".");
    return FF.THERAPISTS.some((t) => t.id === tid) && areaIds().indexOf(area) !== -1 ? { tid, area } : null;
  }

  // The change of the person trying the check-in, if they count in this cell.
  function yourChange(course, week, tid, a) {
    if (!course || course.therapist !== tid || course.areas.indexOf(a) === -1) return null;
    const ch = REC.change(course, week);
    return ch && ch.measured ? ch.areas[a] : null;
  }

  function ProfilesView({ profile, answers, trace, ranker, course, week }) {
    const [selected, setSelected] = useState(cellFromUrl);
    return h("div", null,
      h("p", { className: "text-[0.95rem] leading-relaxed text-ink" },
        "Each therapist's profile has two sides: the areas they ", h("span", { className: "font-bold" }, "say"), " they work on, and what their ",
        h("span", { className: "font-bold" }, "patients report"), " in their check-ins. Select a cell to see every person behind it."),
      list(answers.q6).length > 0 && h("p", { className: "mt-1.5 text-sm text-muted" }, "Highlighted columns are the person's areas: what matters for their match."),
      h("div", { className: "mt-3" }, h(TherapistGrid, { profile, answers, trace, selected, onSelect: setSelected })),
      selected
        ? h(CellDetail, { sel: selected, profile, course, week, onClose: () => setSelected(null) })
        : h(Notice, { className: "mt-4" }, `Ben lists all nine areas, but look at what his patients with anxiety report. Status tags use ${ranker.name}.`),
      h(HowBuilt));
  }

  FF.profiles = { profileRows, PersonProfile, CheckIn, Timeline, ProfilesView };
})();
