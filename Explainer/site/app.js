"use strict";
/*
  The explainer page. It never scores anything: it calls FF.rankers.run() and draws what comes back,
  so a ranking system added in matching/ shows up here without changes to this file.
  Left: the six questions. Right: behind the scenes, which a person using FIT-FIRST wouldn't see.
  URL: ?patient=A–E loads a test patient, ?ranker=<id> picks a ranking system, ?open=<therapist id> opens a breakdown.
*/
(function () {
  const { useState, useLayoutEffect, useRef } = React;
  const { h, IconCheck, IconCross, IconInfo, IconChevron, IconUp, IconDown, IconArrow, Button, Notice, DemoBadge, Tag, Swatch, Header, Footer } = FF.ui;
  const R = FF.rankers;

  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const fmt = (n) => String(Math.round(n * 100) / 100);
  const qn = (qid) => `Q${FF.question(qid).n}`;
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const firstName = (t) => t.name.replace(/^Dr /, "").split(" ")[0];
  const names = (results) => results.map((r) => r.therapist.name).join(", ");
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------------- answers ---------------- */
  function choose(answers, q, id, on) {
    const next = { ...answers };
    if (q.type === "single") {
      next[q.id] = on ? id : undefined;
    } else {
      const cur = list(answers[q.id]);
      next[q.id] = on ? cur.concat(id) : cur.filter((x) => x !== id);
      // A must-have only makes sense while its item is still picked.
      if (q.mustHave && !on && answers.must && answers.must[id]) {
        next.must = { ...answers.must };
        delete next.must[id];
      }
    }
    return next;
  }

  function Chip({ type, name, checked, disabled, onChange, children }) {
    return h("label", { className: `relative inline-flex max-w-full ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}` },
      h("input", { type, name, checked, disabled, onChange, className: "peer sr-only" }),
      h("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[0.93rem] leading-snug text-ink transition-colors hover:border-ink/60 peer-checked:border-accent peer-checked:bg-accent-soft peer-focus-visible:outline peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" },
        checked && h(IconCheck, { className: "h-3.5 w-3.5 shrink-0 text-accent", strokeWidth: 3 }),
        children));
  }

  function QuestionCard({ q, answers, setAnswers, ranker }) {
    const chosen = list(answers[q.id]);
    const atMax = q.max && chosen.length >= q.max;
    const must = answers.must || {};
    const textId = `${q.id}-text`;
    const hintId = `${q.id}-hint`;
    return h("div", { role: "group", "aria-labelledby": textId, "aria-describedby": q.hint ? hintId : undefined, className: "rounded-2xl border border-line bg-surface p-4 sm:p-5" },
      h("div", { className: "flex items-start gap-3" },
        h("span", { className: "mt-0.5 shrink-0 rounded-md bg-sunken px-1.5 py-0.5 text-xs font-bold text-muted" }, qn(q.id)),
        h("h3", { id: textId, className: "font-bold leading-snug text-ink" }, q.text)),
      q.hint && h("p", { id: hintId, className: "mt-1.5 text-sm text-muted" }, q.hint, atMax ? " That's the maximum." : ""),
      h("div", { className: "mt-3 flex flex-wrap gap-2" }, q.options.map(([id, label]) => {
        const checked = chosen.indexOf(id) !== -1;
        return h(Chip, {
          key: id, type: q.type === "single" ? "radio" : "checkbox", name: q.id, checked, disabled: !checked && atMax,
          onChange: (e) => setAnswers(choose(answers, q, id, e.target.checked)),
        }, label);
      })),
      q.mustHave && chosen.length > 0 && h("div", { className: "mt-3 space-y-1.5 rounded-xl bg-sunken p-3" },
        chosen.map((id) => h("label", { key: id, className: "flex cursor-pointer items-start gap-2 text-[0.93rem] text-ink" },
          h("input", { type: "checkbox", checked: !!must[id], onChange: (e) => setAnswers({ ...answers, must: { ...must, [id]: e.target.checked } }), className: "mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--accent))]" }),
          `Must-have: ${lowerFirst(FF.optionLabel(q.id, id))}`))),
      h("div", { className: "mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-2.5" },
        h("p", { className: "text-sm text-muted" }, h("span", { className: "font-bold text-ink" }, `${ranker.name}: `), ranker.uses[q.id]),
        q.type === "single" && chosen.length > 0 && h(Button, { variant: "quiet", onClick: () => setAnswers(choose(answers, q, null, false)), "aria-label": `Clear answer to ${qn(q.id)}` }, "Clear")));
  }

  function AnswersPane({ answers, setAnswers, patient, edited, load, clear, ranker }) {
    const any = FF.QUESTIONS.some((q) => list(answers[q.id]).length > 0);
    return h("section", { "aria-labelledby": "answers-title" },
      h("div", { className: "flex flex-wrap items-center justify-between gap-2" },
        h("h2", { id: "answers-title", className: "font-display text-2xl font-semibold text-ink" }, "The person's answers"),
        h(Button, { variant: "quiet", onClick: clear, disabled: !any }, "Clear all")),
      h("div", { className: "mt-3 flex flex-wrap items-center gap-2" },
        h("span", { className: "text-sm text-muted" }, "Load a test patient:"),
        FF.TEST_PATIENTS.map((p) => {
          const on = patient === p && !edited;
          return h("button", {
            key: p.id, type: "button", onClick: () => load(p), "aria-pressed": on, title: p.label, "aria-label": `Test patient ${p.id}: ${p.label}`,
            className: `h-9 w-9 rounded-lg border font-bold transition-colors ${on ? "border-accent bg-accent text-accent-ink" : "border-line-strong bg-surface text-ink hover:border-ink/60"}`,
          }, p.id);
        })),
      patient && h("p", { className: "mt-2 text-sm text-ink" }, `Test patient ${patient.id}: ${patient.label}${edited ? " (edited)" : ""}.`),
      h("a", { href: "#scenes", className: "mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-bold text-accent underline-offset-4 hover:underline lg:hidden" },
        "Jump to behind the scenes", h(IconDown, { className: "h-4 w-4" })),
      h(Notice, { className: "mt-4" }, "On the real site a safety screen comes before any questions: Lifeline 13 11 14, or 000 in an emergency. It's never scored, and it overrides matching."),
      h("div", { className: "mt-4 space-y-4" }, FF.QUESTIONS.map((q) => h(QuestionCard, { key: q.id, q, answers, setAnswers, ranker }))));
  }

  /* ---------------- behind the scenes ---------------- */
  function RankerPicker({ ranker, setRankerId, notes }) {
    return h("div", null,
      h("div", { role: "radiogroup", "aria-label": "Ranking system", className: "grid gap-2 sm:grid-cols-3" },
        R.list().map((rk) => {
          const on = rk.id === ranker.id;
          return h("label", { key: rk.id, className: "relative flex cursor-pointer" },
            h("input", { type: "radio", name: "ranker", checked: on, onChange: () => setRankerId(rk.id), className: "peer sr-only" }),
            h("span", { className: `flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 font-bold leading-tight transition-colors peer-focus-visible:outline peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${on ? "border-accent bg-accent text-accent-ink" : "border-line-strong bg-surface text-ink hover:border-ink/60"}` },
              h("span", { "aria-hidden": "true", className: `inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-accent-ink" : "border-line-strong"}` },
                on && h("span", { className: "h-1.5 w-1.5 rounded-full bg-accent-ink" })),
              rk.name));
        })),
      h("p", { className: "mt-2.5 text-[0.95rem] leading-relaxed text-ink" }, ranker.summary),
      notes.map((n) => h(Notice, { key: n, tone: "ochre", className: "mt-3" }, n)));
  }

  // Below the board, so the board stays in view on laptop screens while answers change.
  function Rules({ ranker }) {
    return h("section", { "aria-labelledby": "rules-title", className: "mt-8" },
      h("h3", { id: "rules-title", className: "font-display text-xl font-semibold text-ink" }, `How ${ranker.name} works`),
      h("ol", { className: "mt-2 list-decimal space-y-1 pl-5 text-[0.95rem] leading-relaxed text-ink" }, ranker.rules.map((r) => h("li", { key: r }, r))),
      h("details", { className: "mt-3 rounded-xl border border-line bg-surface p-3" },
        h("summary", { className: "cursor-pointer font-bold text-accent" }, "How the order is decided (the same for every system)"),
        h("ol", { className: "mt-2 list-decimal space-y-1 pl-5 text-[0.95rem] text-ink" }, R.ORDER_RULE.map((x) => h("li", { key: x }, x)))));
  }

  function Pipeline({ trace }) {
    const total = trace.results.length;
    const passed = trace.results.filter((r) => !r.excluded.length);
    const grouped = trace.results.some((r) => r.group);
    const top = grouped ? Math.min(...trace.results.map((r) => r.group.order)) : null;
    const topLabel = grouped ? trace.results.find((r) => r.group.order === top).group.label : "";
    const steps = [
      { big: h(IconInfo, { className: "h-4 w-4" }), label: "Safety screen first, never scored" },
      { big: total, label: "therapists" },
      { big: passed.length, label: "pass the filters" },
      grouped && { big: passed.filter((r) => r.group.order === top).length, label: `in the ${lowerFirst(topLabel)}` },
      { big: trace.shortlist.length, label: "shortlisted" },
    ].filter(Boolean);
    return h("ol", { className: "flex flex-wrap items-center gap-x-1 gap-y-1.5", "aria-label": "What happens, step by step" },
      steps.map((s, i) => h("li", { key: s.label, className: "flex items-center gap-1" },
        h("span", { className: "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-sm text-ink" },
          h("span", { className: "font-display text-base font-semibold leading-none" }, s.big), s.label),
        i < steps.length - 1 && h(IconArrow, { className: "h-3.5 w-3.5 shrink-0 text-muted" }))));
  }

  function Legend({ trace }) {
    const used = R.KINDS.filter((k) => trace.results.some((r) => r.parts.some((p) => p.kind === k.id)));
    if (!used.length) return null;
    return h("ul", { className: "flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted", "aria-label": "What the bar colours mean" },
      used.map((k) => h("li", { key: k.id, className: "flex items-center gap-1.5" }, h(Swatch, { kind: k.id }), `${k.label} (${qn(k.question)})`)),
      h("li", { className: "flex items-center gap-1.5" }, h("span", { "aria-hidden": "true", className: "inline-block h-3 w-3 rounded-[3px] bg-line" }), "Points not earned"));
  }

  // Stacked bar: points per kind, then the points not earned. The breakdown table holds the same numbers.
  function Bar({ r, muted, onTip }) {
    if (!r.max) return h("div", { className: "mt-2 h-3 w-full rounded-r-[4px] bg-line", "aria-hidden": "true" });
    const segs = R.KINDS
      .map((k) => ({ k, points: r.parts.filter((p) => p.kind === k.id).reduce((s, p) => s + p.points, 0) }))
      .filter((s) => s.points > 1e-9);
    const rest = r.max - r.score;
    return h("div", { className: `mt-2 flex h-3 w-full gap-[2px] ${muted ? "opacity-40" : ""}`, "aria-hidden": "true" },
      segs.map((s, i) => h("span", {
        key: s.k.id,
        className: `h-full min-w-[2px] ${i === segs.length - 1 ? "rounded-r-[4px]" : ""}`,
        style: { flex: `${s.points} 1 0`, background: `rgb(var(--kind-${s.k.id}))` },
        onPointerMove: (e) => onTip({ x: e.clientX, y: e.clientY, value: `${fmt(s.points)} pts`, label: s.k.label }),
        onPointerLeave: () => onTip(null),
      })),
      rest > 1e-9 && h("span", { className: "h-full rounded-r-[4px] bg-line", style: { flex: `${rest} 1 0` } }));
  }

  function MoveTag({ move }) {
    const up = move > 0;
    return h("span", { className: `inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-accent" : "text-muted"}` },
      h(up ? IconUp : IconDown, { className: "h-3.5 w-3.5", strokeWidth: 2.5 }),
      Math.abs(move),
      h("span", { className: "sr-only" }, up ? " places up" : " places down"));
  }

  function Breakdown({ r, id }) {
    const t = r.therapist;
    const out = r.excluded.length > 0;
    const steps = [
      out ? { mark: "no", text: `Filtered out: ${r.excluded.map((e) => `${e.reason} (${qn(e.question)})`).join(" ")}` }
        : { mark: "yes", text: "Passes every filter." },
      r.group && { mark: r.group.order === 0 ? "yes" : "info", text: `${r.group.label}. ${r.group.why}` },
      { mark: "info", text: r.max ? `${fmt(r.score)} of ${fmt(r.max)} possible points, from the table below.` : "No points yet: nothing answered that this system scores." },
      out ? { mark: "no", text: "Not shortlisted: filters come before points." }
        : r.shortlisted ? { mark: "yes", text: `Position ${r.position}, inside the top ${R.SHORTLIST_SIZE}, so shortlisted.` }
          : { mark: "info", text: `Position ${r.position}, below the top ${R.SHORTLIST_SIZE}, so not shortlisted.` },
    ].filter(Boolean);
    const Mark = ({ mark }) => mark === "yes" ? h(IconCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-accent", strokeWidth: 3 })
      : mark === "no" ? h(IconCross, { className: "mt-0.5 h-4 w-4 shrink-0 text-ochre", strokeWidth: 3 })
        : h(IconInfo, { className: "mt-0.5 h-4 w-4 shrink-0 text-muted" });
    const cols = ["What", "The person said", firstName(t), "Fit", "Weight", "Points"];

    return h("div", { id, className: "border-t border-line px-3 pb-4 pt-3 sm:px-4" },
      h("div", { className: "flex flex-wrap items-center gap-2" }, h("p", { className: "text-sm text-muted" }, t.registration), h(DemoBadge)),
      h("h4", { className: "mt-2 font-display text-lg font-semibold text-ink" }, "How this was decided"),
      h("ul", { className: "mt-2 space-y-1.5 text-[0.95rem] leading-relaxed text-ink" },
        steps.map((s) => h("li", { key: s.text, className: "flex gap-2" }, h(Mark, { mark: s.mark }), h("span", null, s.text)))),
      // Scrolls sideways on phones; focusable so keyboard users can scroll it too.
      r.parts.length > 0 && h("div", { tabIndex: 0, role: "region", "aria-label": `Points table for ${t.name}`, className: "mt-3 overflow-x-auto rounded-xl border border-line bg-surface" },
        h("table", { className: "w-full min-w-[36rem] border-collapse text-left text-sm" },
          h("caption", { className: "sr-only" }, `How ${t.name}'s points add up`),
          h("thead", { className: "bg-sunken text-muted" },
            h("tr", null, cols.map((c, i) => h("th", { key: c, scope: "col", className: `px-3 py-2 font-bold ${i >= 3 ? "text-right" : ""}` }, c)))),
          h("tbody", null, r.parts.map((p, i) => h("tr", { key: i, className: "border-t border-line align-top" },
            h("th", { scope: "row", className: "px-3 py-2 font-bold text-ink" },
              h("span", { className: "flex items-start gap-2" }, h(Swatch, { kind: p.kind, className: "mt-1" }),
                h("span", null, p.label, h("span", { className: "block text-xs font-normal text-muted" }, qn(p.question))))),
            h("td", { className: "px-3 py-2 text-ink" }, p.said),
            h("td", { className: "px-3 py-2 text-ink" }, p.has, p.note && h("span", { className: "block text-xs text-muted" }, p.note)),
            h("td", { className: "px-3 py-2 text-right tabular-nums text-ink" }, fmt(p.fit)),
            h("td", { className: "px-3 py-2 text-right tabular-nums text-ink" }, `×${fmt(p.weight)}`),
            h("td", { className: "px-3 py-2 text-right font-bold tabular-nums text-ink" }, fmt(p.points))))),
          h("tfoot", null, h("tr", { className: "border-t-2 border-line-strong" },
            h("th", { scope: "row", colSpan: 4, className: "px-3 py-2 text-left font-bold text-ink" }, "Total"),
            h("td", { className: "px-3 py-2 text-right tabular-nums text-muted" }, `of ${fmt(r.max)}`),
            h("td", { className: "px-3 py-2 text-right font-bold tabular-nums text-ink" }, fmt(r.score)))))),
      r.parts.length > 0 && h("p", { className: "mt-2 text-xs text-muted" }, "Fit runs from 0 (no match) to 1 (full match). Points = fit × weight. The weights are the ranking system's choice."));
  }

  function Row({ r, isOpen, onToggle, move, rowRef, onTip }) {
    const t = r.therapist;
    const out = r.excluded.length > 0;
    const panelId = `why-${t.id}`;
    const status = out ? "filtered out" : r.shortlisted ? "shortlisted" : "not shortlisted";
    return h("li", { ref: rowRef, className: `rounded-xl border ${r.shortlisted ? "border-accent/50 bg-accent-soft/50" : "border-line bg-surface"}` },
      h("button", { type: "button", "aria-expanded": isOpen, "aria-controls": isOpen ? panelId : undefined, onClick: onToggle, className: "flex w-full items-start gap-3 rounded-xl p-3 text-left sm:p-4" },
        h("span", { className: "w-6 shrink-0 text-center font-display text-lg font-semibold leading-6 text-ink" }, r.position),
        h("span", { className: "min-w-0 flex-1" },
          h("span", { className: "flex flex-wrap items-center gap-x-2 gap-y-1" },
            h("span", { className: "font-bold leading-6 text-ink" }, t.name),
            r.shortlisted && h(Tag, { tone: "accent" }, "Shortlist"),
            r.group && !out && h(Tag, { tone: r.group.order === 0 ? "ochre" : "plain" }, r.group.label),
            move ? h(MoveTag, { move }) : null,
            h("span", { className: "sr-only" }, `, ${status}, ${fmt(r.score)} of ${fmt(r.max)} points.`)),
          h(Bar, { r, muted: out, onTip }),
          out && h("span", { className: "mt-1.5 block text-sm text-ink" }, h("span", { className: "font-bold" }, "Filtered out: "), r.excluded.map((e) => e.reason).join(" "))),
        h("span", { className: "shrink-0 text-right", "aria-hidden": "true" },
          h("span", { className: "block font-bold leading-6 tabular-nums text-ink" }, r.max ? fmt(r.score) : "–"),
          h("span", { className: "block text-xs text-muted" }, r.max ? `of ${fmt(r.max)} pts` : "no points")),
        h(IconChevron, { className: `mt-0.5 h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}` })),
      isOpen && h(Breakdown, { r, id: panelId }));
  }

  const positions = (trace) => {
    const pos = {};
    trace.results.forEach((r) => { pos[r.id] = r.position; });
    return pos;
  };

  function Board({ trace, inputKey, open, toggle }) {
    const rows = useRef({});
    const tops = useRef({});
    const last = useRef({ key: inputKey, pos: positions(trace), moves: {}, animate: false });
    const [tip, setTip] = useState(null);

    // When the answers or the ranking system change, note who moved and by how much.
    if (last.current.key !== inputKey) {
      const pos = positions(trace);
      const moves = {};
      Object.keys(pos).forEach((id) => { const d = (last.current.pos[id] || pos[id]) - pos[id]; if (d) moves[id] = d; });
      last.current = { key: inputKey, pos, moves, animate: true };
    }

    // Slide rows from their old place to the new one (skipped for reduced motion).
    useLayoutEffect(() => {
      const animate = last.current.animate && !reducedMotion();
      last.current.animate = false;
      Object.keys(rows.current).forEach((id) => {
        const el = rows.current[id];
        if (!el) return;
        const before = tops.current[id];
        const now = el.offsetTop;
        tops.current[id] = now;
        if (animate && before != null && Math.abs(before - now) > 1 && el.animate) {
          el.animate([{ transform: `translateY(${before - now}px)` }, { transform: "translateY(0)" }], { duration: 380, easing: "cubic-bezier(.2,.7,.3,1)" });
        }
      });
    });

    const items = [];
    trace.results.forEach((r, i) => {
      const prev = trace.results[i - 1];
      if (prev && prev.shortlisted && !r.shortlisted && !r.excluded.length) items.push(h(Divider, { key: "cut" }, "Shortlist cut-off"));
      if (r.excluded.length && (!prev || !prev.excluded.length)) items.push(h(Divider, { key: "out" }, "Filtered out, whatever their points"));
      items.push(h(Row, {
        key: r.id, r, isOpen: open.indexOf(r.id) !== -1, onToggle: () => toggle(r.id), move: last.current.moves[r.id], onTip: setTip,
        rowRef: (el) => { rows.current[r.id] = el; },
      }));
    });

    return h("div", null,
      h("ol", { className: "relative space-y-2", "aria-label": "Every therapist, in ranked order" }, items),
      tip && h("div", { className: "pointer-events-none fixed z-50 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm shadow-lg", style: { left: tip.x + 12, top: tip.y + 14 } },
        h("span", { className: "font-bold text-ink" }, tip.value), " ", h("span", { className: "text-muted" }, tip.label)));
  }

  function Divider({ children }) {
    return h("li", { "aria-hidden": "true", className: "flex items-center gap-3 pt-1 text-xs font-bold uppercase tracking-wide text-muted" },
      h("span", { className: "h-px flex-1 bg-line-strong" }), children, h("span", { className: "h-px flex-1 bg-line-strong" }));
  }

  function Compare({ answers, ranker, setRankerId }) {
    const runs = R.list().map((rk) => R.run(rk.id, answers, FF.THERAPISTS));
    const current = runs.find((x) => x.ranker.id === ranker.id);
    const has = (tr, r) => tr.shortlist.some((x) => x.id === r.id);
    return h("section", { "aria-labelledby": "compare-title", className: "mt-8" },
      h("h3", { id: "compare-title", className: "font-display text-xl font-semibold text-ink" }, "Same answers, every ranking system"),
      h("p", { className: "mt-1 text-[0.95rem] text-muted" }, "Who each system would shortlist. The differences are what choosing a system changes."),
      h("ul", { className: "mt-3 space-y-2" }, runs.map((tr) => {
        const on = tr === current;
        const added = tr.shortlist.filter((r) => !has(current, r));
        const dropped = current.shortlist.filter((r) => !has(tr, r));
        const diff = added.length || dropped.length
          ? [added.length && `adds ${names(added)}`, dropped.length && `drops ${names(dropped)}`].filter(Boolean).join(", and ")
          : "same shortlist";
        return h("li", { key: tr.ranker.id, className: `rounded-xl border p-3 ${on ? "border-accent/50 bg-accent-soft/50" : "border-line bg-surface"}` },
          h("div", { className: "flex flex-wrap items-center justify-between gap-2" },
            h("p", { className: "flex items-center gap-2 font-bold text-ink" }, tr.ranker.name, on && h(Tag, { tone: "accent" }, "Showing")),
            !on && h(Button, { variant: "quiet", onClick: () => setRankerId(tr.ranker.id), "aria-label": `Show ${tr.ranker.name}` }, "Show")),
          h("p", { className: "mt-1 text-[0.95rem] text-ink" }, tr.shortlist.length ? names(tr.shortlist) : "Nobody passes the filters."),
          !on && h("p", { className: "mt-0.5 text-sm text-muted" }, `Compared with ${ranker.name}: ${diff}.`));
      })));
  }

  function Scenes({ answers, ranker, setRankerId, trace, inputKey, open, toggle }) {
    const empty = trace.results.every((r) => !r.max);
    return h("section", { id: "scenes", tabIndex: -1, "aria-labelledby": "scenes-title", className: "rounded-3xl border border-line bg-sunken/60 p-4 focus:outline-none sm:p-6 lg:sticky lg:top-[4.75rem] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto" },
      h("h2", { id: "scenes-title", className: "font-display text-2xl font-semibold text-ink" }, "Behind the scenes"),
      h("p", { className: "mt-1 text-[0.95rem] leading-relaxed text-muted" }, "What the person wouldn't see: every therapist's points, and how each decision was made. Select a therapist for their breakdown."),
      h("p", { className: "mt-4 text-sm font-bold text-muted" }, "Ranking system"),
      h("div", { className: "mt-1.5" }, h(RankerPicker, { ranker, setRankerId, notes: trace.notes })),
      h("div", { className: "mt-3" }, h(Pipeline, { trace })),
      h("h3", { className: "mt-6 font-display text-xl font-semibold text-ink" }, "Every therapist"),
      h("div", { className: "mt-2" }, h(Legend, { trace })),
      empty && h(Notice, { tone: "accent", className: "mt-3" }, "No answers yet, so nobody has points and the order is alphabetical. Answer a question, or load a test patient."),
      h("div", { className: "mt-3" }, h(Board, { trace, inputKey, open, toggle })),
      h(Rules, { ranker }),
      h(Compare, { answers, ranker, setRankerId }));
  }

  /* ---------------- app ---------------- */
  function App() {
    const params = new URLSearchParams(window.location.search);
    const start = FF.TEST_PATIENTS.find((p) => p.id === (params.get("patient") || "").toUpperCase()) || null;
    const [answers, setAnswersState] = useState(start ? start.answers : {});
    const [patient, setPatient] = useState(start);
    const [edited, setEdited] = useState(false);
    const [rankerId, setRankerId] = useState(R.get(params.get("ranker")).id);
    const [open, setOpen] = useState(params.get("open") ? [params.get("open")] : []);

    const setAnswers = (a) => { setAnswersState(a); setEdited(true); };
    const load = (p) => { setAnswersState(p.answers); setPatient(p); setEdited(false); };
    const clear = () => { setAnswersState({}); setPatient(null); setEdited(false); };
    const toggle = (id) => setOpen(open.indexOf(id) === -1 ? open.concat(id) : open.filter((x) => x !== id));

    const ranker = R.get(rankerId);
    const trace = R.run(rankerId, answers, FF.THERAPISTS);
    const inputKey = rankerId + JSON.stringify(answers);
    const live = trace.shortlist.length ? `${ranker.name} shortlist: ${names(trace.shortlist)}.` : `${ranker.name}: nobody passes the filters.`;

    return h("div", { className: "flex min-h-screen flex-col" },
      h("a", { href: "#main", className: "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:font-bold focus:text-ink" }, "Skip to content"),
      h(Header),
      h("main", { id: "main", tabIndex: -1, className: "flex-1 focus:outline-none" },
        h("div", { className: "mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-8 sm:pt-10" },
          h("h1", { className: "font-display text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-ink sm:text-[2.4rem]" }, "How matching decides"),
          h("p", { className: "mt-3 max-w-3xl text-lg leading-relaxed text-muted" },
            "Answer six questions, or load a test patient. The right-hand side shows what a person using FIT-FIRST wouldn't see: every fictional therapist's points, and how each one was decided. Switch the ranking system to see how a different rule changes the shortlist."),
          h("p", { className: "sr-only", "aria-live": "polite" }, live),
          h("div", { className: "mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start" },
            h(AnswersPane, { answers, setAnswers, patient, edited, load, clear, ranker }),
            h(Scenes, { answers, ranker, setRankerId, trace, inputKey, open, toggle })))),
      h(Footer));
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
