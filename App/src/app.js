"use strict";
/*
  Screens and flow. Steps: landing → safety → question (one per screen, FLOW order) → results.
  Answers live in React state only: nothing is saved or sent.
  Demo shortcut: index.html?patient=A (A–E) opens the results for a fictional test patient.
*/
(function () {
  const { useState, useEffect } = React;
  const { h, IconBack, IconNext, Button, ScreenTitle, Page, DemoBadge, Monogram, LEVELS, AlignMark, Notice, Header, Footer, Choice, Toggle } = FF.ui;

  // Questions shown, in order. Q11–Q15 (self-management) are out of the MVP.
  // Q3 and Q7 aren't scored; drop them here if the group agrees (proposal open question 2).
  const FLOW = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "q16", "q17", "q18", "q19", "q20"].map(FF.question);

  const FORMAT_LABEL = { in_person: "In person", video: "Video", phone: "Phone" };
  const HOURS_LABEL = { evenings_weekends: "Evenings and weekends", weekends: "Weekends only", business: "Weekday business hours" };
  const LANG_LABEL = { english: "English", mandarin: "Mandarin", indonesian: "Indonesian", arabic: "Arabic", hindi: "Hindi" };
  const ESSENTIAL_ITEMS = ["gender", "cultural", "faith", "international", "lgbtq", "circumstances"];

  /* ---------------- answer updates ---------------- */
  function selectOption(answers, q, id, checked) {
    const next = { ...answers, essential: { ...(answers.essential || {}) } };
    if (q.type === "single") {
      next[q.id] = id;
    } else {
      let cur = Array.isArray(answers[q.id]) ? answers[q.id] : [];
      const exclusive = q.exclusive || [];
      if (!checked) cur = cur.filter((x) => x !== id);
      else if (exclusive.indexOf(id) !== -1) cur = [id];
      else cur = cur.filter((x) => exclusive.indexOf(x) === -1).concat(id);
      next[q.id] = cur;
      // Must-have flags only make sense while their item is still selected.
      if (q.id === "q18") ESSENTIAL_ITEMS.forEach((k) => { if (cur.indexOf(k) === -1) delete next.essential[k]; });
      if (q.id === "q18" && cur.indexOf("gender") === -1) delete next.q18_gender;
      if (q.id === "q5" && !cur.some((l) => LANG_LABEL[l] && l !== "english")) delete next.essential.language;
    }
    return next;
  }
  const isChecked = (answers, q, id) => (q.type === "single" ? answers[q.id] === id : (answers[q.id] || []).indexOf(id) !== -1);
  const isAnswered = (answers, q) => (q.type === "single" ? !!answers[q.id] : (answers[q.id] || []).length > 0);

  /* ---------------- screens ---------------- */
  function Landing({ onStart }) {
    const points = [
      "Answer up to 15 short questions. It takes about 5 minutes.",
      "We won't ask about diagnoses or symptoms.",
      "See three fictional therapist profiles, and why each one might or might not suit you.",
    ];
    return h(Page, null,
      h("p", { className: "font-display text-lg font-semibold tracking-tight text-accent" }, "FIT-FIRST"),
      h(ScreenTitle, { className: "mt-3" }, "Find a therapist who fits you, before your first session."),
      h("p", { className: "mt-5 text-lg leading-relaxed text-muted" }, "Starting therapy is easier when you know what you're looking for. Tell us what matters to you and we'll show you who lines up, and where they don't."),
      h("ul", { className: "mt-8 space-y-3" }, points.map((p) => h("li", { key: p, className: "flex gap-3 leading-relaxed text-ink" },
        h("span", { className: "mt-2 h-2 w-2 shrink-0 rounded-full bg-accent", "aria-hidden": "true" }), p))),
      h(Notice, { tone: "plain", className: "mt-8" }, "Your answers stay in this browser tab. Nothing is saved or sent."),
      h("div", { className: "mt-8" }, h(Button, { onClick: onStart, className: "px-8" }, "Start")));
  }

  // Wording is a placeholder until the group signs it off (proposal open question 6).
  function Safety({ onBack, onNext }) {
    return h(Page, null,
      h(ScreenTitle, null, "Before you start"),
      h("p", { className: "mt-5 text-lg leading-relaxed text-ink" }, "If you're not safe right now, or you need to talk to someone today, please don't wait for a match."),
      h("ul", { className: "mt-6 space-y-3" },
        h("li", { className: "rounded-xl border border-line bg-surface p-4" },
          h("p", { className: "font-bold text-ink" }, "Lifeline: 13 11 14"),
          h("p", { className: "text-muted" }, "Free, confidential crisis support, any time of day.")),
        h("li", { className: "rounded-xl border border-line bg-surface p-4" },
          h("p", { className: "font-bold text-ink" }, "Emergency: 000"),
          h("p", { className: "text-muted" }, "If you or someone else is in immediate danger."))),
      h("p", { className: "mt-6 leading-relaxed text-muted" }, "FIT-FIRST is a design prototype. It can't respond to anything you tell it."),
      h("div", { className: "mt-10 flex flex-wrap gap-3" },
        h(Button, { variant: "secondary", onClick: onBack }, h(IconBack, { className: "h-4 w-4" }), "Back"),
        h(Button, { onClick: onNext }, "Continue")));
  }

  function Progress({ index }) {
    const q = FLOW[index];
    const section = FF.SECTIONS.find((s) => s.id === q.section);
    return h("div", { className: "mb-8" },
      h("p", { className: "text-sm text-muted" }, `${section.title} · Question ${index + 1} of ${FLOW.length}`),
      h("div", { className: "mt-2 h-1.5 rounded-full bg-line", role: "progressbar", "aria-valuemin": 1, "aria-valuemax": FLOW.length, "aria-valuenow": index + 1, "aria-label": "Questionnaire progress" },
        h("div", { className: "h-1.5 rounded-full bg-accent transition-[width]", style: { width: `${((index + 1) / FLOW.length) * 100}%` } })));
  }

  function Question({ index, answers, setAnswers, onBack, onNext }) {
    const q = FLOW[index];
    const chosen = q.type === "multi" ? answers[q.id] || [] : [];
    const atMax = q.max && chosen.length >= q.max;
    const essential = answers.essential || {};
    const setEssential = (key, value) => setAnswers({ ...answers, essential: { ...essential, [key]: value } });
    const setOther = (value) => setAnswers({ ...answers, other: { ...(answers.other || {}), [q.id]: value } });
    const otherLanguage = q.id === "q5" && chosen.some((l) => LANG_LABEL[l] && l !== "english");

    return h(Page, null,
      h(Progress, { index }),
      h(ScreenTitle, null, q.text),
      q.hint && h("p", { id: "q-hint", className: "mt-3 text-muted" }, q.hint, atMax ? " You've picked the maximum." : ""),
      h("fieldset", { className: "mt-7", "aria-labelledby": "screen-title", "aria-describedby": q.hint ? "q-hint" : undefined },
        h("div", { className: "grid gap-2.5" }, q.options.map(([id, label]) => {
          const checked = isChecked(answers, q, id);
          return h(Choice, {
            key: id, type: q.type === "single" ? "radio" : "checkbox", name: q.id, checked,
            disabled: !checked && atMax && (q.exclusive || []).indexOf(id) === -1,
            onChange: (e) => setAnswers(selectOption(answers, q, id, e.target.checked)),
          }, label);
        }))),

      // "Other (please specify)": free text, never scored.
      q.other && isChecked(answers, q, q.other) && h("label", { className: "mt-4 block" },
        h("span", { className: "text-sm font-bold text-ink" }, "Tell us more (optional)"),
        h("input", { type: "text", value: (answers.other || {})[q.id] || "", onChange: (e) => setOther(e.target.value),
          className: "mt-1.5 w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-ink" })),

      // Q5: language must-have.
      otherLanguage && h("div", { className: "mt-5 rounded-xl border border-line bg-surface p-4" },
        h(Toggle, { checked: !!essential.language, onChange: (e) => setEssential("language", e.target.checked) }, q.essential.label)),

      // Q18: gender follow-up and a must-have toggle per selected item.
      q.id === "q18" && chosen.some((k) => ESSENTIAL_ITEMS.indexOf(k) !== -1) && h("div", { className: "mt-5 space-y-4 rounded-xl border border-line bg-surface p-4" },
        h("p", { className: "text-[0.95rem] text-muted" }, "Is any of these a must-have? We'll only show therapists who meet your must-haves, and tell you if no one does."),
        chosen.indexOf("gender") !== -1 && h("label", { className: "block" },
          h("span", { className: "text-sm font-bold text-ink" }, "Preferred therapist gender"),
          h("select", { value: answers.q18_gender || "", onChange: (e) => setAnswers({ ...answers, q18_gender: e.target.value || undefined }),
            className: "mt-1.5 block w-full max-w-xs rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-ink" },
            h("option", { value: "" }, "Choose…"),
            FF.GENDER_OPTIONS.map(([id, label]) => h("option", { key: id, value: id }, label)))),
        h("ul", { className: "space-y-2" }, chosen.filter((k) => ESSENTIAL_ITEMS.indexOf(k) !== -1).map((k) =>
          h("li", { key: k }, h(Toggle, { checked: !!essential[k], onChange: (e) => setEssential(k, e.target.checked) },
            `Must-have: ${FF.optionLabel("q18", k).toLowerCase()}`))))),

      h("div", { className: "mt-10 flex flex-wrap gap-3" },
        h(Button, { variant: "secondary", onClick: onBack }, h(IconBack, { className: "h-4 w-4" }), "Back"),
        h(Button, { onClick: onNext }, isAnswered(answers, q) ? (index === FLOW.length - 1 ? "See my matches" : "Next") : "Skip", h(IconNext, { className: "h-4 w-4" }))));
  }

  /* ---------------- results ---------------- */
  function ReasonRow({ r }) {
    const level = r.weight === 0 ? "info" : r.level;
    return h("li", { className: "flex gap-3" },
      h(AlignMark, { level }),
      h("div", null,
        h("p", { className: "font-bold text-ink" }, r.label, level !== "info" && h("span", { className: "ml-2 text-sm font-normal text-muted" }, `· ${LEVELS[level].label}`)),
        h("p", { className: "text-[0.95rem] leading-relaxed text-muted" }, r.note)));
  }

  function Fact({ term, children }) {
    return h("div", null, h("dt", { className: "text-sm text-muted" }, term), h("dd", { className: "font-bold text-ink" }, children));
  }

  function TherapistCard({ result }) {
    const t = result.therapist;
    const main = result.reasons.filter((r) => r.weight >= 2 || r.weight === 0);
    const other = result.reasons.filter((r) => r.weight > 0 && r.weight < 2);
    return h("article", { className: "rounded-2xl border border-line bg-surface p-5 sm:p-6", "aria-labelledby": `name-${t.id}` },
      h("div", { className: "flex items-start gap-4" },
        h(Monogram, { t }),
        h("div", null,
          h("h2", { id: `name-${t.id}`, className: "font-display text-xl font-semibold text-ink" }, t.name),
          h("p", { className: "text-muted" }, t.registration),
          h("div", { className: "mt-1.5" }, h(DemoBadge)))),
      h("p", { className: "mt-4 leading-relaxed text-ink" }, t.about),

      result.misses.length > 0 && h(Notice, { tone: "ochre", className: "mt-4" },
        h("p", { className: "font-bold" }, "Doesn't meet:"),
        h("ul", { className: "mt-1 list-disc pl-5" }, result.misses.map((m) => h("li", { key: m }, m)))),

      main.length > 0 && h("div", { className: "mt-5" },
        h("h3", { className: "font-display text-lg font-semibold text-ink" }, "How they line up with what you said"),
        h("ul", { className: "mt-3 space-y-3" }, main.map((r) => h(ReasonRow, { key: r.key, r })))),
      other.length > 0 && h("details", { className: "mt-4" },
        h("summary", { className: "cursor-pointer font-bold text-accent" }, "Other things we considered"),
        h("ul", { className: "mt-3 space-y-3" }, other.map((r) => h(ReasonRow, { key: r.key, r })))),

      h("dl", { className: "mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4" },
        h(Fact, { term: "Example fee" }, "$".repeat(t.fee_band)),
        h(Fact, { term: "First session" }, t.wait_days < 14 ? `~${t.wait_days} days` : `~${Math.round(t.wait_days / 7)} weeks`),
        h(Fact, { term: "Sessions" }, t.formats.map((f) => FORMAT_LABEL[f]).join(", ")),
        h(Fact, { term: "Languages" }, t.languages.map((l) => LANG_LABEL[l] || l).join(", "))),
      h("p", { className: "mt-3 text-sm text-muted" }, HOURS_LABEL[t.hours] + "."),
      h("p", { className: "mt-4 rounded-lg bg-sunken px-4 py-3 text-[0.95rem] text-ink" }, h("span", { className: "font-bold" }, "Trade-off: "), t.tradeoff));
  }

  function Results({ answers, onEdit, onRestart, patient }) {
    const r = FF.match(answers, FF.THERAPISTS);
    const n = r.shortlist.length;
    const title = r.status === "full" ? "Three therapists who could suit you"
      : r.status === "narrow" ? `Only ${n === 1 ? "one therapist meets" : `${n} therapists meet`} your must-haves`
        : "No one meets all your must-haves";
    const intro = r.status === "full" ? "Each one lines up with some of what you told us and not with other parts. The trade-offs are there to help you decide."
      : r.status === "narrow" ? "We've added the closest fits below, with what each one is missing, so you can decide whether that matters."
        : "Rather than pretend, here are the closest fits and exactly what each one is missing. You could also relax one of your must-haves.";

    return h(Page, { width: "max-w-4xl" },
      patient && h(Notice, { tone: "ochre", className: "mb-6" }, `Demo: showing results for fictional test patient ${patient.id} (${patient.label}).`),
      h(ScreenTitle, null, title),
      h("p", { className: "mt-4 text-lg leading-relaxed text-muted" }, intro),
      h(Notice, { tone: "plain", className: "mt-5" }, "These are fictional profiles that show how matching could work. It isn't a recommendation or clinical advice, and therapists aren't ranked against each other publicly."),

      n > 0 && h("section", { className: "mt-8 space-y-5", "aria-label": "Your shortlist" }, r.shortlist.map((x) => h(TherapistCard, { key: x.therapist.id, result: x }))),
      r.closest.length > 0 && h("section", { className: "mt-12", "aria-labelledby": "closest-title" },
        h("h2", { id: "closest-title", className: "font-display text-2xl font-semibold text-ink" }, "Closest fits"),
        h("p", { className: "mt-2 text-muted" }, "These don't meet everything you marked as a must-have."),
        h("div", { className: "mt-5 space-y-5" }, r.closest.map((x) => h(TherapistCard, { key: x.therapist.id, result: x })))),

      h("div", { className: "mt-10 flex flex-wrap gap-3" },
        h(Button, { variant: "secondary", onClick: onEdit }, h(IconBack, { className: "h-4 w-4" }), "Change my answers"),
        h(Button, { variant: "quiet", onClick: onRestart }, "Start again")));
  }

  /* ---------------- app ---------------- */
  function App() {
    const params = new URLSearchParams(window.location.search);
    const demo = (FF.TEST_PATIENTS || []).find((p) => p.id === (params.get("patient") || "").toUpperCase());
    const [step, setStep] = useState(demo ? "results" : "landing");
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState(demo ? demo.answers : {});
    const [patient, setPatient] = useState(demo || null);

    useEffect(() => {
      window.scrollTo(0, 0);
      const el = document.getElementById("screen-title");
      if (el) el.focus({ preventScroll: true });
    }, [step, qIndex]);

    const restart = () => { setAnswers({}); setPatient(null); setQIndex(0); setStep("landing"); };
    let screen;
    if (step === "landing") screen = h(Landing, { onStart: () => setStep("safety") });
    else if (step === "safety") screen = h(Safety, { onBack: () => setStep("landing"), onNext: () => { setQIndex(0); setStep("question"); } });
    else if (step === "question") {
      screen = h(Question, {
        key: qIndex, index: qIndex, answers, setAnswers,
        onBack: () => (qIndex === 0 ? setStep("safety") : setQIndex(qIndex - 1)),
        onNext: () => (qIndex === FLOW.length - 1 ? setStep("results") : setQIndex(qIndex + 1)),
      });
    } else {
      screen = h(Results, { answers, patient, onRestart: restart, onEdit: () => { setPatient(null); setQIndex(0); setStep("question"); } });
    }

    return h("div", { className: "flex min-h-screen flex-col" },
      h("a", { href: "#main", className: "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:font-bold focus:text-ink" }, "Skip to content"),
      h(Header, { onHome: restart }),
      h("main", { id: "main", tabIndex: -1, className: "flex-1 focus:outline-none" }, screen),
      h(Footer));
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
