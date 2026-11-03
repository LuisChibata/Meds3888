"use strict";
/*
  Allysa's walkthrough, for the final presentation: she comes back after the skit, answers the questions on her
  phone, gets Dr Con Fidence on her first shortlist, and a year of check-ins replaces her. It's the walkthrough in
  Explainer/story.html retold, with the same player: press Play, step, scrub, or pick a chapter.
  The Presenter mode button (or index.html?live) is the same story for the stage: nothing moves on until you click.

  Everything said about therapists comes from Explainer/matching: both shortlists from FF.rankers.run(), records
  from FF.records.build(). Ben Whitfield is only renamed here, so his data and the public site stay as they are.
  If the data stops telling this story, a banner says so instead of showing something untrue.

  Each cue is a frame of actors for when its movement ends, tweened from the previous cue by FF.player.mix. The
  stage is laid out at 1280 x 720 and scaled to the screen. Movement uses inline styles only (Tailwind rescans on
  class changes). Photos only appear where nothing negative is said (Explainer/img/therapists/CREDITS.md).
*/
window.FF = window.FF || {};

(function () {
  const { useState, useEffect, useRef } = React;
  const { h, IconCheck, IconCross, IconMinus, IconUp, IconDown, RECORD_LOOK, recordLook, DemoBadge } = FF.ui;
  const { mix, clamp01 } = FF.player;
  const REC = FF.records;
  const R = FF.rankers;
  const CI = FF.CHECK_IN;
  const { MIN_PEOPLE } = REC.RULES;
  const W = 1280;
  const H = 720;

  /* ---------------- the facts ---------------- */
  // Her answers come from her skit lines: anxious, about uni and family, and never given the chance to explain.
  const answers = { q6: ["anxiety", "study", "family"], q16: ["empathetic", "non_judgemental"], q17: "reflective", q19: "in_person", q20: ["cost", "wait"] };
  const VANESSA = "ben";
  const T = FF.THERAPISTS.map((t) => (t.id === VANESSA
    ? { ...t, name: "Dr Con Fidence", initials: "CF", photo: null, cartoon: true }
    : { ...t, photo: t.photo ? `../Explainer/${t.photo}` : null }));
  const YEAR = CI.YEAR_WEEKS;
  const context = { checkIns: FF.CHECK_INS, week: YEAR };
  const first = R.run("research", answers, T, context);
  const after = R.run("track-record", answers, T, context);
  const profile = REC.build(FF.CHECK_INS, { week: YEAR });
  const weeks = [];
  const atWeek = (w) => weeks[w] || (weeks[w] = REC.build(FF.CHECK_INS, { week: w }));
  const mine = answers.q6;
  const vanessa = T.find((t) => t.id === VANESSA);
  const vanessaAnxiety = profile.record(VANESSA, "anxiety");
  const problems = [
    !first.shortlist.some((r) => r.id === VANESSA) && "Dr Con Fidence is no longer on the first shortlist.",
    after.shortlist.some((r) => r.id === VANESSA) && "Dr Con Fidence is still on the shortlist after check-ins.",
    vanessaAnxiety.label !== "worse" && "Dr Con Fidence's anxiety record no longer says patients got worse.",
    vanessa.focus_areas.length !== REC.areaIds().length && "Dr Con Fidence no longer lists every area.",
  ].filter(Boolean);

  const short = (a) => FF.optionShort("q6", a);
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const firstName = (t) => t.name.replace(/^Dr /, "").split(" ")[0];
  const join = (xs) => xs.join(" · ");
  const rows = [
    ["Working on", join(mine.map(short))],
    ["Wants someone", join(answers.q16.map((id) => FF.optionLabel("q16", id)))],
    ["Prefers", FF.optionLabel("q17", answers.q17)],
    ["Sessions", FF.optionLabel("q19", answers.q19)],
    ["Practical", join(answers.q20.map((id) => FF.optionLabel("q20", id)))],
  ];

  // The same plain wording as the walkthrough's shortlist cards.
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

  /* ---------------- cartoons ---------------- */
  const col = (who, name) => `rgb(var(--${who}-${name}))`;
  const Round = ({ size, who, children }) => h("span", { className: "inline-block shrink-0 overflow-hidden rounded-full", style: { width: size, height: size, background: col(who, "bg") } },
    h("svg", { viewBox: "0 0 100 100", width: size, height: size, className: "block" }, children));

  const Allysa = ({ size = 40 }) => h(Round, { size, who: "allysa" },
    h("path", { d: "M26 46 C22 20 38 13 50 13 C64 13 78 22 74 48 C76 62 79 72 82 82 L18 82 C21 72 24 62 26 46 Z", fill: col("allysa", "hair") }),
    h("path", { d: "M12 104 C13 82 30 72 50 72 C70 72 87 82 88 104 Z", fill: col("allysa", "top") }),
    h("rect", { x: 43, y: 56, width: 14, height: 18, rx: 5, fill: col("allysa", "skin-shade") }),
    h("ellipse", { cx: 50, cy: 44, rx: 17, ry: 19, fill: col("allysa", "skin") }),
    h("path", { d: "M33 44 C33 30 42 25 52 25 C60 25 67 32 67 44 C63 37 57 33 50 33 C44 36 38 38 33 44 Z", fill: col("allysa", "hair") }),
    h("circle", { cx: 43.5, cy: 46.5, r: 1.9, fill: col("allysa", "hair") }),
    h("circle", { cx: 56.5, cy: 46.5, r: 1.9, fill: col("allysa", "hair") }),
    h("path", { d: "M45.5 53.5 Q50 56.5 54.5 53.5", fill: "none", stroke: col("allysa", "hair"), strokeWidth: 1.7, strokeLinecap: "round" }));

  // Dr Con Fidence: bun, glasses, a very sure smile.
  const Vanessa = ({ size = 40 }) => h(Round, { size, who: "vanessa" },
    h("circle", { cx: 50, cy: 15, r: 9, fill: col("vanessa", "hair") }),
    h("path", { d: "M12 104 C13 82 30 72 50 72 C70 72 87 82 88 104 Z", fill: col("vanessa", "top") }),
    h("path", { d: "M41 73 L50 88 L59 73 Z", fill: "#fff" }),
    h("rect", { x: 43, y: 56, width: 14, height: 18, rx: 5, fill: col("vanessa", "skin-shade") }),
    h("ellipse", { cx: 50, cy: 44, rx: 17, ry: 19, fill: col("vanessa", "skin") }),
    h("path", { d: "M32 46 C29 28 40 21 50 21 C60 21 71 28 68 46 C66 37 60 32 50 31 C41 32 34 37 32 46 Z", fill: col("vanessa", "hair") }),
    h("circle", { cx: 43, cy: 45, r: 5.5, fill: "none", stroke: "#172234", strokeWidth: 1.6 }),
    h("circle", { cx: 57, cy: 45, r: 5.5, fill: "none", stroke: "#172234", strokeWidth: 1.6 }),
    h("path", { d: "M48.5 45 H51.5", stroke: "#172234", strokeWidth: 1.6 }),
    h("circle", { cx: 43, cy: 45, r: 1.6, fill: "#172234" }),
    h("circle", { cx: 57, cy: 45, r: 1.6, fill: "#172234" }),
    h("path", { d: "M42 53 Q50 60 58 53", fill: "none", stroke: "#172234", strokeWidth: 1.8, strokeLinecap: "round" }));

  /* ---------------- actors ---------------- */
  const place = (a, z) => ({
    position: "absolute", left: 0, top: 0, width: a.w, height: a.h, zIndex: z || 0, opacity: a.o,
    transform: `translate(${a.x}px, ${a.y}px)${a.s != null && a.s !== 1 ? ` scale(${a.s})` : ""}`, transformOrigin: "top left",
  });

  function SplashActor({ a }) {
    return h("div", { style: place(a, 2), className: "flex flex-col items-center justify-center text-center" },
      h("img", { src: "../Explainer/img/logo.svg", alt: "", style: { width: 150, height: 150 } }),
      h("p", { className: "mt-4 font-display text-6xl font-semibold tracking-tight text-ink" }, "Thera-Fits"),
      a.line && h("p", { className: "mt-4 text-2xl text-muted" }, a.line));
  }

  function HeadActor({ a }) {
    return h("div", { style: place(a, 8), className: "flex items-baseline gap-3 whitespace-nowrap" },
      a.step && h("span", { className: "inline-flex h-10 w-10 items-center justify-center self-center rounded-full bg-accent font-display text-2xl font-semibold text-accent-ink" }, a.step),
      h("p", { className: "font-display text-[2rem] font-semibold tracking-tight text-ink" }, a.text));
  }

  function PillActor({ a }) {
    return h("div", { style: place(a, 8), className: "flex items-center gap-2 rounded-full border border-accent/40 bg-surface py-1 pl-1 pr-4 shadow-sm" },
      h(Allysa, { size: 38 }),
      h("span", { className: "whitespace-nowrap text-lg text-ink" }, h("span", { className: "font-bold" }, "Allysa"), ` · ${mine.map(short).join(" · ")}`));
  }

  function AllysaActor({ a }) {
    return h("div", { style: place(a, 6), className: "flex flex-col items-center text-center" },
      h(Allysa, { size: 190 }),
      h("p", { className: "mt-4 font-display text-5xl font-semibold leading-none text-ink" }, "Allysa"),
      h("span", { className: "mt-3" }, h(DemoBadge, null, "Played by Allysa. A fictional story")));
  }

  // Her phone. a.at moves through the screens: the whole part is the screen, the fraction is how far through it.
  const SCREENS = [
    { landing: true },
    { q: "q6", picks: answers.q6 }, { q: "q16", picks: answers.q16 }, { q: "q17", picks: [answers.q17] }, { q: "q19", picks: [answers.q19] }, { q: "q20", picks: answers.q20 },
    { done: true },
  ];
  function PhoneActor({ a }) {
    const k = Math.max(0, Math.min(SCREENS.length - 1, Math.floor(a.at)));
    const s = SCREENS[k];
    const frac = clamp01(a.at - k);
    const Q = s.q ? FF.question(s.q) : null;
    const picked = (id) => {
      const n = s.picks.indexOf(id);
      return n !== -1 && frac >= (n + 1) / (s.picks.length + 1);
    };
    return h("div", { style: place(a, 5), className: "rounded-[2.4rem] border-[7px] border-ink bg-ink shadow-xl" },
      h("div", { className: "relative flex h-full flex-col overflow-hidden rounded-[1.9rem] bg-paper px-4 pb-4 pt-8" },
        h("span", { className: "absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-line-strong" }),
        s.landing && h("div", { className: "flex flex-1 flex-col justify-center" },
          h("p", { className: "font-display text-lg font-semibold text-accent" }, "Thera-Fits"),
          h("p", { className: "mt-2 font-display text-[1.7rem] font-semibold leading-tight text-ink" }, "Find a therapist who fits you, before your first session."),
          h("span", { className: "mt-6 rounded-xl bg-accent py-3 text-center text-lg font-bold text-accent-ink" }, "Start")),
        Q && h("div", { className: "flex min-h-0 flex-1 flex-col" },
          h("p", { className: "text-sm font-bold text-muted" }, `Question ${k} of ${SCREENS.length - 2}`),
          h("p", { className: "mt-1 font-display text-[1.2rem] font-semibold leading-snug text-ink" }, Q.text),
          h("div", { className: "mt-2.5 flex min-h-0 flex-1 flex-col gap-1.5" }, Q.options.map(([id, label]) => h("span", {
            key: id,
            className: `flex flex-1 items-center gap-2 rounded-lg border px-2 text-[0.9rem] leading-tight ${picked(id) ? "border-accent bg-accent-soft font-bold text-ink" : "border-line-strong bg-surface text-muted"}`,
            style: { maxHeight: 74 },
          }, picked(id) && h(IconCheck, { className: "h-4 w-4 shrink-0 text-accent", strokeWidth: 3 }), label)))),
        s.done && h("div", { className: "flex flex-1 flex-col items-center justify-center text-center" },
          h("span", { className: "flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-ink" }, h(IconCheck, { className: "h-9 w-9", strokeWidth: 3 })),
          h("p", { className: "mt-4 font-display text-2xl font-semibold text-ink" }, "All done"))));
  }

  function BubbleActor({ a }) {
    return h("div", { style: place(a, 4) },
      h("div", { className: "rounded-3xl rounded-bl-md border border-line-strong bg-surface px-6 py-4 shadow-sm" },
        h("p", { className: "text-[1.55rem] leading-snug text-ink" }, `"${a.text}"`),
        a.tags.length > 0 && h("p", { className: "mt-2 flex flex-wrap gap-2" }, a.tags.map((x) => h("span", { key: x, className: "inline-flex items-center gap-1 rounded-md border border-accent bg-accent-soft px-2 py-0.5 text-base font-bold text-ink" },
          h(IconCheck, { className: "h-4 w-4 text-accent", strokeWidth: 3 }), x)))));
  }

  function LabelActor({ a }) {
    const look = a.look ? RECORD_LOOK[a.look] : null;
    return h("p", { style: place(a, 2), className: `flex items-center gap-2 whitespace-nowrap font-bold ${a.big ? "text-xl text-ink" : a.tone === "muted" ? "text-lg text-muted" : "text-lg text-ink"}` },
      look && h("span", { className: `inline-flex h-5 w-5 items-center justify-center rounded border ${look.cell}` }, h(look.Icon, { className: "h-3.5 w-3.5", strokeWidth: 3 })),
      a.text);
  }

  function ProfileActor({ a }) {
    return h("div", { style: place(a, 4), className: "overflow-hidden rounded-3xl border-2 border-accent/40 bg-surface p-6 shadow-sm" },
      h("div", { className: "flex items-center gap-3" }, h(Allysa, { size: 56 }), h("p", { className: "font-display text-3xl font-semibold text-ink" }, "Allysa's profile")),
      h("dl", { className: "mt-5 grid grid-cols-[11.5rem_1fr] gap-x-4 gap-y-5" }, rows.map(([term, value], k) => {
        const o = clamp01(a.reveal - k);
        return [
          h("dt", { key: `${term}t`, className: "text-xl font-bold text-muted", style: { opacity: o } }, term),
          h("dd", { key: `${term}d`, className: "m-0 text-[1.3rem] leading-snug text-ink", style: { opacity: o } }, value),
        ];
      })));
  }

  function SafetyActor({ a }) {
    return h("div", { style: place(a, 4), className: "rounded-3xl border-2 border-accent/50 bg-surface p-10 text-center shadow-sm" },
      h("p", { className: "text-lg font-bold uppercase tracking-[0.08em] text-muted" }, "Before any matching"),
      h("p", { className: "mt-3 font-display text-5xl font-semibold text-ink" }, "Need help right now?"),
      h("p", { className: "mt-5 text-3xl leading-snug text-ink", style: { opacity: a.more } }, "Call Lifeline on ", h("span", { className: "font-bold" }, "13 11 14"), ", or ", h("span", { className: "font-bold" }, "000"), " in an emergency."),
      h("p", { className: "mt-5 text-xl text-muted", style: { opacity: a.more } }, "Urgent support comes first. Matching never overrides it."));
  }

  // Initials, or a face fading in over them: a stock photo, or Dr Con Fidence's cartoon.
  const Avatar = ({ t, size, face = 0 }) => h("span", {
    className: "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken font-bold text-ink",
    style: { width: size, height: size, fontSize: size * 0.36 },
  }, h("span", { style: { opacity: 1 - face } }, t.initials),
    face > 0.01 && t.photo && h("img", { src: t.photo, alt: "", draggable: false, className: "absolute inset-0 h-full w-full object-cover", style: { opacity: face } }),
    face > 0.01 && t.cartoon && h("span", { className: "absolute inset-0", style: { opacity: face } }, h(Vanessa, { size })));

  // One box per therapist that is a row, a tray card, a year card or a shortlist card. Layers fade as it changes.
  function TherapistActor({ a }) {
    const t = a.t;
    const shadow = [`0 0 0 4px rgb(var(--ink) / ${a.ring})`, `inset 0 0 0 2px rgb(var(--accent) / ${a.hl})`].join(", ");
    const size = a.avatar;
    return h("div", { style: { ...place(a, a.ring > 0.01 ? 7 : 3), opacity: a.o * (1 - 0.8 * a.dim) } },
      h("div", { className: "absolute inset-0 overflow-hidden rounded-2xl border border-line bg-surface", style: { boxShadow: shadow } },
        h("span", { className: "absolute inset-0 bg-accent-soft", style: { opacity: a.hl * 0.7 } }),
        h("div", { className: "absolute left-0 top-0 flex items-center gap-3 px-3", style: { height: size + 14 } },
          h(Avatar, { t, size, face: a.face }),
          a.nameO > 0.01 && h("span", { className: "min-w-0 leading-tight", style: { opacity: a.nameO } },
            h("span", { className: `block whitespace-nowrap font-bold text-ink ${a.big ? "text-[1.7rem]" : "text-xl"}` }, t.name),
            a.regO > 0.01 && h("span", { className: "block whitespace-nowrap text-base text-muted", style: { opacity: a.regO } }, t.registration))),
        a.barO > 0.01 && h("span", { className: "absolute top-1/2 h-3.5 -translate-y-1/2 overflow-hidden rounded-full bg-line", style: { left: a.barLeft, right: 16, opacity: a.barO } },
          h("span", { className: "absolute inset-y-0 left-0 rounded-full bg-accent", style: { width: `${a.bar * 100}%` } })),
        a.asideO > 0.01 && h("p", { className: "absolute inset-x-3 text-base leading-snug text-ink", style: { top: size + 14, opacity: a.asideO } },
          h(IconCross, { className: "-mt-0.5 mr-1 inline h-4 w-4 text-ochre", strokeWidth: 3 }), a.r.excluded.map((e) => e.reason).join(" ")),
        a.slotsO > 0.01 && h(Slots, { a }),
        a.cardO > 0.01 && h(CardLayer, { a }),
        a.maskO > 0.01 && h("div", { className: "absolute inset-0 flex items-center justify-center bg-sunken font-display font-semibold text-muted", style: { opacity: a.maskO, fontSize: 130 } }, "?")));
  }

  const SHORT_LABEL = { helped: "Helped", same: "No change", worse: "Got worse" };
  function Slots({ a }) {
    const prof = atWeek(Math.max(0, Math.min(YEAR, Math.floor(a.week))));
    return h("div", { className: "absolute inset-x-2 bottom-2 grid grid-cols-3 gap-1.5", style: { top: 62, opacity: a.slotsO } }, mine.map((area) => {
      const rec = prof.record(a.t.id, area);
      const look = rec.people ? recordLook(rec) : RECORD_LOOK.nobody;
      const lists = a.t.focus_areas.indexOf(area) !== -1;
      const settled = rec.label !== "not_enough";
      const spot = a.spot === area ? a.spotO : 0;
      const faded = settled ? 1 : 1 - 0.6 * a.slotFocus;
      const counts = [["better", IconUp, "text-accent", "bg-accent"], ["same", IconMinus, "text-muted", "bg-muted"], ["worse", IconDown, "text-ochre", "bg-ochre"]];
      return h("div", { key: area, className: "flex min-w-0 flex-col rounded-lg bg-sunken/70 px-1.5 py-1.5", style: { opacity: faded, boxShadow: `0 0 0 3px rgb(var(--ink) / ${spot})` } },
        h("p", { className: "flex items-center gap-1 text-sm font-bold leading-tight text-ink" },
          lists && h("span", { className: "inline-block h-2 w-2 shrink-0 rounded-full bg-ink/70" }), short(area)),
        h("div", { className: "mt-1.5 flex min-h-0 flex-1 flex-col justify-evenly gap-1" }, counts.map(([k, Icon, tone, fill]) =>
          h("div", { key: k, className: "flex min-w-0 items-start gap-0.5" },
            h(Icon, { className: `h-3.5 w-3.5 shrink-0 ${tone}`, strokeWidth: 3 }),
            h("span", { className: "flex min-w-0 flex-wrap gap-[2px] pt-0.5" }, Array.from({ length: rec[k] }, (_, n) => h("span", { key: n, className: `shrink-0 rounded-full ${fill}`, style: { width: 7, height: 7 } })))))),
        h("p", { className: `mt-1 flex items-center justify-center gap-0.5 whitespace-nowrap rounded-md border px-0.5 py-0.5 text-center text-[0.8rem] font-bold leading-tight ${look.cell}` },
          look.Icon && h(look.Icon, { className: "h-3 w-3 shrink-0", strokeWidth: 3 }),
          settled ? SHORT_LABEL[rec.label] : rec.people ? `${rec.people} of ${MIN_PEOPLE}` : "None yet"));
    }));
  }

  function CardLayer({ a }) {
    const { fits, miss } = reasons(a.r);
    return h("div", { className: "absolute inset-x-4 bottom-3 overflow-hidden", style: { top: a.avatar + 22, opacity: a.cardO } },
      h("p", { className: "text-base font-bold uppercase tracking-[0.08em] text-muted" }, "Why they might fit"),
      h("ul", { className: "mt-1.5 space-y-1.5" }, fits.slice(0, 3).map((x) => h("li", { key: x, className: "flex gap-2 text-[1.4rem] leading-snug text-ink" },
        h(IconCheck, { className: "mt-1 h-6 w-6 shrink-0 text-accent", strokeWidth: 3 }), x))),
      miss && h("p", { className: "mt-5 text-base font-bold uppercase tracking-[0.08em] text-muted" }, "Worth knowing"),
      miss && h("p", { className: "mt-1 flex gap-2 text-[1.4rem] leading-snug text-muted" }, h(IconMinus, { className: "mt-1 h-6 w-6 shrink-0", strokeWidth: 3 }), miss),
      h("p", { className: "mt-5" }, h(DemoBadge)));
  }

  function PaperActor({ a }) {
    const row = (k) => ({ opacity: clamp01(a.reveal - k) });
    return h("div", { style: place(a, 4), className: "rounded-3xl border border-line bg-surface p-7 shadow-sm" },
      h("p", { className: "text-base font-bold uppercase tracking-[0.08em] text-muted" }, "What she says about herself"),
      h("p", { className: "mt-2 font-display text-[2rem] font-semibold leading-tight text-ink" }, "\"I am brilliant at all of it.\""),
      h("p", { className: "mt-5 flex items-center gap-2 text-xl font-bold text-ink", style: row(1) }, h(IconCheck, { className: "h-6 w-6 text-accent", strokeWidth: 3 }), "Trained in CBT"),
      h("div", { style: row(2) },
        h("p", { className: "mt-5 text-xl font-bold text-ink" }, `Lists all ${REC.areaIds().length} areas`),
        h("div", { className: "mt-2 flex flex-wrap gap-1.5" }, REC.areaIds().map((x) => h("span", { key: x, className: "rounded-md border border-line-strong bg-sunken px-2 py-0.5 text-base font-bold text-ink" }, short(x))))),
      h("div", { style: row(3) },
        h("p", { className: "mt-6 text-base font-bold uppercase tracking-[0.08em] text-muted" }, "What her patients report"),
        h("p", { className: "mt-1 font-display text-[2rem] font-semibold text-muted" }, "We don't know yet")));
  }

  function FormActor({ a }) {
    const v = Math.round(a.sel);
    const Scale = ({ legend, options }) => h("div", { className: "mt-5" },
      h("p", { className: "text-xl font-bold leading-snug text-ink" }, legend),
      h("div", { className: "mt-2.5 grid grid-cols-5 gap-2" }, options.map((label, k) =>
        h("span", { key: k, className: `flex min-h-[3.4rem] items-center justify-center rounded-lg border px-1 text-center text-base leading-tight ${k === v ? "border-accent bg-accent-soft font-bold text-ink shadow-[inset_0_0_0_1px_rgb(var(--accent))]" : "border-line-strong bg-surface text-muted"}` }, label))));
    return h("div", { style: place(a, 4), className: "rounded-3xl border-2 border-accent/40 bg-surface p-8 shadow-sm" },
      h("p", { className: "text-base font-bold uppercase tracking-[0.08em] text-muted" }, "A short check-in, every couple of sessions"),
      h(Scale, { legend: CI.area.text("anxiety"), options: CI.area.options }),
      h("div", { style: { opacity: a.more } },
        h(Scale, { legend: CI.overall.text, options: CI.overall.options }),
        h("p", { className: "mt-6 text-lg text-muted" }, "The same questions every time. Nobody is asked to rate their therapist.")));
  }

  function CounterActor({ a }) {
    const w = Math.max(0, Math.min(YEAR, Math.floor(a.week)));
    return h("div", { style: place(a, 8), className: "flex flex-col items-end justify-center" },
      h("p", { className: "text-xl font-bold leading-tight text-ink" }, w >= YEAR ? "One year" : `Week ${w}`, h("span", { className: "font-normal text-muted" }, ` · ${REC.people(atWeek(w).counted)}`)),
      h("p", { className: "text-sm text-muted" }, "Each dot is one person. Synthetic data."));
  }

  function CalloutActor({ a }) {
    const look = RECORD_LOOK[vanessaAnxiety.label];
    return h("div", { style: place(a, 9), className: "rounded-2xl border-[3px] border-ink bg-surface p-5 shadow-xl" },
      h("p", { className: "font-display text-2xl font-semibold text-ink" }, "Dr Con Fidence · Anxiety"),
      h("p", { className: "mt-3 text-sm font-bold uppercase tracking-[0.08em] text-muted" }, "Says"),
      h("p", { className: "mt-0.5 flex items-center gap-2 text-xl text-ink" }, h("span", { className: "inline-block h-3 w-3 shrink-0 rounded-full bg-ink/70" }), "Lists anxiety"),
      h("div", { style: { opacity: clamp01(a.reveal) } },
        h("p", { className: "mt-3 text-sm font-bold uppercase tracking-[0.08em] text-muted" }, "Patients report"),
        h("p", { className: `mt-1 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xl font-bold ${look.cell}` },
          h(look.Icon, { className: "h-5 w-5", strokeWidth: 3 }), `${REC.LABELS[vanessaAnxiety.label]} · ${REC.people(vanessaAnxiety.people)}`)));
  }

  function TrayActor({ a }) {
    return h("div", { style: place(a, 1), className: "rounded-2xl border-2 border-dashed border-line-strong bg-sunken/50" },
      h("p", { className: "px-4 pt-2.5 text-lg font-bold text-muted" }, a.text));
  }

  function CutActor({ a }) {
    return h("div", { style: place(a, 2), className: "flex items-center gap-2" },
      h("span", { className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-0.5 text-base font-bold text-accent-ink" }, h(IconUp, { className: "h-4 w-4", strokeWidth: 3 }), "Shortlist"),
      h("span", { className: "h-0 flex-1 border-t-2 border-dashed border-accent" }));
  }

  // Her own check-in: what she sees, and the dot it adds for the next person.
  function LoopActor({ a }) {
    const row = (k) => ({ opacity: clamp01(a.reveal - k), transform: `translateY(${(1 - clamp01(a.reveal - k)) * 10}px)` });
    const maya = firstName(after.shortlist[0].therapist);
    return h("div", { style: place(a, 4), className: "flex flex-col gap-4" },
      h("div", { style: row(0), className: "rounded-3xl border-2 border-accent/40 bg-surface p-5 shadow-sm" },
        h("p", { className: "flex items-center gap-2.5 text-base font-bold uppercase tracking-[0.08em] text-muted" }, h(Allysa, { size: 38 }), "Allysa checks in"),
        h("p", { className: "mt-2 text-xl font-bold text-ink" }, CI.overall.text),
        h("div", { className: "mt-2 grid grid-cols-5 gap-1.5" }, CI.overall.options.map((label, k) =>
          h("span", { key: k, className: `flex min-h-[2.8rem] items-center justify-center rounded-lg border px-1 text-center text-base leading-tight ${k === 1 ? "border-accent bg-accent-soft font-bold text-ink" : "border-line-strong text-muted"}` }, label)))),
      h("div", { style: row(1), className: "rounded-3xl border border-accent/40 bg-surface p-5 shadow-sm" },
        h("p", { className: "text-base font-bold uppercase tracking-[0.08em] text-muted" }, "What she sees, later (an example)"),
        h("p", { className: "mt-1 text-xl text-ink" }, h("span", { className: "font-bold" }, "Since you started: "), mine.map((x) => `${short(x)}: better`).join(" · "))),
      h("div", { style: row(2), className: "rounded-3xl border border-dashed border-line-strong bg-sunken/60 p-5" },
        h("p", { className: "text-xl leading-snug text-ink" }, `Behind the scenes, it adds to ${maya}'s profile, for the next person.`)));
  }

  function DotActor({ a }) {
    return h("span", { style: { ...place(a, 10), borderRadius: "50%" }, className: "bg-accent ring-4 ring-accent/30" });
  }

  function NoteActor({ a }) {
    return h("div", { style: place(a, 4), className: "flex flex-col items-center text-center" },
      h("img", { src: "../Explainer/img/logo.svg", alt: "", style: { width: 96, height: 96 } }),
      h("p", { className: "mt-4 font-display text-6xl font-semibold tracking-tight text-ink" }, "A prototype"),
      h("ul", { className: "mt-8 space-y-3 text-3xl leading-snug text-ink" }, a.lines.map((x, k) => h("li", { key: x, style: { opacity: clamp01(a.reveal - k) } }, x))));
  }

  // A numbered step, or one side of the loop.
  function TileActor({ a }) {
    return h("div", { style: place(a, 4), className: "flex flex-col items-center justify-center rounded-3xl border border-line bg-surface p-6 text-center shadow-sm" },
      a.num && h("span", { className: "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-3xl font-semibold text-accent-ink" }, a.num),
      h("p", { className: "font-display text-[1.9rem] font-semibold leading-tight text-ink" }, a.title),
      h("p", { className: "mt-3 text-xl leading-snug text-muted" }, a.sub));
  }

  // The skit's two chairs, with a different person in the second one.
  function ChairsActor({ a }) {
    const Chair = ({ flip }) => h("svg", { viewBox: "0 0 120 150", width: 170, height: 212, className: "block", style: { transform: flip ? "scaleX(-1)" : undefined } },
      h("path", { d: "M26 10 V88 M26 88 H94 M34 88 V142 M88 88 V142", fill: "none", stroke: "rgb(var(--line-strong))", strokeWidth: 9, strokeLinecap: "round" }));
    const maya = after.shortlist[0].therapist;
    const skit = a.who === "vanessa";
    const Seat = ({ name, flip, children }) => h("div", { className: "flex w-60 flex-col items-center" },
      h("div", { className: "relative z-10 mb-[-90px]" }, children),
      h(Chair, { flip }),
      h("p", { className: "mt-3 font-display text-3xl font-semibold text-ink" }, name));
    return h("div", { style: place(a, 4), className: "flex flex-col items-center" },
      h("div", { className: "flex items-end gap-16" },
        h(Seat, { name: "Allysa" }, h(Allysa, { size: 150 })),
        h(Seat, { name: skit ? "Dr Con Fidence" : firstName(maya), flip: true }, skit ? h(Vanessa, { size: 150 }) : h("span", { className: "block overflow-hidden rounded-full border border-line-strong", style: { width: 150, height: 150 } }, h("img", { src: maya.photo, alt: "", className: "h-full w-full object-cover" })))),
      h("p", { className: "mt-6 font-display text-5xl font-semibold tracking-tight text-ink" }, a.line));
  }

  const ACTORS = {
    splash: SplashActor, head: HeadActor, pill: PillActor, allysa: AllysaActor, phone: PhoneActor, bubble: BubbleActor, label: LabelActor,
    profile: ProfileActor, safety: SafetyActor, therapist: TherapistActor, paper: PaperActor, form: FormActor, counter: CounterActor,
    callout: CalloutActor, tray: TrayActor, cut: CutActor, loop: LoopActor, dot: DotActor, note: NoteActor, chairs: ChairsActor, tile: TileActor,
  };

  /* ---------------- layouts ---------------- */
  const tkey = (t) => `t-${t.id}`;
  const TB = { kind: "therapist", o: 1, dim: 0, ring: 0, hl: 0, avatar: 46, face: 0, nameO: 0, regO: 0, big: false, bar: 0, barO: 0, barLeft: 84, asideO: 0, slotsO: 0, week: 0, slotFocus: 0, spotO: 0, cardO: 0, maskO: 0 };
  const PAD = 40;
  const TOP = 84;
  const head = (text, step, x = PAD) => ({ [`head-${text}`]: { kind: "head", x, y: 20, w: 820, h: 50, text, step } });
  const pill = () => ({ pill: { kind: "pill", x: W - PAD - 340, y: 22, w: 340, h: 48 } });
  const resultOf = (trace, t) => trace.results.find((r) => r.id === t.id);

  // Rows with an optional cut-off line. named: show who they are (hidden until the reveal).
  const LIST = { x: PAD, w: 770, trayX: PAD + 770 + 30, trayW: W - 2 * PAD - 770 - 30 };
  function stack(items, opts = {}) {
    const out = {};
    let y = TOP;
    let count = 0;
    items.forEach((it) => {
      if (it.label) {
        out[`label-${it.label}`] = { kind: "label", x: LIST.x, y: y + 3, w: LIST.w, h: 30, text: it.label, look: it.look };
        y += 34;
        return;
      }
      const r = it.r;
      out[tkey(r.therapist)] = { ...TB, x: LIST.x, y, w: LIST.w, h: 62, t: r.therapist, r, face: opts.named && r.therapist.cartoon ? 1 : 0, nameO: opts.named ? 1 : 0, barLeft: opts.named ? 300 : 84, ...(opts.each ? opts.each(r) : {}) };
      y += 69;
      count += 1;
      if (opts.cutAfter === count) {
        out.cut = { kind: "cut", x: LIST.x, y: y - 1, w: LIST.w, h: 26, enter: { w: 0 } };
        y += 30;
      }
    });
    return out;
  }
  function tray(outs, text, slots = outs.length) {
    const out = { tray: { kind: "tray", x: LIST.trayX, y: TOP, w: LIST.trayW, h: 40 + slots * 136, text } };
    outs.forEach((r, k) => {
      out[tkey(r.therapist)] = { ...TB, t: r.therapist, r, x: LIST.trayX + 10, y: TOP + 38 + k * 136, w: LIST.trayW - 20, h: 128, avatar: 40, face: r.therapist.cartoon ? 1 : 0, nameO: 1, asideO: 1 };
    });
    return out;
  }
  const scoreBar = (r) => (r.max ? r.score / r.max : 0);

  const firstOuts = first.results.filter((r) => r.excluded.length);
  const firstIns = first.results.filter((r) => !r.excluded.length);
  const afterOuts = after.results.filter((r) => r.excluded.length);
  const afterIns = after.results.filter((r) => !r.excluded.length);
  const inT = (rs) => rs.slice().sort((a, b) => T.indexOf(a.therapist) - T.indexOf(b.therapist));
  const TRAINED = "Trained in CBT, with research support for anxiety";
  function groupedFirst(sortWithin) {
    const items = [];
    const orders = [...new Set(firstIns.map((r) => r.group.order))].sort((a, b) => a - b);
    orders.forEach((o, k) => {
      const members = firstIns.filter((r) => r.group.order === o);
      items.push({ label: k === 0 ? TRAINED : "Everyone else" });
      (sortWithin ? members : inT(members)).forEach((r) => items.push({ r }));
    });
    return items;
  }
  const itemsAfter = () => {
    const items = [];
    const orders = [...new Set(afterIns.map((r) => r.group.order))].sort((a, b) => a - b);
    orders.forEach((o) => {
      const members = afterIns.filter((r) => r.group.order === o);
      items.push({ label: members[0].group.label, look: members[0].group.label.startsWith("Helped") ? "helped" : null });
      members.forEach((r) => items.push({ r }));
    });
    return items;
  };

  function cards(trace, each, opts = {}) {
    const n = trace.shortlist.length;
    const gap = 16;
    const cw = (W - 2 * PAD - (n - 1) * gap) / n;
    const out = {};
    trace.shortlist.forEach((r, k) => {
      if (opts.only && opts.only.indexOf(r.id) === -1) return;
      out[tkey(r.therapist)] = { ...TB, t: r.therapist, r, x: PAD + k * (cw + gap), y: TOP + 6, w: cw, h: opts.h || 520, avatar: 72, nameO: 1, regO: 1, big: false, cardO: 1, ...(each ? each(r) : {}) };
    });
    return out;
  }

  function yearGrid(props, each) {
    const gap = 12;
    const cols = 4;
    const cw = (W - 2 * PAD - (cols - 1) * gap) / cols;
    const ch = (H - TOP - 42 - gap) / 2;
    const out = {};
    T.forEach((t, k) => {
      const x = PAD + (k % cols) * (cw + gap);
      const y = TOP + Math.floor(k / cols) * (ch + gap);
      out[tkey(t)] = { ...TB, t, x, y, w: cw, h: ch, r: resultOf(after, t), avatar: 40, face: t.cartoon ? 1 : 0, nameO: 1, slotsO: 1, ...props, ...(each ? each(t) : {}), enter: { y: y + 12 } };
    });
    return out;
  }
  const counter = (week, extra) => ({ counter: { kind: "counter", x: 420, y: 18, w: 460, h: 54, week, ...extra } });

  /* ---------------- the steps: one new thing at a time ---------------- */
  // Words are the script's, cut where the screen changes. A step lasts about as long as saying its words (150 words
  // a minute), and presenter mode ignores that and waits for a click.
  const CHAPTERS = ["Last time", "Take two", "Four steps", "Look who's back", "Checking in", "A better shortlist", "A first session that fits"].map((title) => ({ title }));
  const phone = (at, extra) => ({ phone: { kind: "phone", x: 60, y: 26, w: 300, h: 640, at, ...extra } });
  const bubble = (id, y, text, tags) => ({ [`bubble-${id}`]: { kind: "bubble", x: 410, y, w: 760, h: 130, text, tags, enter: { y: y + 16 } } });
  const BUBBLES = [
    ["anxiety", 120, "I've been feeling really anxious lately...", ["Anxiety"]],
    ["uni", 270, "It's more about uni...", ["Study"]],
    ["family", 420, "...and my family, and I—", ["Family"]],
  ];
  const bubbles = (n) => Object.assign({}, ...BUBBLES.slice(0, n).map(([id, y, text, tags]) => bubble(id, y, text, tags)));
  const profileAt = (reveal) => ({ profile: { kind: "profile", x: 400, y: 110, w: 840, h: 480, reveal, enter: { reveal: reveal - 1, y: 124 } } });
  const asking = (at, reveal) => ({ ...head("Now, what matters to her", null, 410), ...pill(), ...phone(at, { linear: true }), ...profileAt(reveal) });
  const safety = (more) => ({ ...head("Safety comes first", "1"), ...pill(), safety: { kind: "safety", x: 170, y: 170, w: 940, h: 370, more, enter: { y: 186 } } });
  const STEP_NAMES = [["Safety first", "Before any matching"], ["Filters", "Session format and must-haves"], ["Expertise and training", "Research-backed approach first"], ["Personal preferences", "Her preferences set the order"]];
  const WANTS = "Allysa wants in-person sessions";
  const filterTray = (n) => (n ? tray(firstOuts.slice(0, n), WANTS, firstOuts.length) : { tray: { kind: "tray", x: LIST.trayX, y: TOP, w: LIST.trayW, h: 40 + firstOuts.length * 136, text: WANTS } });
  const stillIn = (n) => inT(first.results.filter((r) => firstOuts.slice(0, n).indexOf(r) === -1)).map((r) => ({ r }));
  const filtering = (n) => ({ ...head("Filters", "2"), ...pill(), ...stack(stillIn(n)), ...filterTray(n) });
  const inTray = tray(firstOuts, WANTS);
  const trained = (r) => r.group && r.group.order === 0;
  const others = first.shortlist.filter((r) => r.id !== VANESSA);
  const named = (r) => firstName(r.therapist);
  const paper = (reveal) => ({
    ...head("On paper, she looks great"), ...pill(),
    [tkey(vanessa)]: { ...TB, t: vanessa, r: resultOf(first, vanessa), x: PAD, y: TOP + 6, w: 400, h: 520, avatar: 72, face: 1, big: true, nameO: 1, regO: 1, cardO: 1 },
    paper: { kind: "paper", x: PAD + 420, y: TOP + 6, w: 780, h: 520, reveal, enter: { x: PAD + 450 } },
  });
  const form = (more, sel, extra) => ({ ...head("Then, as therapy goes on"), ...pill(), form: { kind: "form", x: 170, y: 120, w: 940, h: 470, more, sel, ...extra } });
  const callout = (reveal) => {
    const c = yearGrid({ week: YEAR })[tkey(vanessa)];
    return { callout: { kind: "callout", x: c.x - 400, y: c.y + 30, w: 380, h: 220, reveal, enter: { y: c.y + 42 } } };
  };
  const spotlight = (area, reveal) => ({
    ...head("What she says, what patients report"), ...pill(),
    ...yearGrid({ week: YEAR }, (t) => (t === vanessa ? { ring: 1, spot: area, spotO: 1, face: 1 } : { dim: 1 })),
    ...callout(reveal),
  });
  const onFormat = afterOuts.filter((r) => r.excluded.some((e) => e.question === "q19"));
  const harmed = afterOuts.filter((r) => r.id !== VANESSA && onFormat.indexOf(r) === -1);
  const setAside = (outs) => ({
    ...head("Matching again, with check-ins"), ...pill(),
    ...stack(inT(after.results.filter((r) => outs.indexOf(r) === -1)).map((r) => ({ r })), { named: true }),
    ...tray(outs, "Set aside for Allysa", afterOuts.length),
  });
  const maya = after.shortlist[0].therapist;
  const lastCards = (n) => cards(after, () => ({ face: 1 }), { only: after.shortlist.slice(0, n).map((r) => r.id) });
  const mayaCard = { ...lastCards(1)[tkey(maya)], ring: 1 };
  const loop = (reveal, dot) => ({
    ...head("And it helps the next person"), ...pill(), [tkey(maya)]: mayaCard,
    loop: { kind: "loop", x: mayaCard.x + mayaCard.w + 28, y: TOP + 6, w: W - PAD - mayaCard.x - mayaCard.w - 28, h: 520, reveal, enter: { reveal: reveal - 1 } },
    ...(dot ? { dot: { kind: "dot", x: mayaCard.x + mayaCard.w - 44, y: mayaCard.y + 26, w: 18, h: 18, d: 0.3, enter: { x: mayaCard.x + mayaCard.w + 80, y: mayaCard.y + 400 } } } : {}),
  });
  const NOTE_LINES = ["The therapists are made up.", "So are the check-ins.", "Not yet validated against real clinical outcomes."];
  const note = (reveal) => ({ note: { kind: "note", x: 140, y: 110, w: 1000, h: 500, lines: NOTE_LINES, reveal, enter: { y: 124 } } });
  const splash = (line) => ({ [`splash-${line || "logo"}`]: { kind: "splash", x: 0, y: 0, w: W, h: H - 40, line } });
  const skitChairs = (line) => ({ "chairs-skit": { kind: "chairs", x: 140, y: 40, w: 1000, h: 620, who: "vanessa", line } });
  const fitChairs = (line) => ({ "chairs-fit": { kind: "chairs", x: 140, y: 40, w: 1000, h: 620, line, enter: { y: 58 } } });

  const seconds = (text) => text.split(/\s+/).length * 0.4;
  // chapter, words, seconds of movement, what's on stage. skit: told by the actors live, so presenter mode starts after it.
  const STEPS = [
    [0, "Allysa went to her first therapy session.", 0, () => skitChairs("Her first session"), { skit: true }],
    [0, "Dr Con Fidence: \"I am brilliant at all of it.\"", 0.3, () => skitChairs("\"I am brilliant at all of it.\""), { skit: true }],
    [0, "Allysa tried to explain, and kept getting cut off.", 0.3, () => skitChairs("\"It's more about uni, and my family, and I—\""), { skit: true }],
    [0, "\"I don't think I'll be back.\"", 0.3, () => skitChairs("\"I don't think I'll be back.\""), { skit: true }],

    [1, "To address this gap, we developed Thera-Fits, a prototype designed to help young people find therapists who better match their individual needs and preferences.", 1, () => splash()],
    [1, "So let's give Allysa another try.", 1, () => ({ allysa: { kind: "allysa", x: 490, y: 190, w: 300, h: 300 } })],
    [1, "It begins with simple questions.", 1, () => ({ allysa: { kind: "allysa", x: 610, y: 190, w: 300, h: 300 }, ...phone(0, { enter: { x: 20 } }) })],
    [1, "Last time, she never got to finish her sentence.", 0.7, () => ({ ...head("Last time, she never got to finish", null, 410), ...pill(), ...phone(1) })],
    [1, "This time, she does. Anxiety.", 1, () => ({ ...head("Last time, she never got to finish", null, 410), ...pill(), ...phone(1.3, { linear: true }), ...bubbles(1) })],
    [1, "Uni.", 0.8, () => ({ ...head("Last time, she never got to finish", null, 410), ...pill(), ...phone(1.55, { linear: true }), ...bubbles(2) })],
    [1, "And her family.", 0.8, () => ({ ...head("Last time, she never got to finish", null, 410), ...pill(), ...phone(1.8, { linear: true }), ...bubbles(3) })],
    [1, "Then, what matters to her in a therapist,", 2.2, () => asking(2.98, 2)],
    [1, "how she'd like them to talk with her,", 1.6, () => asking(3.98, 3)],
    [1, "how she'd like to see them,", 1.4, () => asking(4.98, 4)],
    [1, "and what's practical for her.", 1.8, () => asking(5.98, 5)],
    [1, "Allysa: \"Okay, I've completed the questions!\"", 0.6, () => asking(6.5, 5), { sr: `Allysa's profile: ${rows.map(([t, v]) => `${t}: ${v}`).join("; ")}.` }],

    [2, "But how does the system actually determine a match? There are four main steps.", 1.4, () => Object.assign({}, ...STEP_NAMES.map(([title, sub], k) => ({ [`tile-${k}`]: { kind: "tile", num: String(k + 1), title, sub, x: PAD + k * 306.7, y: 180, w: 280, h: 320, d: k * 0.12, enter: { y: 200 } } })))],
    [2, "First, safety comes first.", 0.8, () => safety(0)],
    [2, "If someone indicates that they need urgent support, they are directed towards an appropriate safety pathway rather than continuing with the matching process.", 0.8, () => safety(1), { sr: "Need help right now? Call Lifeline on 13 11 14, or 000 in an emergency." }],
    [2, "Second, the system filters therapists based on essential requirements,", 1.2, () => ({ ...head("Filters", "2"), ...pill(), ...stack(stillIn(0), { each: (r) => ({ d: T.indexOf(r.therapist) * 0.04 }) }) }), { sr: "All eight therapists, not named yet." }],
    [2, "such as session format. Allysa wants in-person sessions,", 0.8, () => filtering(0)],
    [2, `so ${named(firstOuts[0])} is set aside,`, 1.1, () => filtering(1)],
    [2, `and so is ${named(firstOuts[1])}.`, 1.1, () => filtering(2)],
    [2, "Third, it considers relevant expertise and training.", 0.8, () => ({ ...head("Expertise and training", "3"), ...pill(), ...stack(stillIn(2), { each: (r) => ({ hl: trained(r) ? 1 : 0 }) }), ...inTray })],
    [2, "For example, therapists with CBT training are prioritised for someone seeking support with anxiety.", 1.3, () => ({ ...head("Expertise and training", "3"), ...pill(), ...stack(groupedFirst(false), { each: (r) => ({ hl: trained(r) ? 1 : 0 }) }), ...inTray })],
    [2, "Finally, personal preferences", 1.2, () => ({ ...head("Personal preferences", "4"), ...pill(), ...stack(groupedFirst(false), { each: (r) => ({ barO: 1, bar: scoreBar(r) }) }), ...inTray })],
    [2, "help rank the remaining therapists,", 1.2, () => ({ ...head("Personal preferences", "4"), ...pill(), ...stack(groupedFirst(true), { each: (r) => ({ barO: 1, bar: scoreBar(r) }) }), ...inTray })],
    [2, "and the top three make her shortlist.", 1, () => ({ ...head("Personal preferences", "4"), ...pill(), ...stack(groupedFirst(true), { cutAfter: first.shortlist.length, each: (r) => ({ barO: 1, bar: scoreBar(r), hl: r.shortlisted ? 1 : 0 }) }), ...inTray })],

    [3, "Allysa: \"Now I have a shortlist of three therapists!\"", 1.2, () => ({ ...head("Allysa's shortlist"), ...pill(), ...cards(first, () => ({ maskO: 1 })) }), { sr: "Three hidden cards." }],
    [3, `Allysa: "${named(others[0])}..."`, 0.6, () => ({ ...head("Allysa's shortlist"), ...pill(), ...cards(first, (r) => ({ maskO: r.id === others[0].id ? 0 : 1 })) })],
    [3, `Allysa: "${named(others[1])}... and..."`, 0.6, () => ({ ...head("Allysa's shortlist"), ...pill(), ...cards(first, (r) => ({ maskO: r.id === VANESSA ? 1 : 0 })) })],
    [3, "Look who's back.", 0.9, () => ({ ...head("Allysa's shortlist"), ...pill(), ...cards(first, (r) => (r.id === VANESSA ? { face: 1, ring: 1, big: true } : { dim: 0.75 })) }), { extra: 4, sr: "The last card is Dr Con Fidence, the therapist from the skit." }],
    [3, "On paper, Dr Con Fidence looks great.", 1.2, () => paper(0)],
    [3, "She's trained in CBT,", 0.6, () => paper(1)],
    [3, "and she lists all nine areas.", 0.6, () => paper(2)],
    [3, "But what therapists say about themselves may not reflect how their patients actually do. So Thera-Fits doesn't stop at the first match.", 0.8, () => paper(3)],

    [4, "As therapy continues, young people could complete short check-ins about their progress.", 1.2, () => form(0, 3, { enter: { y: 136 } }), { sr: "A short check-in form." }],
    [4, "Nobody rates their therapist.", 0.8, () => form(1, 3)],
    [4, "They just answer the same few questions.", 1.4, () => form(1, 1, { linear: true })],
    [4, "Here's a simulated year of those check-ins.", 1.1, () => ({ ...head("A year of check-ins"), ...pill(), ...yearGrid({ week: 0 }, (t) => ({ d: T.indexOf(t) * 0.03 })), ...counter(0) }), { sr: "Each therapist's card, with space for anxiety, study and family, empty so far." }],
    [4, "Each dot is one person.", 8, () => ({ ...head("A year of check-ins"), ...pill(), ...yearGrid({ week: YEAR, linear: true }), ...counter(YEAR, { linear: true }) }), { stretch: true, sr: `A year goes by. ${REC.people(profile.counted)} are counted.` }],
    [4, "Over time, this shows what each therapist actually helps with, area by area.", 0.8, () => ({ ...head("A year of check-ins"), ...pill(), ...yearGrid({ week: YEAR, slotFocus: 1 }), ...counter(YEAR) })],
    [4, "Dr Con Fidence lists anxiety.", 1, () => spotlight("anxiety", 0)],
    [4, "But in this simulated data, her patients with anxiety got worse,", 0.7, () => spotlight("anxiety", 1), { sr: `Patients report: ${REC.LABELS[vanessaAnxiety.label]}, ${REC.people(vanessaAnxiety.people)}.` }],
    [4, "even though people she saw about study got better.", 0.7, () => spotlight("study", 1)],

    [5, "So Thera-Fits stops recommending her for anxiety.", 1.6, () => setAside([...onFormat, after.results.find((r) => r.id === VANESSA)])],
    [5, `For the same reason, ${named(harmed[0])} is set aside for family.`, 1.2, () => setAside([...onFormat, after.results.find((r) => r.id === VANESSA), ...harmed])],
    [5, "And Allysa's shortlist changes.", 1.6, () => ({ ...head("Matching again, with check-ins"), ...pill(), ...stack(itemsAfter(), { named: true, cutAfter: after.shortlist.length, each: (r) => ({ barO: 1, bar: scoreBar(r), hl: r.shortlisted ? 1 : 0 }) }), ...tray([...onFormat, after.results.find((r) => r.id === VANESSA), ...harmed], "Set aside for Allysa") }), { sr: `New shortlist: ${after.shortlist.map((r) => r.therapist.name).join(", ")}.` }],
    [5, "Now she can compare three therapists,", 1.2, () => ({ ...head("What Allysa sees now"), ...pill(), ...lastCards(1) })],
    [5, "see why each one might fit,", 0.8, () => ({ ...head("What Allysa sees now"), ...pill(), ...lastCards(2) })],
    [5, "and make a more informed decision about who she'd feel comfortable working with.", 0.8, () => ({ ...head("What Allysa sees now"), ...pill(), ...lastCards(3) })],
    [5, "Allysa: \"That's more like it.\"", 0.6, () => ({ ...head("What Allysa sees now"), ...pill(), ...lastCards(3), ...bubble("better", 530, "That's more like it.", []) })],
    [5, "Once Allysa starts therapy, she checks in too.", 1.2, () => loop(1)],
    [5, "She sees her own progress.", 0.7, () => loop(2)],
    [5, "And her check-ins help the next person.", 1.2, () => loop(3, true), { sr: `It adds to ${firstName(maya)}'s profile, for the next person.` }],
    [5, "Ultimately, Thera-Fits aims to learn from both sides: what young people need and what helps them.", 1.2, () => ({
      ...head("Learning from both sides"), ...pill(),
      "tile-need": { kind: "tile", title: "What young people need", sub: "Their answers", x: 150, y: 200, w: 470, h: 280, enter: { x: 120 } },
      "tile-help": { kind: "tile", title: "What helps them", sub: "Their check-ins", x: 660, y: 200, w: 470, h: 280, d: 0.2, enter: { x: 690 } },
    })],

    [6, "However, it's important to acknowledge that Thera-Fits is currently a prototype.", 1, () => note(0)],
    [6, "The therapists you've seen are made up.", 0.6, () => note(1)],
    [6, "So are the check-ins.", 0.6, () => note(2)],
    [6, "And its matching rules and effectiveness have not yet been validated against real clinical outcomes.", 0.6, () => note(3)],
    [6, "Ultimately, our project began with a simple question: how can we help young people feel understood when seeking mental health support?", 1, () => splash("How can we help young people feel understood?")],
    [6, "Thera-Fits doesn't claim to solve every barrier to mental health care.", 0.7, () => splash("It doesn't solve every barrier")],
    [6, "Instead, it focuses on one important part of the journey: finding a better first match.", 0.7, () => splash("It looks for a better first match")],
    [6, "Because Allysa deserved a first session that fit her.", 1.4, () => fitChairs("A first session that fits."), { sr: `Two chairs: Allysa, and ${firstName(maya)}.` }],
    [6, "Allysa: \"I think I'll be back.\"", 0.3, () => fitChairs("\"I think I'll be back.\"")],
    [6, "And with Thera-Fits, we're working towards helping the next young person find one.", 0.9, () => splash("Helping the next young person")],
    [6, "Thank you!", 0.7, () => splash("Thank you")],
  ];
  let cueCount = -1;
  const BEATS = STEPS.map(([chapter, caption, anim, frame, more = {}]) => {
    if (!more.skit) cueCount += 1;
    return { chapter, caption, anim, frame, ...more, cue: more.skit ? null : cueCount, hold: Math.max(more.extra || 0.3, seconds(caption) - anim) };
  });
  const LAST_CUE = cueCount;
  const FIRST_CUE_STEP = BEATS.findIndex((b) => b.cue === 0);
  const beatFrames = {};
  const beatFrame = (i) => beatFrames[i] || (beatFrames[i] = BEATS[i].frame());
  const FOOTNOTE = "University prototype. All therapists are fictional and the check-ins are synthetic. Need support now? Lifeline 13 11 14, or 000 in an emergency.";
  const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------------- presenter mode: full screen, nothing moves on until you click ---------------- */
  const startStep = () => {
    const n = Number(new URLSearchParams(window.location.search).get("cue"));
    const at = BEATS.findIndex((b) => b.cue === n);
    return n >= 0 && at !== -1 ? at : FIRST_CUE_STEP;
  };

  function Show({ onExit }) {
    const [i, setI] = useState(startStep);
    const [p, setP] = useState(1);
    const [black, setBlack] = useState(false);
    const [counterOn, setCounterOn] = useState(false);
    const [hint, setHint] = useState(true);
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    // Starts "just pressed", so the click that opened presenter mode doesn't also move it on.
    const state = useRef({ i, last: performance.now() });
    state.current.i = i;
    const still = useRef(true);

    // Run the step's movement, rewound before the browser paints so the finished frame never flashes. Going back shows a step finished, with no movement.
    React.useLayoutEffect(() => {
      if (still.current) { still.current = false; return undefined; }
      const anim = BEATS[i].anim;
      if (!anim || reduced) { setP(1); return undefined; }
      setP(0);
      let raf = 0;
      let start = null;
      const tick = (now) => {
        if (start == null) start = now;
        const q = clamp01((now - start) / 1000 / anim);
        setP(q);
        if (q < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [i]);

    useEffect(() => {
      const go = () => {
        const now = performance.now();
        if (now - state.current.last < 350) return;       // a double click or a clicker's double press is one step
        state.current.last = now;
        setHint(false);
        setI((x) => Math.min(BEATS.length - 1, x + 1));
      };
      const jump = (k) => {
        if (k === state.current.i) return;
        still.current = true;
        setP(1);
        setI(k);
      };
      const back = () => { setHint(false); jump(Math.max(0, state.current.i - 1)); };
      const onContext = (e) => { e.preventDefault(); back(); };
      const onKey = (e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " " || e.key === "Enter") { e.preventDefault(); go(); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") { e.preventDefault(); back(); }
        else if (e.key === "Home") { e.preventDefault(); jump(FIRST_CUE_STEP); }
        else if (e.key === "b" || e.key === "B" || e.key === ".") { e.preventDefault(); setBlack((v) => !v); }
        else if (e.key === "n" || e.key === "N") { setCounterOn((v) => !v); }
        else if (e.key === "Escape" && !document.fullscreenElement && onExit) { onExit(); }
        else if (e.key === "f" || e.key === "F") {
          if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
        }
      };
      // Esc in full screen leaves full screen first: that's the way out of presenter mode too.
      const onFull = () => { if (!document.fullscreenElement && onExit) onExit(); };
      const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
      const hide = setTimeout(() => setHint(false), 5000);
      window.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);
      document.addEventListener("click", go);
      document.addEventListener("contextmenu", onContext);
      document.addEventListener("fullscreenchange", onFull);
      document.documentElement.classList.add("live");
      document.body.classList.add("hide-cursor");
      return () => {
        clearTimeout(hide);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("click", go);
        document.removeEventListener("contextmenu", onContext);
        document.removeEventListener("fullscreenchange", onFull);
        document.documentElement.classList.remove("live");
        document.body.classList.remove("hide-cursor");
      };
    }, []);

    const scale = Math.min(size.w / W, size.h / H);
    const f = mix(i > 0 ? beatFrame(i - 1) : {}, beatFrame(i), p);
    const beat = BEATS[i];
    return h("div", { className: "relative h-full w-full overflow-hidden bg-paper" },
      h("div", {
        "aria-hidden": "true",
        style: { position: "absolute", left: (size.w - W * scale) / 2, top: (size.h - H * scale) / 2, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" },
      },
        Object.keys(f).map((id) => h(ACTORS[f[id].kind], { key: id, a: f[id] })),
        h("p", { className: "absolute inset-x-0 bottom-2 text-center text-sm text-muted" }, FOOTNOTE)),
      h("p", { className: "sr-only", "aria-live": "polite" }, `${beat.caption}${beat.sr ? ` On screen: ${beat.sr}` : ""}`),
      hint && h("p", { className: "absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-1.5 text-base font-bold text-paper" }, "Click for the next step · Right-click to go back · Esc to leave"),
      counterOn && h("p", { className: "absolute bottom-2 right-3 rounded bg-ink px-2 py-0.5 text-sm font-bold text-paper" }, beat.cue == null ? "Skit recap" : `Cue ${beat.cue} of ${LAST_CUE}`),
      black && h("div", { className: "absolute inset-0 z-50 bg-black" }),
      problems.length > 0 && h("div", { className: "absolute inset-x-0 top-0 z-50 bg-ochre p-3 text-center text-lg font-bold text-white" }, `Don't present this yet. ${problems.join(" ")}`));
  }

  /* ---------------- the Play version: the same frames, in the player from the public walkthrough ---------------- */
  // The stage keeps its 1280 x 720 layout, scaled to whatever space the player gives it.
  function stage(i, p, size) {
    const scale = Math.min(size.w / W, size.h / H);
    const f = mix(i > 0 ? beatFrame(i - 1) : {}, beatFrame(i), p);
    return h("div", { style: { position: "absolute", left: (size.w - W * scale) / 2, top: (size.h - H * scale) / 2, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" } },
      Object.keys(f).map((id) => h(ACTORS[f[id].kind], { key: id, a: f[id] })),
      h("p", { className: "absolute inset-x-0 bottom-2 text-center text-sm text-muted" }, FOOTNOTE));
  }
  const stageHeight = (w, vh) => Math.min((w * H) / W, Math.max(320, vh - 400));

  /* ---------------- timing: seconds per step, and steps where Play stops and waits ---------------- */
  const tenth = (x) => Math.round(x * 10) / 10;
  const MIN_STEP = 0.5;
  const DEFAULT_SECONDS = BEATS.map((b) => tenth(b.anim + b.hold));
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const TIMING_KEY = "thera-fits-allysa-timing";
  const validTiming = (t) => t && Array.isArray(t.seconds) && t.seconds.length === BEATS.length && t.seconds.every((x) => x >= MIN_STEP) && Array.isArray(t.stops);
  // A link carries its own timing (seconds in tenths, then the steps that stop). Otherwise, what this browser saved.
  function loadTiming() {
    const q = new URLSearchParams(window.location.search);
    if (q.get("t")) {
      const fromLink = { seconds: q.get("t").split(",").map((x) => Number(x) / 10), stops: (q.get("s") || "").split(",").filter(Boolean).map(Number) };
      if (validTiming(fromLink)) return fromLink;
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem(TIMING_KEY));
      if (validTiming(saved)) return saved;
    } catch (e) { /* no saved timing */ }
    return { seconds: DEFAULT_SECONDS, stops: [] };
  }
  function saveTiming(t) {
    try { window.localStorage.setItem(TIMING_KEY, JSON.stringify(t)); } catch (e) { /* it just won't be remembered */ }
  }
  // The story's beats at these timings. Movement never outlasts its step; long movements fill it.
  const timedBeats = (t) => BEATS.map((b, i) => {
    const anim = b.stretch ? t.seconds[i] : Math.min(b.anim, t.seconds[i]);
    return { ...b, anim, hold: t.seconds[i] - anim + (i === BEATS.length - 1 ? 0.002 : 0), stop: t.stops.indexOf(i) !== -1 };
  });
  // Change a group of steps to a new total, keeping their proportions.
  function scaled(seconds, ids, total) {
    const was = sum(ids.map((i) => seconds[i]));
    const next = seconds.slice();
    ids.forEach((i) => { next[i] = Math.max(MIN_STEP, tenth((seconds[i] * total) / was)); });
    const longest = ids.reduce((a, b) => (next[b] > next[a] ? b : a));
    next[longest] = Math.max(MIN_STEP, tenth(next[longest] + total - sum(ids.map((i) => next[i]))));
    return next;
  }

  // Types freely; applies when you leave the box or press Enter.
  function Seconds({ value, label, onSet, min = MIN_STEP }) {
    return h("input", {
      key: value, type: "number", min, step: 0.5, defaultValue: value, "aria-label": label,
      className: "w-20 rounded-lg border border-line-strong bg-surface px-2 py-1 text-right tabular-nums text-ink",
      onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); },
      onBlur: (e) => {
        const v = Number(e.target.value);
        if (e.target.value !== "" && v >= min && tenth(v) !== value) onSet(tenth(v));
        else e.target.value = value;
      },
    });
  }

  function TimingPanel({ timing, setTiming }) {
    const [link, setLink] = useState("");
    const all = BEATS.map((_, i) => i);
    const total = tenth(sum(timing.seconds));
    const setStep = (i, v) => { const next = timing.seconds.slice(); next[i] = v; setTiming({ ...timing, seconds: next }); };
    const setGroup = (ids, v) => setTiming({ ...timing, seconds: scaled(timing.seconds, ids, v) });
    const toggleStop = (i) => setTiming({ ...timing, stops: timing.stops.indexOf(i) !== -1 ? timing.stops.filter((x) => x !== i) : timing.stops.concat(i).sort((a, b) => a - b) });
    const makeLink = () => {
      const url = `${window.location.href.split("?")[0]}?t=${timing.seconds.map((x) => Math.round(x * 10)).join(",")}${timing.stops.length ? `&s=${timing.stops.join(",")}` : ""}`;
      setLink(url);
      try { if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {}); } catch (e) { /* the box below still has it */ }
    };
    const button = "rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm font-bold text-ink hover:border-ink/60";
    return h("details", { className: "mt-4 rounded-2xl border border-line bg-surface p-4", id: "timing" },
      h("summary", { className: "cursor-pointer font-display text-lg font-semibold text-ink" }, `Change the timing (now ${clock(total)})`),
      h("p", { className: "mt-2 text-[0.95rem] leading-relaxed text-muted" }, "Set the seconds for the whole walkthrough, a chapter or a single step. Changing a chapter or the whole keeps the same proportions inside it. Tick \"Stop after\" to make Play wait at that step until someone presses Play again. Changes are remembered in this browser."),
      h("div", { className: "mt-3 flex flex-wrap items-center gap-2" },
        h("label", { className: "mr-2 flex items-center gap-2 font-bold text-ink" }, "Whole walkthrough, seconds",
          h(Seconds, { value: tenth(total), label: "Whole walkthrough, in seconds", min: MIN_STEP * BEATS.length, onSet: (v) => setGroup(all, v) })),
        h("button", { type: "button", className: button, onClick: () => setTiming({ ...timing, stops: all.slice(0, -1) }) }, "Stop after every step"),
        h("button", { type: "button", className: button, onClick: () => setTiming({ ...timing, stops: [] }) }, "No stops"),
        h("button", { type: "button", className: button, onClick: () => setTiming({ seconds: DEFAULT_SECONDS, stops: [] }) }, "Reset to the script's timing"),
        h("button", { type: "button", className: button, onClick: makeLink }, "Copy a link with this timing")),
      link && h("input", { readOnly: true, value: link, "aria-label": "Link with this timing", onFocus: (e) => e.target.select(), className: "mt-2 w-full rounded-lg border border-line bg-sunken px-2 py-1 text-sm text-ink" }),
      h("div", { className: "mt-4 space-y-4" }, CHAPTERS.map((c, k) => {
        const ids = all.filter((i) => BEATS[i].chapter === k);
        return h("section", { key: c.title, "aria-label": `Chapter ${k + 1}: ${c.title}` },
          h("div", { className: "flex items-center gap-3 border-b-2 border-line-strong pb-1" },
            h("h3", { className: "min-w-0 flex-1 font-bold text-ink" }, `${k + 1}. ${c.title}`),
            h("span", { className: "text-sm tabular-nums text-muted" }, clock(sum(ids.map((i) => timing.seconds[i])))),
            h(Seconds, { value: tenth(sum(ids.map((i) => timing.seconds[i]))), label: `Chapter ${k + 1}, ${c.title}, in seconds`, min: MIN_STEP * ids.length, onSet: (v) => setGroup(ids, v) }),
            h("span", { className: "w-24" })),
          h("ul", null, ids.map((i) => h("li", { key: i, className: "flex items-center gap-3 border-b border-line py-1" },
            h("span", { className: "w-7 shrink-0 text-right text-sm tabular-nums text-muted" }, i + 1),
            h("span", { className: "min-w-0 flex-1 truncate text-sm text-ink", title: BEATS[i].caption }, BEATS[i].caption),
            h(Seconds, { value: timing.seconds[i], label: `Step ${i + 1}, in seconds`, onSet: (v) => setStep(i, v) }),
            h("label", { className: "flex w-24 items-center gap-1.5 text-sm text-ink" },
              h("input", { type: "checkbox", checked: timing.stops.indexOf(i) !== -1, onChange: () => toggleStop(i) }), "Stop after")))));
      })));
  }

  function PlayPage({ onPresent }) {
    const [timing, setTimingState] = useState(loadTiming);
    const setTiming = (t) => { setTimingState(t); saveTiming(t); };
    const beats = React.useMemo(() => timedBeats(timing), [timing]);
    return h("div", { className: "flex min-h-screen flex-col" },
      problems.length > 0 && h("div", { className: "bg-ochre p-3 text-center text-lg font-bold text-white" }, `Don't present this yet. ${problems.join(" ")}`),
      h(FF.ui.Header, { page: "presentation", base: "../Explainer/" }),
      h("main", { className: "flex-1" },
        h("div", { className: "mx-auto w-full max-w-[1400px] px-4 pb-10 pt-4 sm:px-8" },
          h("div", { className: "mb-3 flex flex-wrap items-center gap-3" },
            h("h1", { className: "font-display text-2xl font-semibold tracking-tight text-ink" }, "Thera-Fits: Allysa's second try"),
            h("span", { className: "hidden sm:inline" }, h(DemoBadge, null, "Played by Allysa and Vanessa. A fictional story")),
            h(FF.ui.Button, { className: "ml-auto", onClick: onPresent }, "Presenter mode")),
          h(FF.player.Player, { beats, chapters: CHAPTERS, stage, stageHeight, label: "Allysa's walkthrough", end: ({ replay }) => h(FF.ui.Button, { variant: "secondary", onClick: replay }, "Watch again") }),
          h(TimingPanel, { timing, setTiming }))),
      h(FF.ui.Footer, { page: "story" }));
  }

  // Presenter mode goes full screen from the button's click: browsers only allow that during a click.
  function Root() {
    const live = new URLSearchParams(window.location.search).has("live");
    const [presenting, setPresenting] = useState(live);
    const present = () => {
      const asked = document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : null;
      if (asked && asked.catch) asked.catch(() => {});
      setPresenting(true);
    };
    return presenting ? h(Show, { onExit: live ? null : () => setPresenting(false) }) : h(PlayPage, { onPresent: present });
  }

  FF.show = { BEATS, first, after, problems, LAST_CUE, duration: FF.player.duration(BEATS) };
  ReactDOM.createRoot(document.getElementById("root")).render(h(Root));
})();
