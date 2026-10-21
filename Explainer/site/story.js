"use strict";
/*
  The walkthrough (story.html): one fictional person, Alex (test patient A), from their first answers to their
  shortlist, told in beats on an animated stage. site/player.js runs the clock and the controls.

  Everything the story says about therapists comes from matching/: the shortlist from FF.rankers.run() (Track
  record, with the synthetic year of check-ins), therapist profiles from FF.records.build(), week by week for the
  replay. Captions that state a fact are built from those results, and a beat whose fact doesn't hold in the data
  (no mismatch to show, the same shortlist with or without check-ins) is left out, so the story stays true when
  the data changes. Like the rest of site/, it never scores or labels anything itself.

  Stage: each beat is a frame of actors ({ kind, x, y, w, h, o, ... }) for the moment its movement ends. The player
  tweens from the previous beat's frame to this one (FF.player.mix), so the same therapist card moves from chapter
  to chapter. Layouts are computed from the stage's size: a real phone layout, not a shrunk desktop one.
*/
window.FF = window.FF || {};

(function () {
  const { h, IconCheck, IconCross, IconMinus, IconUp, IconDown, IconArrow, IconInfo, RECORD_LOOK, recordLook, Button, DemoBadge, Header, Footer } = FF.ui;
  const { Player, mix, seg, clamp01, duration } = FF.player;
  const REC = FF.records;
  const R = FF.rankers;
  const CI = FF.CHECK_IN;
  const { MIN_PEOPLE } = REC.RULES;

  /* ---------------- words ---------------- */
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const short = (a) => FF.optionShort("q6", a);
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const upper = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const andList = (xs, word = "and") => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${word} ${xs[xs.length - 1]}`);
  const firstName = (t) => t.name.replace(/^Dr /, "").split(" ")[0];
  const names = (rs) => andList(rs.map((r) => firstName(r.therapist || r)));
  const NUMBER = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const num = (n) => NUMBER[n] || String(n);
  const steps = (n) => `${num(n)} ${n === 1 ? "step" : "steps"}`;

  /* ---------------- the facts the story tells, all from data/ and matching/ ---------------- */
  const PERSON = { name: "Alex", about: "an international student who's never seen a therapist", patient: "A" };
  const answers = FF.TEST_PATIENTS.find((p) => p.id === PERSON.patient).answers;
  const mine = list(answers.q6);
  const mineText = (word) => andList(mine.map((a) => lower(short(a))), word);
  const T = FF.THERAPISTS;
  const YEAR = CI.YEAR_WEEKS;
  const context = { checkIns: FF.CHECK_INS, week: YEAR };
  const trace = R.run("track-record", answers, T, context);
  const before = R.run("research", answers, T, context);
  const profile = REC.build(FF.CHECK_INS, { week: YEAR });
  const weeks = [];
  const atWeek = (w) => weeks[w] || (weeks[w] = REC.build(FF.CHECK_INS, { week: w }));
  const helpedIn = (tid) => mine.filter((a) => profile.record(tid, a).label === "helped");
  const worseElsewhere = (tid) => REC.areaIds().filter((a) => mine.indexOf(a) === -1 && profile.record(tid, a).label === "worse");

  // Where what therapists say and what their patients report disagree, in Alex's areas.
  const cells = [];
  T.forEach((t) => mine.forEach((a) => cells.push({ t, a, rec: profile.record(t.id, a), lists: t.focus_areas.indexOf(a) !== -1 })));
  const saysButWorse = cells.find((c) => c.lists && c.rec.label === "worse") || null;
  const quietButHelped = cells.find((c) => !c.lists && c.rec.label === "helped") || null;
  const focus = quietButHelped || cells.find((c) => c.rec.label === "helped") || cells[0];

  // One real (synthetic) course to follow in chapter 3: someone who saw that therapist about that area and finished.
  const areaChange = (c, a) => c.checkIns[0].areas[a] - c.checkIns[c.checkIns.length - 1].areas[a];
  const example = FF.CHECK_INS
    .filter((c) => c.therapist === focus.t.id && c.areas.indexOf(focus.a) !== -1 && c.finished && c.checkIns.length >= 4)
    .sort((x, y) => x.areas.length - y.areas.length || Math.abs(areaChange(x, focus.a) - 2) - Math.abs(areaChange(y, focus.a) - 2) || x.id.localeCompare(y.id))[0]
    || FF.CHECK_INS.find((c) => c.checkIns.length >= 3);
  const exampleArea = example.areas.indexOf(focus.a) !== -1 ? focus.a : example.areas[0];
  const stopped = FF.CHECK_INS.find((c) => c.therapist === example.therapist && c.areas.indexOf(exampleArea) !== -1 && !c.finished && c.checkIns.length > 1) || null;
  const exampleT = T.find((t) => t.id === example.therapist);

  // Matching.
  const outs = trace.results.filter((r) => r.excluded.length);
  const ins = trace.results.filter((r) => !r.excluded.length);
  const groups = [];
  ins.forEach((r) => {
    if (!r.group) return;
    let g = groups.find((x) => x.order === r.group.order);
    if (!g) groups.push((g = { order: r.group.order, label: r.group.label, members: [] }));
    g.members.push(r);
  });
  groups.forEach((g) => {
    g.look = g.members.every((r) => helpedIn(r.id).length) ? "helped" : g.members.every((r) => worseElsewhere(r.id).length) ? "worse" : null;
  });
  const shortlist = trace.shortlist;
  const added = shortlist.filter((r) => !before.shortlist.some((x) => x.id === r.id));
  const dropped = before.shortlist.filter((r) => !shortlist.some((x) => x.id === r.id));

  /* ---------------- what Alex would see on a shortlisted therapist (wording only) ---------------- */
  const what = (p) => lower(p.label.replace(/^Experience: /, ""));
  function fitLine(p) {
    if (p.kind === "qualities") return p.said;
    if (p.kind === "communication") return "Communicates the way you prefer";
    if (p.kind === "experience") return `${p.has}: ${what(p)}`;
    return `${p.label}: ${lower(p.has)}`;
  }
  function missLine(p) {
    if (p.kind === "qualities") return p.fit ? `Has ${p.note.replace(" picked", "")} qualities you picked` : "Different qualities from the ones you picked";
    if (p.kind === "communication") return p.fit ? "Partly works the way you prefer" : `Works differently: ${lower(p.has)}`;
    if (p.kind === "experience") return p.fit ? `Some experience: ${what(p)}` : `No listed experience: ${what(p)}`;
    return `${p.label}: ${lower(p.has)}`;
  }
  const MISS_FIRST = ["communication", "experience", "practical", "qualities"];
  function reasons(r) {
    const parts = r.parts.filter((p) => p.kind !== "areas");
    const fits = parts.filter((p) => p.fit === 1).sort((a, b) => b.weight - a.weight).map(fitLine);
    const miss = parts.filter((p) => p.fit < 1)
      .sort((a, b) => a.fit - b.fit || b.weight - a.weight || MISS_FIRST.indexOf(a.kind) - MISS_FIRST.indexOf(b.kind))[0];
    return { fits, miss: miss ? missLine(miss) : null };
  }

  /* ---------------- actors ---------------- */
  const place = (a, z) => ({
    position: "absolute", left: 0, top: 0, width: a.w, height: a.h, zIndex: z || 0, opacity: a.o,
    transform: `translate(${a.x}px, ${a.y}px)${a.s != null && a.s !== 1 ? ` scale(${a.s})` : ""}`, transformOrigin: "top left",
  });

  const Avatar = ({ t, size = 30 }) => h("span", {
    className: "inline-flex shrink-0 items-center justify-center rounded-full border border-line-strong bg-sunken font-bold text-ink",
    style: { width: size, height: size, fontSize: size * 0.36 },
  }, t.initials);

  // Anyone who isn't Alex: a plain silhouette.
  const PersonGlyph = ({ size = 40 }) => h("span", {
    className: "inline-flex shrink-0 items-center justify-center rounded-full bg-sunken text-muted", style: { width: size, height: size },
  }, h("svg", { viewBox: "0 0 24 24", fill: "currentColor", style: { width: size * 0.58, height: size * 0.58 } },
    h("circle", { cx: 12, cy: 8, r: 4.2 }), h("path", { d: "M3.8 21c.6-4.4 4-7 8.2-7s7.6 2.6 8.2 7z" })));

  // Alex: a drawn portrait, so it's plainly nobody real. Colours are the --alex-* tokens in story.html.
  const fill = (name) => `rgb(var(--alex-${name}))`;
  const AlexPortrait = ({ size = 40 }) => h("span", { className: "inline-block shrink-0 overflow-hidden rounded-full bg-accent-soft", style: { width: size, height: size } },
    h("svg", { viewBox: "0 0 100 100", width: size, height: size, className: "block" },
      h("path", { d: "M12 104 C13 82 30 72 50 72 C70 72 87 82 88 104 Z", fill: fill("top") }),
      h("path", { d: "M38 73 Q50 86 62 73 Q50 80 38 73 Z", fill: fill("top-shade") }),
      h("path", { d: "M29 80 L35 104 M71 80 L65 104", stroke: fill("strap"), strokeWidth: 6, strokeLinecap: "round" }),
      h("rect", { x: 43, y: 56, width: 14, height: 18, rx: 5, fill: fill("skin-shade") }),
      h("circle", { cx: 33.5, cy: 46, r: 4.2, fill: fill("skin") }),
      h("circle", { cx: 66.5, cy: 46, r: 4.2, fill: fill("skin") }),
      h("ellipse", { cx: 50, cy: 44, rx: 16.5, ry: 18.5, fill: fill("skin") }),
      h("path", { d: "M31.5 48 C27.5 27 38.5 18 51 18 C64 18 73 27 68.5 48 C67.5 41 66 37 63.5 34.5 C60 37.5 52 39.5 43.5 37.5 C40.5 36.8 38 35.8 36.5 35 C34 38.5 32.5 43 31.5 48 Z", fill: fill("hair") }),
      h("path", { d: "M36.5 35 C41 26.5 52 24 63.5 34.5 C57 31.5 48 31 41 34.5 Z", fill: fill("hair-light") }),
      h("circle", { cx: 43.5, cy: 46.5, r: 1.9, fill: fill("hair") }),
      h("circle", { cx: 56.5, cy: 46.5, r: 1.9, fill: fill("hair") }),
      h("path", { d: "M45.5 53.5 Q50 56.5 54.5 53.5", fill: "none", stroke: fill("hair"), strokeWidth: 1.7, strokeLinecap: "round" })));

  function AlexActor({ a }) {
    return h("div", { style: place(a, 6), className: "flex flex-col items-center text-center" },
      h(AlexPortrait, { size: 88 }),
      h("p", { className: "mt-2 font-display text-2xl font-semibold leading-none text-ink" }, PERSON.name),
      h("span", { className: "mt-2" }, h(DemoBadge, null, "Fictional")));
  }

  function SafetyActor({ a }) {
    return h("div", { style: place(a, 4), className: "rounded-2xl border-2 border-accent/50 bg-surface p-4 shadow-sm" },
      h("p", { className: "text-xs font-bold uppercase tracking-[0.08em] text-muted" }, "Before any questions"),
      h("p", { className: "mt-1 font-display text-lg font-semibold leading-snug text-ink" }, "Need help right now?"),
      h("p", { className: "mt-1 text-[0.95rem] leading-snug text-ink" }, "Call Lifeline on ", h("span", { className: "font-bold" }, "13 11 14"), ", or ", h("span", { className: "font-bold" }, "000"), " in an emergency."),
      h("p", { className: "mt-2 text-sm text-muted" }, "This comes first, and matching never overrides it."));
  }

  function AnswerActor({ a }) {
    return h("div", { style: place(a, 5), className: "rounded-xl border border-line-strong bg-surface px-3 py-2 shadow-sm" },
      h("p", { className: "text-xs text-muted" }, a.term),
      h("p", { className: "text-sm font-bold leading-snug text-ink" }, a.value));
  }

  function ProfileActor({ a, G }) {
    return h("div", { style: place(a, 4), className: "overflow-hidden rounded-2xl border border-accent/40 bg-surface p-4 shadow-sm" },
      h("div", { className: "flex items-center gap-2.5" },
        h(AlexPortrait, { size: 32 }),
        h("p", { className: "font-display text-lg font-semibold text-ink" }, `${PERSON.name}'s profile`),
        G.wide && h("span", { className: "ml-auto text-xs font-bold uppercase tracking-[0.08em] text-muted" }, "What Alex sees")),
      h("dl", { className: `mt-3 grid gap-x-4 ${G.wide ? "grid-cols-[11.5rem_1fr] gap-y-2" : "gap-y-1.5"}` },
        a.rows.map(([term, value], k) => {
          const o = clamp01(a.reveal - k);
          return [
            h("dt", { key: `${term}t`, className: "text-sm font-bold text-muted", style: { opacity: o } }, term),
            h("dd", { key: `${term}d`, className: `m-0 leading-snug text-ink ${G.wide ? "text-[0.95rem]" : "mb-1 text-[0.9rem]"}`, style: { opacity: o } }, value),
          ];
        })));
  }

  function PillActor({ a }) {
    return h("div", { style: place(a, 8), className: "flex items-center gap-2 rounded-full border border-accent/40 bg-surface py-1 pl-1 pr-3 shadow-sm" },
      h(AlexPortrait, { size: 26 }),
      h("span", { className: "whitespace-nowrap text-sm text-ink" }, h("span", { className: "font-bold" }, PERSON.name), ` · ${mine.map(short).join(" · ")}`));
  }

  // A therapist: one box that is a card (chapters 2, 4 and 5), a row (6) or a shortlist card (7). The header
  // stays put; the layers inside fade in and out as the box changes shape.
  function TherapistActor({ a, G }) {
    const t = a.t;
    const shadow = [`0 0 0 3px rgb(var(--ink) / ${a.ring})`, `inset 0 0 0 1.5px rgb(var(--accent) / ${a.hl})`].join(", ");
    return h("div", { style: { ...place(a, a.ring > 0.01 ? 7 : 3), opacity: a.o * (1 - 0.75 * a.dim) } },
      a.numO > 0.01 && h("span", { className: "absolute -left-7 top-0 flex w-6 items-center justify-center font-display text-base font-semibold text-ink", style: { height: Math.min(a.h, 44), opacity: a.numO } }, a.position),
      h("div", { className: "absolute inset-0 overflow-hidden rounded-xl border border-line bg-surface", style: { boxShadow: shadow } },
        h("span", { className: "absolute inset-0 bg-accent-soft", style: { opacity: a.hl * 0.7 } }),
        h("div", { className: "absolute left-0 top-0 flex items-center gap-2 px-2.5", style: { height: Math.min(Math.max(a.h, 28), G.wide ? 44 : 36) } },
          h(Avatar, { t, size: G.wide ? 30 : 26 }),
          h("span", { className: "min-w-0 leading-tight" },
            h("span", { className: "block whitespace-nowrap text-sm font-bold text-ink" }, G.wide ? t.name : firstName(t)),
            a.regO > 0.01 && h("span", { className: "block whitespace-nowrap text-[0.7rem] text-muted", style: { opacity: a.regO } }, t.registration))),
        a.chipsO > 0.01 && h(Chips, { a, G }),
        a.slotsO > 0.01 && h(Slots, { a, G }),
        a.rowO > 0.01 && h(RowLayer, { a, G }),
        a.asideO > 0.01 && h("p", { className: `absolute inset-x-2.5 leading-snug text-ink ${G.wide ? "top-[39px] text-xs" : "top-[33px] text-[0.68rem]"}`, style: { opacity: a.asideO } },
          h(IconCross, { className: "-mt-0.5 mr-1 inline h-3.5 w-3.5 text-ochre", strokeWidth: 3 }), a.r.excluded.map((e) => e.reason).join(" ")),
        a.cardO > 0.01 && h(CardLayer, { a, G })));
  }

  function Chips({ a, G }) {
    const areas = REC.areaIds().filter((x) => a.t.focus_areas.indexOf(x) !== -1);
    const chip = G.wide ? "px-1.5 py-px text-[0.7rem]" : "px-1 text-[0.64rem]";
    return h("div", { className: `absolute inset-x-2 bottom-1.5 overflow-hidden ${G.wide ? "top-[46px]" : "top-[36px]"}`, style: { opacity: a.chipsO } },
      G.wide && h("p", { className: "text-[0.7rem] font-bold text-muted" }, "Says they work on"),
      h("div", { className: `flex flex-wrap items-center ${G.wide ? "mt-1 gap-[3px]" : "gap-0.5"}`, style: { opacity: 1 - 0.55 * a.chipsDim } },
        !G.wide && h("span", { className: "mr-0.5 text-[0.64rem] font-bold text-muted" }, "Says:"),
        areas.map((x) => h("span", { key: x, className: `rounded border border-line-strong bg-sunken font-bold leading-tight text-ink ${chip}` }, short(x)))));
  }

  const SHORT_LABEL = { helped: "Helped", same: "No change", worse: "Worse" };
  // Patients' check-ins in Alex's areas, as they stood at week a.week: one dot per person counted, by direction.
  function Slots({ a, G }) {
    const prof = atWeek(Math.max(0, Math.min(YEAR, Math.floor(a.week))));
    const dot = G.wide ? 6 : 5;
    return h("div", { className: `absolute inset-x-2 grid grid-cols-2 ${G.wide ? "bottom-2 gap-1.5" : "bottom-1.5 gap-1"}`, style: { top: G.wide ? 46 : 34, opacity: a.slotsO } },
      mine.map((area) => {
        const rec = prof.record(a.t.id, area);
        const look = rec.people ? recordLook(rec) : RECORD_LOOK.nobody;
        const lists = a.t.focus_areas.indexOf(area) !== -1;
        const spot = a.spot === area ? a.spotO : 0;
        const settled = rec.label !== "not_enough";
        const faded = settled ? 1 : 1 - 0.55 * a.slotFocus;
        const counts = [["better", IconUp, "text-accent", "bg-accent"], ["same", IconMinus, "text-muted", "bg-muted"], ["worse", IconDown, "text-ochre", "bg-ochre"]];
        return h("div", { key: area, className: "flex min-w-0 flex-col rounded-lg bg-sunken/70 px-1.5 py-1", style: { opacity: faded, boxShadow: `0 0 0 2px rgb(var(--ink) / ${spot})` } },
          h("p", { className: "flex items-center gap-1 text-[0.7rem] font-bold leading-tight text-ink" },
            lists && h("span", { className: "inline-block h-2 w-2 shrink-0 rounded-full bg-ink/70" }), short(area)),
          h("div", { className: "mt-0.5 flex min-h-0 flex-1 flex-col justify-center gap-px" }, counts.map(([k, Icon, tone, fill]) =>
            h("div", { key: k, className: "flex min-w-0 items-center gap-0.5" },
              h(Icon, { className: `h-2.5 w-2.5 shrink-0 ${tone}`, strokeWidth: 3 }),
              h("span", { className: "flex min-w-0 flex-wrap gap-px overflow-hidden", style: { height: dot } },
                Array.from({ length: rec[k] }, (_, n) => h("span", { key: n, className: `shrink-0 rounded-full ${fill}`, style: { width: dot, height: dot } })))))),
          h("p", { className: `mt-0.5 flex items-center justify-center gap-1 whitespace-nowrap rounded-md border px-1 py-0.5 text-center text-[0.68rem] font-bold leading-tight ${look.cell}` },
            look.Icon && h(look.Icon, { className: "h-3 w-3 shrink-0", strokeWidth: 3 }),
            settled ? (G.wide ? REC.LABELS[rec.label] : SHORT_LABEL[rec.label]) : rec.people ? `${rec.people} of ${MIN_PEOPLE}${G.wide ? " needed" : ""}` : G.wide ? "No one yet" : "None yet"));
      }));
  }

  function RowLayer({ a, G }) {
    const left = G.wide ? 216 : 118;
    const tagW = G.wide ? 196 : 92;
    return h("div", { className: "absolute inset-y-0 right-0 flex items-center gap-2 pr-3", style: { left, opacity: a.rowO } },
      h("span", { className: "relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line", style: { opacity: a.barO } },
        h("span", { className: "absolute inset-y-0 left-0 rounded-full bg-accent", style: { width: `${a.bar * 100}%` } })),
      a.tag && h("span", { className: "shrink-0 overflow-hidden whitespace-nowrap rounded-full border border-ochre/50 bg-ochre-soft px-2 py-0.5 text-[0.7rem] font-bold text-ochre", style: { opacity: a.tagO, maxWidth: tagW * a.tagO, paddingLeft: 8 * a.tagO, paddingRight: 8 * a.tagO } }, a.tag));
  }

  function CardLayer({ a, G }) {
    const { fits, miss } = reasons(a.r);
    const shown = fits.slice(0, G.wide ? 3 : 2);
    return h("div", { className: "absolute inset-x-3 bottom-2 overflow-hidden", style: { top: G.wide ? 52 : 40, opacity: a.cardO } },
      G.wide && h("p", { className: "text-[0.7rem] font-bold uppercase tracking-[0.08em] text-muted" }, "Why they might fit"),
      h("ul", { className: `${G.wide ? "mt-1.5 space-y-1.5" : "space-y-0.5"}` }, shown.map((x) =>
        h("li", { key: x, className: "flex gap-1.5 text-sm leading-snug text-ink" }, h(IconCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-accent", strokeWidth: 3 }), x))),
      miss && G.wide && h("p", { className: "mt-3 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-muted" }, "Worth knowing"),
      miss && h("p", { className: `flex gap-1.5 text-sm leading-snug text-muted ${G.wide ? "mt-1" : "mt-0.5"}` }, h(IconMinus, { className: "mt-0.5 h-4 w-4 shrink-0", strokeWidth: 3 }), miss));
  }

  // The check-in form, filled in as one person did at check-in number round(a.sel).
  function CheckinActor({ a, G }) {
    const c = a.course;
    const k = Math.max(0, Math.min(c.checkIns.length - 1, Math.round(a.sel)));
    const ci = c.checkIns[k];
    const when = ci.session === 0 ? "before the first session" : `after session ${ci.session}`;
    const others = c.areas.filter((x) => x !== a.area);
    const Scale = ({ legend, options, value }) => h("div", { className: "mt-2.5" },
      h("p", { className: "text-[0.82rem] font-bold leading-snug text-ink" }, legend),
      h("div", { className: "mt-1.5 grid grid-cols-5 gap-1" }, options.map((label, v) =>
        h("span", { key: v, className: `flex min-h-[2.1rem] items-center justify-center rounded-md border px-0.5 text-center ${a.w < 330 ? "text-[0.62rem]" : "text-[0.68rem]"} leading-tight ${v === value ? "border-accent bg-accent-soft font-bold text-ink shadow-[inset_0_0_0_1px_rgb(var(--accent))]" : "border-line-strong bg-surface text-muted"}` }, label))));
    return h("div", { style: place(a, 4), className: "overflow-hidden rounded-2xl border-2 border-accent/40 bg-surface px-3.5 py-3 shadow-sm" },
      h("p", { className: "flex items-baseline justify-between gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted" },
        h("span", null, `Check-in ${k + 1}`), h("span", { className: "normal-case tracking-normal" }, when)),
      h(Scale, { legend: CI.area.text(a.area), options: CI.area.options, value: ci.areas[a.area] }),
      h("div", { style: { opacity: a.moreO } },
        others.map((x) => h(Scale, { key: x, legend: CI.area.text(x), options: CI.area.options, value: ci.areas[x] })),
        h(Scale, { legend: CI.overall.text, options: CI.overall.options, value: ci.overall })));
  }

  // One person's answers for one area, check-in by check-in. Up is better: "Not at all" is at the top.
  function ChartActor({ a, G }) {
    const c = a.course;
    const W = a.w;
    const H = a.h;
    const m = { l: G.wide ? 84 : 66, r: 32, t: 30, b: 34 };
    const last = Math.max(c.checkIns[c.checkIns.length - 1].session, a.ghost ? a.ghost.checkIns[a.ghost.checkIns.length - 1].session : 0);
    const x = (s) => m.l + (s / last) * (W - m.l - m.r);
    const y = (v) => m.t + (v / 4) * (H - m.t - m.b);
    const pts = c.checkIns.map((ci) => [x(ci.session), y(ci.areas[a.area])]);
    const lengths = pts.map((pt, i) => (i ? Math.hypot(pt[0] - pts[i - 1][0], pt[1] - pts[i - 1][1]) : 0));
    const total = lengths.reduce((s, d) => s + d, 0);
    let run = 0;
    const reach = lengths.map((d) => (run += d) / total);
    const path = pts.map((pt, i) => `${i ? "L" : "M"} ${pt[0]} ${pt[1]}`).join(" ");
    const first = c.checkIns[0].areas[a.area];
    const latest = c.checkIns[c.checkIns.length - 1].areas[a.area];
    const note = a.noteO * seg(a.draw, 0.9, 1);
    const g = a.ghost;
    const gpts = g ? g.checkIns.map((ci) => [x(ci.session), y(ci.areas[a.area])]) : [];
    const labels = G.wide ? CI.area.options : CI.area.options.map((o, v) => (v === 0 || v === 4 ? o : ""));
    return h("div", { style: place(a, 4), className: "rounded-2xl border border-line bg-surface shadow-sm" },
      h("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, className: "block" },
        h("text", { x: 14, y: 20, fontSize: 12, fontWeight: 700, fill: "rgb(var(--muted))" }, `How much ${lower(short(a.area))} gets in the way`),
        h("text", { x: W - 14, y: 20, fontSize: 12, fontWeight: 700, fill: "rgb(var(--accent))", textAnchor: "end" }, "↑ better"),
        labels.map((label, v) => h("g", { key: v },
          h("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: "rgb(var(--line))", strokeDasharray: v === 0 || v === 4 ? "" : "3 4" }),
          label && h("text", { x: m.l - 8, y: y(v) + 4, fontSize: 11, fill: "rgb(var(--muted))", textAnchor: "end" }, label))),
        c.checkIns.map((ci, i) => h("text", { key: i, x: x(ci.session), y: H - 12, fontSize: 11, fill: "rgb(var(--muted))", textAnchor: "middle" },
          ci.session === 0 ? (G.wide ? "Before session 1" : "Start") : (G.wide ? `After ${ci.session}` : ci.session))),
        g && h("g", { opacity: a.ghostO },
          h("path", { d: gpts.map((pt, i) => `${i ? "L" : "M"} ${pt[0]} ${pt[1]}`).join(" "), fill: "none", stroke: "rgb(var(--muted))", strokeWidth: 2.5, strokeDasharray: "5 5" }),
          gpts.map((pt, i) => h("circle", { key: i, cx: pt[0], cy: pt[1], r: 4, fill: "rgb(var(--surface))", stroke: "rgb(var(--muted))", strokeWidth: 2 })),
          h("text", { x: gpts[0][0], y: gpts[0][1] - 12, fontSize: 11.5, fontWeight: 700, fill: "rgb(var(--muted))" }, `${G.wide ? "Someone else: s" : "S"}topped after session ${g.checkIns[g.checkIns.length - 1].session}`)),
        h("path", { d: path, fill: "none", stroke: "rgb(var(--accent))", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: total, strokeDashoffset: total * (1 - a.draw) }),
        pts.map((pt, i) => h("circle", { key: i, cx: pt[0], cy: pt[1], r: 5.5, fill: "rgb(var(--accent))", stroke: "rgb(var(--surface))", strokeWidth: 2, opacity: a.draw >= reach[i] - 0.001 ? 1 : 0 })),
        note > 0.01 && h("g", { opacity: note },
          h("line", { x1: pts[pts.length - 1][0] - 14, x2: pts[pts.length - 1][0] - 14, y1: y(first), y2: y(latest) + 8, stroke: "rgb(var(--ink))", strokeWidth: 2 }),
          h("path", { d: `M ${pts[pts.length - 1][0] - 19} ${y(latest) + 13} l 5 -8 l 5 8`, fill: "none", stroke: "rgb(var(--ink))", strokeWidth: 2 }),
          h("text", { x: pts[pts.length - 1][0] - 22, y: y(latest) + 4, fontSize: 12.5, fontWeight: 700, fill: "rgb(var(--ink))", textAnchor: "end" }, `${steps(first - latest)} better`))));
  }

  function PersonActor({ a }) {
    return h("div", { style: place(a, 4), className: "flex items-center gap-2.5" },
      h(PersonGlyph, { size: 36 }),
      h("p", { className: "text-sm leading-snug text-ink" }, a.text));
  }

  function CounterActor({ a, G }) {
    const w = Math.max(0, Math.min(YEAR, Math.floor(a.week)));
    const prof = atWeek(w);
    return h("div", { style: place(a, 8), className: "text-right" },
      h("p", { className: "font-display text-lg font-semibold leading-tight text-ink" },
        w >= YEAR ? "One year" : `Week ${w}`,
        h("span", { className: `font-sans text-sm font-normal text-muted ${G.wide ? "" : "block"}` }, `${G.wide ? " · " : ""}${REC.people(prof.counted)}${G.wide ? " counted" : ""}`)),
      G.wide && h("p", { className: "mt-0.5 flex items-center justify-end gap-x-2.5 text-xs text-muted" },
        h("span", { className: "inline-flex items-center gap-1" }, h("span", { className: "inline-block h-1.5 w-1.5 rounded-full bg-muted" }), "one person"),
        h("span", { className: "inline-flex items-center gap-0.5" }, h(IconUp, { className: "h-3 w-3 text-accent", strokeWidth: 3 }), "better"),
        h("span", { className: "inline-flex items-center gap-0.5" }, h(IconMinus, { className: "h-3 w-3", strokeWidth: 3 }), "same"),
        h("span", { className: "inline-flex items-center gap-0.5" }, h(IconDown, { className: "h-3 w-3 text-ochre", strokeWidth: 3 }), "worse"),
        h("span", { className: "inline-flex items-center gap-1" }, h("span", { className: "inline-block h-2 w-2 rounded-full bg-ink/70" }), "lists the area")));
  }

  // What a therapist says about one area, next to what their patients report.
  function CalloutActor({ a }) {
    const { t, a: area, rec, lists } = a.cell;
    const look = RECORD_LOOK[rec.label];
    return h("div", { style: place(a, 9), className: "rounded-2xl border-2 border-ink bg-surface p-3 shadow-lg" },
      h("p", { className: "font-bold text-ink" }, `${firstName(t)} · ${short(area)}`),
      h("p", { className: "mt-2 text-xs font-bold uppercase tracking-[0.08em] text-muted" }, "Says"),
      h("p", { className: "mt-0.5 flex items-center gap-1.5 text-sm text-ink" },
        lists ? h("span", { className: "inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-ink/70" }) : h("span", { className: "inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-line-strong" }),
        lists ? `Lists ${lower(short(area))}` : `Doesn't list ${lower(short(area))}`),
      h("p", { className: "mt-2 text-xs font-bold uppercase tracking-[0.08em] text-muted" }, "Patients report"),
      h("p", { className: `mt-0.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-sm font-bold ${look.cell}` },
        look.Icon && h(look.Icon, { className: "h-3.5 w-3.5", strokeWidth: 3 }), `${REC.LABELS[rec.label]} · ${REC.people(rec.people)}`));
  }

  function LabelActor({ a }) {
    const look = a.look ? RECORD_LOOK[a.look] : null;
    return h("p", { style: place(a, 2), className: `flex items-center gap-1.5 whitespace-nowrap text-[0.8rem] font-bold ${a.tone === "muted" ? "text-muted" : "text-ink"}` },
      look && h("span", { className: `inline-flex h-4 w-4 items-center justify-center rounded border ${look.cell}` }, h(look.Icon, { className: "h-3 w-3", strokeWidth: 3 })),
      a.text);
  }

  function TrayActor({ a }) {
    return h("div", { style: place(a, 1), className: "rounded-2xl border-2 border-dashed border-line-strong bg-sunken/50" },
      h("p", { className: "px-3 pt-2 text-[0.8rem] font-bold text-muted" }, "Set aside, whatever else fits"));
  }

  function CutActor({ a }) {
    return h("div", { style: place(a, 2), className: "flex items-center gap-2" },
      h("span", { className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[0.7rem] font-bold text-accent-ink" }, h(IconUp, { className: "h-3 w-3", strokeWidth: 3 }), "Shortlist"),
      h("span", { className: "h-0 flex-1 border-t-2 border-dashed border-accent" }));
  }

  function NoteActor({ a }) {
    return h("p", { style: place(a, 9), className: `flex items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-center text-sm text-ink shadow-sm` },
      h(IconInfo, { className: "h-4 w-4 shrink-0 text-accent" }), a.text);
  }

  // Chapter 7's last beat: Alex checks in too, sees their own progress, and adds to their therapist's profile.
  function LoopActor({ a, G }) {
    const t = a.t;
    const row = (k) => ({ opacity: clamp01(a.reveal - k), transform: `translateY(${(1 - clamp01(a.reveal - k)) * 8}px)` });
    const sample = CI.overall.options;
    return h("div", { style: place(a, 4), className: `flex flex-col ${G.wide ? "gap-3" : "gap-2"}` },
      h("div", { style: row(0), className: "rounded-2xl border-2 border-accent/40 bg-surface p-3 shadow-sm" },
        h("p", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted" }, h(AlexPortrait, { size: 22 }), `${PERSON.name} checks in`),
        h("p", { className: "mt-1 text-[0.82rem] font-bold text-ink" }, CI.overall.text),
        h("div", { className: "mt-1.5 grid grid-cols-5 gap-1" }, sample.map((label, v) =>
          h("span", { key: v, className: `flex min-h-[1.9rem] items-center justify-center rounded-md border px-0.5 text-center text-[0.66rem] leading-tight ${v === 1 ? "border-accent bg-accent-soft font-bold text-ink" : "border-line-strong text-muted"}` }, label)))),
      h("div", { style: row(1), className: "rounded-2xl border border-accent/40 bg-surface p-3 shadow-sm" },
        h("p", { className: "text-xs font-bold uppercase tracking-[0.08em] text-muted" }, "What Alex sees, later"),
        h("p", { className: "mt-1 text-sm text-ink" }, h("span", { className: "font-bold" }, "Since you started: "), `${mine.map((x) => `${short(x)}: better`).join(" · ")}`),
        h("p", { className: "mt-0.5 text-xs text-muted" }, "For example. Alex's own words, back to them.")),
      h("div", { style: row(2), className: "flex items-center gap-2.5 rounded-2xl border border-dashed border-line-strong bg-sunken/60 p-3" },
        h(IconArrow, { className: "h-5 w-5 shrink-0 text-accent", strokeWidth: 2.5 }),
        h("p", { className: "text-sm leading-snug text-ink" }, `Behind the scenes, it adds to ${firstName(t)}'s profile for ${mineText("and")}, for the next person.`)));
  }

  const ACTORS = {
    alex: AlexActor, safety: SafetyActor, answer: AnswerActor, profile: ProfileActor, pill: PillActor, therapist: TherapistActor,
    checkin: CheckinActor, chart: ChartActor, person: PersonActor, counter: CounterActor, callout: CalloutActor, label: LabelActor,
    tray: TrayActor, cut: CutActor, note: NoteActor, loop: LoopActor,
  };

  /* ---------------- layouts ---------------- */
  function geo({ w, h }) {
    const wide = w >= 720;
    return { w, h, wide, pad: wide ? 20 : 10, top: 52 };
  }
  const tkey = (t) => `t-${t.id}`;
  const TB = { kind: "therapist", o: 1, dim: 0, ring: 0, regO: 0, chipsO: 0, chipsDim: 0, slotsO: 0, week: 0, slotFocus: 0, spotO: 0, rowO: 0, bar: 0, barO: 0, numO: 0, asideO: 0, hl: 0, tagO: 0, cardO: 0 };
  const pill = (G) => ({ pill: { kind: "pill", x: G.pad, y: 10, h: 34 } });

  // The eight therapists as cards: 4 × 2 on wide screens, 2 × 4 on phones. `reserve` keeps space at the bottom.
  function gridSpots(G, reserve = 0) {
    const cols = G.wide ? 4 : 2;
    const rows = Math.ceil(T.length / cols);
    const gap = G.wide ? 12 : 8;
    const cw = (G.w - 2 * G.pad - (cols - 1) * gap) / cols;
    const ch = (G.h - G.top - G.pad - reserve - (rows - 1) * gap) / rows;
    return T.map((t, k) => ({ x: G.pad + (k % cols) * (cw + gap), y: G.top + Math.floor(k / cols) * (ch + gap), w: cw, h: ch, col: k % cols }));
  }
  function grid(G, props, each, reserve) {
    const spots = gridSpots(G, reserve);
    const out = {};
    T.forEach((t, k) => {
      out[tkey(t)] = { ...TB, ...spots[k], t, regO: G.wide ? 1 : 0, ...props, ...(each ? each(t, k, spots[k]) : {}), enter: { y: spots[k].y + 14 } };
    });
    return out;
  }

  const trayShape = (G) => (G.wide ? { cols: 1, rowH: 80 } : { cols: Math.min(2, outs.length), rowH: 104 });
  // Matching as a list of rows, with a "set aside" tray beside it (wide) or under it (phone).
  function listGeo(G) {
    const rx = G.pad + (G.wide ? 28 : 24);
    if (G.wide) {
      const rw = Math.min(620, G.w - rx - G.pad - 24 - 270);
      const trayX = rx + rw + 24;
      return { rx, rw, trayX, trayW: G.w - G.pad - trayX, bottom: G.h - G.pad };
    }
    const { cols, rowH } = trayShape(G);
    const trayH = 32 + Math.ceil(outs.length / cols) * (rowH + 6);
    const trayY = G.h - G.pad - trayH;
    return { rx, rw: G.w - rx - G.pad, trayX: G.pad, trayW: G.w - 2 * G.pad, trayY, trayH, bottom: outs.length ? trayY - 10 : G.h - G.pad };
  }

  // items: [{ label } | { r }] top to bottom. Rows share the space left after labels (and the cut-off line).
  function stack(G, items, opts = {}) {
    const L = listGeo(G);
    const labelH = 22;
    const nRows = items.filter((x) => x.r).length;
    const nLabels = items.length - nRows;
    const cut = opts.cutAfter != null ? 16 : 0;
    const gap = 5;
    const rh = Math.max(26, Math.min(46, Math.floor((L.bottom - G.top - nLabels * labelH - cut) / Math.max(1, nRows)) - gap));
    const out = {};
    let y = G.top;
    let rowsSoFar = 0;
    items.forEach((it) => {
      if (it.label) {
        out[`label-${it.key}`] = { kind: "label", x: L.rx, y: y + 2, w: L.rw, h: labelH - 4, text: it.label, look: it.look, d: 0.3 };
        y += labelH;
        return;
      }
      out[tkey(it.r.therapist)] = { ...TB, x: L.rx, y, w: L.rw, h: rh, t: it.r.therapist, r: it.r, rowO: 1, position: it.r.position, ...(opts.each ? opts.each(it.r) : {}) };
      y += rh + gap;
      rowsSoFar += 1;
      if (opts.cutAfter === rowsSoFar) {
        out.cut = { kind: "cut", x: L.rx - (G.wide ? 28 : 24), y: y - 2, w: L.rw + (G.wide ? 28 : 24), h: 16, enter: { w: 0 } };
        y += cut;
      }
    });
    return out;
  }
  function tray(G) {
    const L = listGeo(G);
    const out = {};
    if (!outs.length) return out;
    const { cols, rowH } = trayShape(G);
    out.tray = G.wide
      ? { kind: "tray", x: L.trayX, y: G.top, w: L.trayW, h: 32 + outs.length * (rowH + 6) }
      : { kind: "tray", x: L.trayX, y: L.trayY, w: L.trayW, h: L.trayH };
    const rw = (out.tray.w - 16 - (cols - 1) * 6) / cols;
    outs.forEach((r, k) => {
      out[tkey(r.therapist)] = { ...TB, t: r.therapist, r, x: out.tray.x + 8 + (k % cols) * (rw + 6), y: out.tray.y + 28 + Math.floor(k / cols) * (rowH + 6), w: rw, h: rowH, asideO: 1 };
    });
    return out;
  }
  const barKey = (G) => (G.wide ? { barKey: { kind: "label", x: listGeo(G).rx + 216, y: 18, w: 320, h: 18, text: `Bars: how well each fits ${PERSON.name}'s preferences`, tone: "muted" } } : {});
  const byName = (a, b) => a.therapist.name.localeCompare(b.therapist.name);
  const grouped = (sortWithin) => {
    const items = [];
    groups.forEach((g) => {
      items.push({ key: g.order, label: g.label, look: g.look });
      const members = sortWithin ? g.members : g.members.slice().sort(byName);
      members.forEach((r) => items.push({ r }));
    });
    return items.length ? items : ins.map((r) => ({ r }));
  };

  /* ---------------- the beats ---------------- */
  const CHAPTERS = [
    { title: "Meet Alex" },
    { title: "What therapists say" },
    { title: "Checking in" },
    { title: "A year of check-ins" },
    { title: "Two sides of a profile" },
    { title: "Finding a match" },
    { title: `What ${PERSON.name} sees` },
  ];

  const rows = FF.profiles.profileRows(answers).filter(([, v]) => v);
  const lister = T.slice().sort((a, b) => b.focus_areas.length - a.focus_areas.length)[0];
  const othersCounts = T.filter((t) => t !== lister).map((t) => t.focus_areas.length);
  const allAreas = REC.areaIds().length;
  const exampleFirst = example.checkIns[0];
  const exampleLast = example.checkIns[example.checkIns.length - 1];
  const exampleSteps = areaChange(example, exampleArea);
  const stoppedChange = stopped ? areaChange(stopped, exampleArea) : 0;
  const reasonOf = (r, q) => r.excluded.find((e) => e.question === q);
  const formatOuts = outs.filter((r) => reasonOf(r, "q19"));
  const otherOuts = outs.filter((r) => !reasonOf(r, "q19"));
  const harmOut = outs.filter((r) => reasonOf(r, "q6"));
  const worseIn = (tid) => mine.filter((a) => profile.record(tid, a).label === "worse");
  const helpedGroup = ins.filter((r) => helpedIn(r.id).length && !worseElsewhere(r.id).length);
  const cautionGroup = ins.filter((r) => worseElsewhere(r.id).length && !helpedIn(r.id).length);
  const formatWord = (r) => reasonOf(r, "q19").reason.replace(/^Doesn't offer /, "").replace(/\.$/, "");
  const setAside = [
    formatOuts.length && `${PERSON.name} wants ${formatWord(formatOuts[0])}. ${names(formatOuts)} ${formatOuts.length === 1 ? "doesn't" : "don't"} offer them, so ${formatOuts.length === 1 ? `${firstName(formatOuts[0].therapist)} is` : "they're"} set aside.`,
    otherOuts.length && `${names(otherOuts)} ${otherOuts.length === 1 ? "is" : "are"} set aside: ${lower(otherOuts[0].excluded[0].reason)}`,
    ...harmOut.map((r) => `${firstName(r.therapist)} would be set aside ${reasonOf(r, "q19") ? "anyway" : "too"}: ${firstName(r.therapist)}'s patients with ${andList(worseIn(r.id).map((a) => lower(short(a))))} tended to get worse.`),
  ].filter(Boolean).join(" ");
  const preferences = [
    list(answers.q16).length && `the qualities ${PERSON.name} wants`,
    answers.q17 && `how ${PERSON.name} likes to talk`,
    list(answers.q18).length && `experience with ${andList(list(answers.q18).map((k) => lower(FF.optionLabel("q18", k)).replace(/^(experience supporting|understanding of my|respect for my) /, "")))}`,
    ...list(answers.q20).map((k) => ({ cost: "cost", wait: "waiting time", flexible: "flexible hours" }[k])),
  ].filter(Boolean);
  const cardsFor = (G) => {
    const n = shortlist.length;
    const out = {};
    if (G.wide) {
      const gap = 14;
      const cw = (G.w - 2 * G.pad - (n - 1) * gap) / n;
      const ch = Math.min(G.h - G.top - 6 - G.pad, 270);
      shortlist.forEach((r, k) => { out[tkey(r.therapist)] = { ...TB, t: r.therapist, r, x: G.pad + k * (cw + gap), y: G.top + 6, w: cw, h: ch, cardO: 1, regO: 1 }; });
    } else {
      const gap = 8;
      const ch = (G.h - G.top - G.pad - (n - 1) * gap) / n;
      shortlist.forEach((r, k) => { out[tkey(r.therapist)] = { ...TB, t: r.therapist, r, x: G.pad, y: G.top + k * (ch + gap), w: G.w - 2 * G.pad, h: ch, cardO: 1 }; });
    }
    return out;
  };

  function centre(G, w, hh) { return { x: (G.w - w) / 2, y: (G.h - hh) / 2 }; }
  const alexAt = (G, x, y, s = 1, extra) => ({ alex: { kind: "alex", x, y, w: 140, h: 156, s, ...extra } });
  const answerSpots = (G) => {
    if (G.wide) {
      const cw = Math.min(260, (G.w - 140 - 2 * 32 - 2 * G.pad) / 2);
      const ch = 66;
      const gap = 12;
      const y0 = (G.h - (3 * ch + 2 * gap)) / 2;
      return rows.map((_, k) => ({ x: k < 3 ? G.w / 2 - 70 - 32 - cw : G.w / 2 + 70 + 32, y: y0 + (k % 3) * (ch + gap), w: cw, h: ch }));
    }
    const cw = (G.w - 2 * G.pad - 8) / 2;
    const ch = Math.min(130, (G.h - 128 - G.pad - 16) / 3);
    return rows.map((_, k) => ({ x: G.pad + (k % 2) * (cw + 8), y: 128 + Math.floor(k / 2) * (ch + 8), w: cw, h: ch }));
  };
  const profileBox = (G) => {
    const w = G.wide ? Math.min(600, G.w - 2 * G.pad) : G.w - 2 * G.pad;
    const hh = G.wide ? 64 + rows.length * 34 : G.h - 2 * G.pad;
    return { ...centre(G, w, hh), w, h: hh };
  };
  const answers3 = (G) => {
    const spots = answerSpots(G);
    const a = G.wide ? { x: G.w / 2 - 70, y: (G.h - 156) / 2 } : { x: G.w / 2 - 70 * 0.7, y: 8 };
    const out = alexAt(G, a.x, a.y, G.wide ? 1 : 0.7);
    rows.forEach(([term, value], k) => {
      out[`answer-${k}`] = { kind: "answer", ...spots[k], term, value, d: k * 0.08, enter: { x: G.w / 2 - spots[k].w / 2, y: a.y + 40, s: 0.5 } };
    });
    return out;
  };

  // Chapter 3: the example therapist's card, the person, the check-in form, the chart.
  const ch3 = (G, stage) => {
    const col = G.wide ? 300 : G.w - 2 * G.pad;
    const out = {};
    out[tkey(exampleT)] = { ...TB, t: exampleT, x: G.pad, y: G.wide ? 20 : 10, w: col, h: 50, regO: 1 };
    const compactH = G.wide ? 150 : 158;
    const fullH = G.wide ? 92 + (example.areas.length + 1) * 74 : 100 + (example.areas.length + 1) * 92;
    const ciBase = { kind: "checkin", course: example, area: exampleArea, sel: 0, moreO: 0 };
    if (stage <= 1) {
      out.person = { kind: "person", x: G.pad, y: G.wide ? 86 : 70, w: col, h: 44, text: `Someone who started seeing ${firstName(exampleT)} about ${lower(short(exampleArea))}` };
      const x = G.wide ? G.pad + col + 24 : G.pad;
      const w = G.wide ? Math.min(500, G.w - x - G.pad) : G.w - 2 * G.pad;
      out.checkin = { ...ciBase, x, y: G.wide ? 20 : 126, w, h: stage === 0 ? compactH : fullH, moreO: stage === 0 ? 0 : 1, enter: { y: (G.wide ? 20 : 126) + 16 } };
    } else {
      out.checkin = { ...ciBase, x: G.pad, y: G.wide ? 86 : 70, w: col, h: compactH, sel: example.checkIns.length - 1, linear: true };
      const cx = G.wide ? G.pad + col + 24 : G.pad;
      const cy = G.wide ? 20 : 70 + compactH + 10;
      out.chart = { kind: "chart", x: cx, y: cy, w: G.w - cx - G.pad, h: G.h - cy - (G.wide ? 20 : G.pad), course: example, area: exampleArea, draw: 1, noteO: 1, ghost: stopped, ghostO: stage === 3 ? 1 : 0, linear: stage === 2, enter: { draw: 0 } };
    }
    return out;
  };

  const counter = (G, week, extra) => ({ counter: { kind: "counter", x: G.w - G.pad - (G.wide ? 420 : 110), y: G.wide ? 8 : 6, w: G.wide ? 420 : 110, h: 42, week, ...extra } });
  const callout = (G, cell) => {
    const spots = gridSpots(G);
    const s = spots[T.indexOf(cell.t)];
    const cw = G.wide ? 250 : s.w;
    const chh = 160;
    const x = G.wide ? (s.col >= 2 ? s.x - cw - 12 : s.x + s.w + 12) : (s.col === 1 ? s.x - cw - 8 : s.x + s.w + 8);
    const y = Math.max(G.top, Math.min(G.h - G.pad - chh, s.y));
    return { [`callout-${cell.t.id}`]: { kind: "callout", x, y, w: cw, h: chh, cell, enter: { y: y + 10 } } };
  };
  const yearGrid = (G, extra, each) => ({ ...pill(G), ...grid(G, { slotsO: 1, week: YEAR, ...extra }, each), ...counter(G, YEAR) });

  const BEATS = [
    // 1. Meet Alex
    {
      chapter: 0, anim: 1.0,
      caption: `Meet ${PERSON.name}: ${PERSON.about}, and doesn't know where to start. ${PERSON.name} is fictional, like everyone here.`,
      frame: (G) => alexAt(G, G.w / 2 - 70, (G.h - 156) / 2, 1, { enter: { y: (G.h - 156) / 2 + 14 } }),
    },
    {
      chapter: 0, anim: 1.2,
      caption: "First, a safety check. Anyone who needs help right now is pointed to Lifeline or 000, before any questions.",
      sr: "A card: Need help right now? Call Lifeline on 13 11 14, or 000 in an emergency.",
      frame: (G) => {
        if (G.wide) {
          const left = (G.w - (140 + 32 + 360)) / 2;
          return { ...alexAt(G, left, (G.h - 156) / 2), safety: { kind: "safety", x: left + 172, y: (G.h - 170) / 2, w: 360, h: 170, enter: { x: left + 200 } } };
        }
        return { ...alexAt(G, G.w / 2 - 70, 24), safety: { kind: "safety", x: G.pad, y: 206, w: G.w - 2 * G.pad, h: 190, enter: { y: 226 } } };
      },
    },
    {
      chapter: 0, anim: 1.6,
      caption: `Then ${PERSON.name} answers a few short questions: what's been hard lately, and what they'd like in a therapist. Nothing about diagnoses.`,
      sr: `${PERSON.name}'s answers: ${rows.map(([t, v]) => `${t}: ${v}`).join("; ")}.`,
      frame: answers3,
    },
    {
      chapter: 0, anim: 1.6,
      caption: `${PERSON.name}'s answers become their profile. This is what ${PERSON.name} sees: plain words, with no scores and no labels.`,
      sr: `${PERSON.name}'s profile card, with the same answers as plain lines.`,
      frame: (G) => {
        const box = profileBox(G);
        const out = { profile: { kind: "profile", ...box, rows, reveal: rows.length, d: 0.25, enter: { reveal: 0 } } };
        out.alex = { kind: "alex", x: box.x + 4, y: box.y + 4, w: 140, h: 156, s: 0.3, o: 0, late: true };
        rows.forEach(([term, value], k) => {
          out[`answer-${k}`] = { kind: "answer", x: box.x + 16, y: box.y + 52 + k * (G.wide ? 34 : 47), w: box.w - 32, h: 30, term, value, o: 0, late: true, d: k * 0.04 };
        });
        return out;
      },
    },

    // 2. What therapists say
    {
      chapter: 1, anim: 1.6,
      caption: `Thera-Fits has ${num(T.length)} therapists to choose from. They're fictional too.`,
      sr: `${num(T.length)} cards, one per therapist: ${andList(T.map((t) => t.name))}.`,
      frame: (G) => ({
        profile: { kind: "profile", x: G.pad, y: 10, w: G.wide ? 260 : 190, h: 34, rows, reveal: rows.length, o: 0 },
        ...pill(G),
        ...grid(G, {}, (t, k) => ({ d: 0.2 + k * 0.05 })),
      }),
    },
    {
      chapter: 1, anim: 1.4,
      caption: `Each therapist lists the areas they work on. Most list ${Math.min(...othersCounts) === Math.max(...othersCounts) ? num(othersCounts[0]) : `${num(Math.min(...othersCounts))} or ${num(Math.max(...othersCounts))}`}. ${firstName(lister)} lists ${lister.focus_areas.length === allAreas ? `all ${num(allAreas)}` : num(lister.focus_areas.length)}.`,
      sr: `Each card lists the therapist's areas. ${lister.name}'s card lists ${lister.focus_areas.length}.`,
      frame: (G) => ({ ...pill(G), ...grid(G, { chipsO: 1 }, (t, k) => ({ d: k * 0.05, ring: t === lister ? 1 : 0 })) }),
    },
    {
      chapter: 1, anim: 1.0,
      caption: "But research shows therapists aren't good judges of their own strengths. So what they say about themselves counts for little.",
      frame: (G) => ({
        ...(G.wide ? pill(G) : {}), ...grid(G, { chipsO: 1, chipsDim: 1 }),
        note: G.wide
          ? { kind: "note", x: G.w - G.pad - 440, y: 9, w: 440, h: 36, text: "What therapists say about themselves counts for little", enter: { y: 0 } }
          : { kind: "note", x: G.pad, y: 9, w: G.w - 2 * G.pad, h: 34, text: "What they say counts for little", enter: { y: 0 } },
      }),
    },

    // 3. Checking in
    {
      chapter: 2, anim: 1.6,
      caption: `Here's the new part. Say someone starts seeing ${firstName(exampleT)} about ${lower(short(exampleArea))}. They check in before their first session, then ${CI.EVERY === 2 ? "every couple of sessions" : `every ${CI.EVERY} sessions`}.`,
      sr: `A check-in form: "${CI.area.text(exampleArea)}" Their answer: ${CI.area.options[exampleFirst.areas[exampleArea]]}.`,
      frame: (G) => ch3(G, 0),
    },
    {
      chapter: 2, anim: 1.2,
      caption: "Every check-in asks the same few questions about how things are going. Nobody is asked to rate their therapist.",
      sr: `The form also asks about ${andList(example.areas.filter((x) => x !== exampleArea).map((x) => lower(short(x))))}, and "${CI.overall.text}"`,
      frame: (G) => ch3(G, 1),
    },
    {
      chapter: 2, anim: 3.4,
      caption: `Comparing their first check-in with their latest shows the change. ${upper(short(exampleArea))} went from "${CI.area.options[exampleFirst.areas[exampleArea]]}" to "${CI.area.options[exampleLast.areas[exampleArea]]}": ${steps(exampleSteps)} better.`,
      sr: `A line chart of their answers over ${example.checkIns.length} check-ins, from ${CI.area.options[exampleFirst.areas[exampleArea]]} to ${CI.area.options[exampleLast.areas[exampleArea]]}.`,
      frame: (G) => ch3(G, 2),
    },
    stopped && {
      chapter: 2, anim: 1.2,
      caption: `If someone stops early, their last check-in still counts. This person stopped after session ${stopped.checkIns[stopped.checkIns.length - 1].session}, ${stoppedChange === 0 ? "with no change" : `${steps(Math.abs(stoppedChange))} ${stoppedChange > 0 ? "better" : "worse"}`}.`,
      sr: "A second, dashed line on the chart for someone who stopped early.",
      frame: (G) => ch3(G, 3),
    },

    // 4. A year of check-ins
    {
      chapter: 3, anim: 1.6,
      caption: `Now picture a year of check-ins from everyone (made up for this demo), in the areas ${PERSON.name} picked: ${mineText("and")}.`,
      sr: `Each therapist's card now has a space for ${mineText("and")}, empty so far.`,
      frame: (G) => ({ ...pill(G), ...grid(G, { slotsO: 1, week: 0 }, (t, k) => ({ d: k * 0.03 })), ...counter(G, 0) }),
    },
    {
      chapter: 3, anim: 8,
      caption: "Each dot is one person. Their change lands with their therapist, in the area they came about.",
      sr: `A year goes by. By the end, ${REC.people(profile.counted)} are counted.`,
      frame: (G) => ({ ...pill(G), ...grid(G, { slotsO: 1, week: YEAR, linear: true }), ...counter(G, YEAR, { linear: true }) }),
    },
    {
      chapter: 3, anim: 0.8,
      caption: `Once ${MIN_PEOPLE} people with an area have checked in, their average decides: helped, no clear change, or got worse.`,
      sr: `Labels in ${mineText("and")}: ${cells.filter((c) => c.rec.label !== "not_enough").map((c) => `${firstName(c.t)}, ${lower(short(c.a))}: ${lower(REC.LABELS[c.rec.label])}`).join("; ")}.`,
      frame: (G) => yearGrid(G, { slotFocus: 1 }),
    },

    // 5. Two sides of a profile
    saysButWorse && {
      chapter: 4, anim: 1.2,
      caption: `${firstName(saysButWorse.t)} lists ${lower(short(saysButWorse.a))}. But ${firstName(saysButWorse.t)}'s patients with ${lower(short(saysButWorse.a))} tended to get worse.`,
      frame: (G) => ({ ...yearGrid(G, { slotFocus: 0 }, (t) => (t === saysButWorse.t ? { ring: 1, spot: saysButWorse.a, spotO: 1 } : { dim: 1 })), ...callout(G, saysButWorse) }),
    },
    quietButHelped && {
      chapter: 4, anim: 1.2,
      caption: `${firstName(quietButHelped.t)} doesn't list ${lower(short(quietButHelped.a))} at all. Yet people who saw ${firstName(quietButHelped.t)} with ${lower(short(quietButHelped.a))} got better.`,
      frame: (G) => ({ ...yearGrid(G, { slotFocus: 0 }, (t) => (t === quietButHelped.t ? { ring: 1, spot: quietButHelped.a, spotO: 1 } : { dim: 1 })), ...callout(G, quietButHelped) }),
    },
    {
      chapter: 4, anim: 1.0,
      caption: "So every therapist's profile has two sides: what they say, and what their patients report. Patients' reports count for more.",
      frame: (G) => yearGrid(G, {}),
    },

    // 6. Finding a match
    {
      chapter: 5, anim: 1.8,
      caption: `Now Thera-Fits looks for ${PERSON.name}'s match among all ${num(T.length)}.`,
      frame: (G) => ({ ...pill(G), ...stack(G, T.map((t) => ({ r: trace.results.find((r) => r.id === t.id) }))) }),
    },
    outs.length && {
      chapter: 5, anim: 1.6,
      caption: setAside,
      sr: `Set aside: ${outs.map((r) => `${r.therapist.name}, ${r.excluded.map((e) => e.reason).join(" ")}`).join("; ")}`,
      frame: (G) => ({ ...pill(G), ...stack(G, ins.slice().sort((a, b) => T.indexOf(a.therapist) - T.indexOf(b.therapist)).map((r) => ({ r }))), ...tray(G) }),
    },
    groups.length > 1 && {
      chapter: 5, anim: 1.6,
      caption: `Next, track record. ${names(helpedGroup)} helped people with ${mineText("or")}, so they go first.${cautionGroup.length ? ` ${names(cautionGroup)}'s patients got worse in another area, so ${cautionGroup.length === 1 ? `${firstName(cautionGroup[0].therapist)} goes` : "they go"} last.` : ""}`,
      sr: `Groups, in order: ${groups.map((g) => `${g.label}: ${names(g.members)}`).join("; ")}.`,
      frame: (G) => ({ ...pill(G), ...stack(G, grouped(false)), ...tray(G) }),
    },
    {
      chapter: 5, anim: 1.8,
      caption: `Within each group, ${PERSON.name}'s preferences set the order: ${andList(preferences)}.`,
      sr: `Each row gets a bar for how well they fit ${PERSON.name}'s preferences. In order: ${names(ins)}.`,
      frame: (G) => ({ ...pill(G), ...stack(G, grouped(true), { each: (r) => ({ barO: 1, bar: r.max ? r.score / r.max : 0 }) }), ...tray(G), ...barKey(G) }),
    },
    {
      chapter: 5, anim: 1.2,
      caption: `The top ${num(R.SHORTLIST_SIZE)} make ${PERSON.name}'s shortlist: ${names(shortlist)}.`,
      frame: (G) => ({ ...pill(G), ...stack(G, grouped(true), { cutAfter: shortlist.length, each: (r) => ({ barO: 1, bar: r.max ? r.score / r.max : 0, numO: 1, hl: r.shortlisted ? 1 : 0 }) }), ...tray(G), ...barKey(G) }),
    },
    added.length && dropped.length && {
      chapter: 5, anim: 1.2,
      caption: `Without check-ins, ${names(dropped)} would be on the shortlist instead of ${names(added)}. ${firstName(added[0].therapist)}'s patients with ${andList(helpedIn(added[0].id).map((x) => lower(short(x))))} got better, and that counts for more.`,
      frame: (G) => ({
        ...pill(G), ...tray(G), ...barKey(G),
        ...stack(G, grouped(true), {
          cutAfter: shortlist.length,
          each: (r) => {
            const tag = added.some((x) => x.id === r.id) ? (G.wide ? "Moved up by check-ins" : "Moved up")
              : dropped.some((x) => x.id === r.id) ? (G.wide ? `#${before.results.find((x) => x.id === r.id).position} without check-ins` : `#${before.results.find((x) => x.id === r.id).position} before`) : null;
            return { barO: 1, bar: r.max ? r.score / r.max : 0, numO: 1, hl: r.shortlisted ? 1 : 0, tag, tagO: tag ? 1 : 0 };
          },
        }),
      }),
    },

    // 7. What Alex sees
    {
      chapter: 6, anim: 1.8,
      caption: `This is all ${PERSON.name} sees: ${num(shortlist.length)} therapists and why each might fit, in plain words. No scores, and no public rankings.`,
      sr: shortlist.map((r) => { const x = reasons(r); return `${r.therapist.name}: ${x.fits.join("; ")}${x.miss ? `. Worth knowing: ${x.miss}` : ""}.`; }).join(" "),
      frame: (G) => ({ ...pill(G), ...cardsFor(G) }),
    },
    {
      chapter: 6, anim: 2.2,
      caption: `Once ${PERSON.name} starts, ${PERSON.name} checks in too. ${PERSON.name} sees their own progress, and their check-ins help the next person find a good fit.`,
      sr: `${PERSON.name} fills in a check-in. Later they see, for example: Since you started: ${mine.map((x) => `${short(x)}: better`).join(", ")}. It also adds to ${firstName(shortlist[0].therapist)}'s profile.`,
      frame: (G) => {
        const r = shortlist[0];
        const cards = cardsFor(G);
        const out = { ...pill(G) };
        if (G.wide) {
          const c = cards[tkey(r.therapist)];
          out[tkey(r.therapist)] = { ...c, ring: 1 };
          const x = c.x + c.w + 24;
          out.loop = { kind: "loop", t: r.therapist, x, y: G.top + 6, w: G.w - x - G.pad, h: G.h - G.top - 6 - G.pad, reveal: 3, linear: true, enter: { reveal: 0 } };
        } else {
          const c = { ...cards[tkey(r.therapist)], h: 112 };
          out[tkey(r.therapist)] = { ...c, ring: 1 };
          const y = c.y + c.h + 10;
          out.loop = { kind: "loop", t: r.therapist, x: G.pad, y, w: G.w - 2 * G.pad, h: G.h - y - G.pad, reveal: 3, linear: true, enter: { reveal: 0 } };
        }
        return out;
      },
    },
  ].filter(Boolean);

  // One frame per beat and stage size, worked out once.
  const frames = {};
  const frameOf = (i, G) => {
    const k = `${i}:${G.w}x${G.h}`;
    return frames[k] || (frames[k] = BEATS[i].frame(G));
  };
  function stage(i, p, size) {
    const G = geo(size);
    const f = mix(i > 0 ? frameOf(i - 1, G) : {}, frameOf(i, G), p);
    return Object.keys(f).map((id) => h(ACTORS[f[id].kind], { key: id, a: f[id], G }));
  }
  // Wide: as tall as fits on a laptop screen with the caption and controls. Phone: tall enough for 4 rows of cards.
  const stageHeight = (w, vh) => (w >= 720 ? Math.max(340, Math.min(540, vh - 400)) : Math.max(520, Math.min(560, vh * 0.62)));

  const DETAILS = `index.html?patient=${PERSON.patient}&ranker=track-record`;
  const End = ({ replay }) => h("div", { className: "flex flex-wrap items-center gap-2" },
    h("a", { href: DETAILS, className: "inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[0.95rem] font-bold leading-tight text-accent-ink hover:bg-accent/90" }, "Explore the details", h(IconArrow, { className: "h-4 w-4" })),
    h("a", { href: "../App/index.html", className: "inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-[0.95rem] font-bold leading-tight text-ink hover:border-ink/60" }, "Try the demo"),
    h(Button, { variant: "quiet", onClick: replay }, "Watch again"));

  function StoryPage() {
    const minutes = Math.round(duration(BEATS) / 60);
    return h("div", { className: "flex min-h-screen flex-col" },
      h("a", { href: "#main", className: "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:font-bold focus:text-ink" }, "Skip to content"),
      h(Header, { page: "story" }),
      h("main", { id: "main", tabIndex: -1, className: "flex-1 focus:outline-none" },
        h("div", { className: "mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-8 sm:pt-7" },
          h("h1", { className: "font-display text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[2.1rem]" }, "How Thera-Fits finds a therapist who fits"),
          h("p", { className: "mt-1.5 max-w-3xl text-[1.02rem] leading-relaxed text-muted" },
            `A ${minutes}-minute walkthrough, following one person. Everyone in it is fictional, and the check-ins are synthetic.`),
          h("div", { className: "mt-4" }, h(Player, { beats: BEATS, chapters: CHAPTERS, stage, stageHeight, end: End, label: "Walkthrough" })),
          h("div", { className: "mt-6 grid gap-4 md:grid-cols-2" },
            h("div", { className: "rounded-2xl border border-line bg-surface p-5" },
              h("h2", { className: "font-display text-xl font-semibold text-ink" }, "Explore the details"),
              h("p", { className: "mt-1.5 text-[0.95rem] leading-relaxed text-muted" }, "Try your own answers, replay the year of check-ins, open any therapist's record, and compare ranking systems. Built for the project team."),
              h("a", { href: DETAILS, className: "mt-3 inline-flex items-center gap-1.5 font-bold text-accent underline-offset-4 hover:underline" }, "Open the details", h(IconArrow, { className: "h-4 w-4" }))),
            h("div", { className: "rounded-2xl border border-line bg-surface p-5" },
              h("h2", { className: "font-display text-xl font-semibold text-ink" }, "What's real and what isn't"),
              h("p", { className: "mt-1.5 text-[0.95rem] leading-relaxed text-muted" },
                "The therapists, Alex and every check-in are invented. The matching rules are the group's working spec. Check-ins that build therapist profiles are a proposal the group is still discussing."))))),
      h(Footer, { page: "story" }));
  }

  FF.story = { BEATS, CHAPTERS, facts: { trace, before, profile, example, stopped, saysButWorse, quietButHelped } };
  ReactDOM.createRoot(document.getElementById("root")).render(h(StoryPage));
})();
