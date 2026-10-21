"use strict";
/*
  A player for an animated walkthrough: one clock, the controls (play, pause, step, scrub, chapters), the captions
  and a transcript. It knows nothing about therapists: site/story.js gives it the beats and draws the stage.

  A beat: { chapter, caption, sr, anim, hold }
    caption  the words on screen. The stage is hidden from screen readers, so the caption carries the story
    sr       optional: what the stage shows, read out after the caption and listed in the transcript
    anim     seconds of movement
    hold     seconds to read afterwards (default: from the caption's length)
  stage(i, p, size) draws beat i, with p running 0 → 1 during the movement and staying at 1 while holding.
  Because the stage is a pure function of time, scrubbing works both ways, any moment can be linked
  (?beat=n opens beat n, paused, once it has moved), and reduced motion only has to skip to p = 1.

  Animation helpers for stages: FF.player.mix(from, to, p) tweens two frames of actors (see mix below).
*/
window.FF = window.FF || {};

(function () {
  const { useState, useEffect, useLayoutEffect, useMemo, useRef } = React;
  const { h, IconPlay, IconPause, IconRestart, Button } = FF.ui;

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const words = (s) => s.split(/\s+/).filter(Boolean).length;

  /* Tween two frames. A frame maps actor ids to plain props: numbers tween, everything else comes from the
     frame being moved to. An actor that's only in `to` fades in where it lands (from its `enter` props, if any);
     one that's only in `from` fades out where it was. Props an actor can set on the frame it moves to:
       d       stagger: wait until p = d before moving (0 to 0.9)
       linear  move at a constant speed (a counter, a replay), not eased
       late    fade only at the end of the move (something flying into place, then handing over)  */
  function mix(from, to, p) {
    const out = {};
    const ids = Object.keys(from).concat(Object.keys(to).filter((id) => !(id in from)));
    const shown = (x) => (x ? { o: 1, s: 1, ...x } : x);   // no opacity or scale given = fully shown, full size
    ids.forEach((id) => {
      const A0 = shown(from[id]);
      const B0 = shown(to[id]);
      const lead = B0 || A0;
      const d = (B0 && B0.d) || 0;
      const raw = clamp01((p - d) / Math.max(0.001, 1 - d));
      const t = lead.linear ? raw : ease(raw);
      const A = A0 || { ...B0, o: 0, ...(B0.enter || {}) };
      const B = B0 || { ...A0, o: 0, ...(A0.exit || {}) };
      const m = { ...A, ...B };
      Object.keys(m).forEach((k) => {
        if (typeof A[k] === "number" && typeof B[k] === "number") m[k] = lerp(A[k], B[k], k === "o" && lead.late ? seg(raw, 0.6, 1) : t);
      });
      if (m.o == null) m.o = 1;
      if (m.o > 0.005) out[id] = m;
    });
    return out;
  }

  function timeline(beats) {
    const starts = [];
    let t = 0;
    beats.forEach((b) => { starts.push(t); t += b.anim + b.hold; });
    return { starts, total: t };
  }

  function locate(tl, beats, time) {
    let i = beats.length - 1;
    while (i > 0 && tl.starts[i] > time) i -= 1;
    const local = time - tl.starts[i];
    return { i, p: beats[i].anim ? clamp01(local / beats[i].anim) : 1 };
  }

  // Each beat gets a hold long enough to read its caption: a second, plus about a quarter of a second a word.
  const withHolds = (beats) => beats.map((b) => ({ anim: 1.2, ...b, hold: b.hold != null ? b.hold : 1 + words(b.caption) * 0.26 }));

  function useStageSize(ref, height) {
    const [size, setSize] = useState(null);
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return undefined;
      const measure = () => {
        const w = Math.round(el.clientWidth);
        const hh = Math.round(height(w, window.innerHeight));
        setSize((s) => (s && s.w === w && s.h === hh ? s : { w, h: hh }));
      };
      measure();
      const ro = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
      if (ro) ro.observe(el);
      window.addEventListener("resize", measure);
      return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
    }, []);
    return size;
  }

  function Player({ beats: rawBeats, chapters, stage, stageHeight, end, label }) {
    const beats = useMemo(() => withHolds(rawBeats), [rawBeats]);
    const tl = useMemo(() => timeline(beats), [beats]);
    const reduced = useMemo(reducedMotion, []);
    const endOf = (i) => tl.starts[i] + beats[i].anim;
    const firstOf = (c) => beats.findIndex((b) => b.chapter === c);

    // ?beat=n opens beat n (1-based), paused, once it has moved.
    const startAt = () => {
      const n = Number(new URLSearchParams(window.location.search).get("beat"));
      return n >= 1 && n <= beats.length ? endOf(Math.round(n) - 1) : 0;
    };
    const [time, setTimeState] = useState(startAt);
    const timeRef = useRef(time);
    const setTime = (t) => { timeRef.current = t; setTimeState(t); };
    // null = stopped, "play" = playing, a number = moving to that time, then stopping (a step while paused).
    const [run, setRun] = useState(null);

    useEffect(() => {
      if (run == null) return undefined;
      let raf = 0;
      let last = null;
      const tick = (now) => {
        const dt = last == null ? 0 : Math.min(0.1, (now - last) / 1000);
        last = now;
        let t = timeRef.current + dt;
        if (reduced && run === "play") {
          const at = locate(tl, beats, t);
          if (t < endOf(at.i)) t = endOf(at.i);
        }
        const stop = run === "play" ? tl.total : Math.min(run, tl.total);
        if (t >= stop) { setTime(stop); setRun(null); return; }
        setTime(t);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [run]);

    const { i, p } = locate(tl, beats, time);
    const atEnd = time >= tl.total - 0.001;
    const playing = run === "play";

    const goTo = (j) => {
      const k = Math.max(0, Math.min(beats.length - 1, j));
      if (reduced) { setTime(endOf(k)); if (!playing) setRun(null); return; }
      setTime(tl.starts[k]);
      if (!playing) setRun(endOf(k));
    };
    const play = () => { if (atEnd) setTime(0); setRun("play"); };
    const pause = () => setRun(null);
    const toggle = () => (playing ? pause() : play());
    const next = () => { if (i < beats.length - 1) goTo(i + 1); else if (!atEnd) { setTime(tl.total); setRun(null); } };
    // Back to where the previous beat has finished moving (no backwards animation).
    const prev = () => {
      setTime(i === 0 ? 0 : endOf(i - 1));
      if (!playing) setRun(null);
    };

    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "k" || e.key === "K") { e.preventDefault(); toggle(); }
    };

    // Announce each new beat once, not every frame. Nothing is announced on load.
    const [live, setLive] = useState("");
    const seen = useRef(i);
    useEffect(() => {
      if (seen.current === i) return;
      seen.current = i;
      const b = beats[i];
      setLive(`${b.caption}${b.sr ? ` On screen: ${b.sr}` : ""}`);
    }, [i]);

    const stageRef = useRef(null);
    const size = useStageSize(stageRef, stageHeight);
    const beat = beats[i];
    const chapter = chapters[beat.chapter];
    const total = clock(tl.total);

    return h("section", { "aria-labelledby": "player-title", onKeyDown, className: "rounded-3xl border border-line bg-surface p-3 shadow-[0_1px_0_rgb(var(--line))] sm:p-5" },
      h("h2", { id: "player-title", className: "sr-only" }, label),
      h("div", { className: "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1" },
        h("p", { className: "min-w-0 text-ink" },
          h("span", { className: "mr-2 text-xs font-bold uppercase tracking-[0.08em] text-muted" }, `Chapter ${beat.chapter + 1} of ${chapters.length}`),
          h("span", { className: "font-display text-lg font-semibold" }, chapter.title)),
        h("p", { className: "text-sm tabular-nums text-muted", "aria-hidden": "true" }, `${clock(time)} / ${total}`)),

      // The stage: hidden from screen readers (the captions tell the same story). Click to play or pause.
      h("div", {
        ref: stageRef, "aria-hidden": "true", "data-stage": "", onClick: toggle,
        className: "relative mt-3 cursor-pointer select-none overflow-hidden rounded-2xl border border-line bg-paper",
        style: { height: size ? size.h : stageHeight(800, 800) },
      }, size && stage(i, p, size)),

      h("div", { className: "mt-4 min-h-[5.5rem] px-1 sm:min-h-[4.5rem]" },
        h("p", { key: i, className: "story-caption text-[1.1rem] leading-snug text-ink sm:text-[1.3rem]" }, beat.caption),
        atEnd && end && h("div", { className: "mt-4" }, end({ replay: () => { setTime(0); setRun("play"); } }))),
      h("p", { className: "sr-only", "aria-live": "polite" }, live),

      h("div", { className: "mt-3 flex flex-wrap items-center gap-2 px-1" },
        h(Button, { variant: "secondary", className: "!px-3", onClick: prev, disabled: time <= 0.001, "aria-label": "Previous step" }, h(StepIcon, { back: true })),
        h(Button, { className: "min-w-[8rem]", onClick: toggle },
          h(playing ? IconPause : atEnd ? IconRestart : IconPlay, { className: "h-4 w-4", strokeWidth: 2.5 }),
          playing ? "Pause" : atEnd ? "Watch again" : "Play"),
        h(Button, { variant: "secondary", className: "!px-3", onClick: next, disabled: atEnd, "aria-label": "Next step" }, h(StepIcon)),
        h("p", { className: "ml-auto hidden text-sm text-muted sm:block" }, "Keys: ← → step through · K play or pause")),

      h(Scrubber, { beats, chapters, tl, time, onSeek: (t) => { setTime(t); if (run !== "play") setRun(null); }, label: `${chapter.title}, step ${i + 1} of ${beats.length}: ${clock(time)} of ${total}` }),

      h("ol", { className: "mt-3 flex flex-wrap gap-1.5 px-1", "aria-label": "Chapters" },
        chapters.map((c, k) => {
          const on = k === beat.chapter;
          const done = k < beat.chapter;
          return h("li", { key: c.title },
            h("button", {
              type: "button", onClick: () => goTo(firstOf(k)), "aria-current": on ? "step" : undefined, "aria-label": `Chapter ${k + 1}: ${c.title}`,
              className: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold leading-tight transition-colors ${on ? "border-accent bg-accent-soft text-ink" : done ? "border-line-strong bg-surface text-ink hover:border-ink/60" : "border-line bg-surface text-muted hover:border-ink/60 hover:text-ink"}`,
            },
              h("span", { className: `inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${on ? "bg-accent text-accent-ink" : "bg-sunken"}` }, k + 1),
              h("span", { className: "hidden sm:inline" }, c.title)));
        })),

      h(Transcript, { beats, chapters }));
  }

  const StepIcon = ({ back }) => h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className: "h-4 w-4" },
    h("path", { d: back ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6" }));

  // Chapters as segments of one bar. A native range input sits on top of it, so it scrubs by mouse, touch and keys.
  function Scrubber({ beats, chapters, tl, time, onSeek, label }) {
    const spans = chapters.map((c, k) => {
      const idx = beats.map((b, j) => (b.chapter === k ? j : -1)).filter((j) => j >= 0);
      const from = tl.starts[idx[0]];
      const to = idx[idx.length - 1] + 1 < beats.length ? tl.starts[idx[idx.length - 1] + 1] : tl.total;
      return { from, to };
    });
    const at = (time / tl.total) * 100;
    return h("div", { className: "relative mt-3 h-7 rounded-full px-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-[2.5px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent" },
      h("div", { className: "absolute inset-x-1 top-1/2 flex -translate-y-1/2 gap-1", "aria-hidden": "true" },
        spans.map((s, k) => h("span", { key: k, className: "relative h-2 overflow-hidden rounded-full bg-line", style: { flex: `${s.to - s.from} 1 0` } },
          h("span", { className: "absolute inset-y-0 left-0 bg-accent", style: { width: `${clamp01((time - s.from) / (s.to - s.from)) * 100}%` } })))),
      h("span", { "aria-hidden": "true", className: "pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent shadow", style: { left: `calc(0.25rem + (100% - 0.5rem) * ${at / 100})` } }),
      h("input", {
        type: "range", min: 0, max: tl.total, step: 0.05, value: time, onChange: (e) => onSeek(Number(e.target.value)),
        "aria-label": "Position in the walkthrough", "aria-valuetext": label,
        className: "absolute inset-0 h-full w-full cursor-pointer opacity-0",
      }));
  }

  function Transcript({ beats, chapters }) {
    return h("details", { className: "mt-4 rounded-xl border border-line bg-paper px-3 py-2.5 sm:px-4" },
      h("summary", { className: "cursor-pointer font-bold text-accent" }, "Read it as text instead"),
      h("ol", { className: "mt-3 space-y-4" }, chapters.map((c, k) => h("li", { key: c.title },
        h("h3", { className: "font-display text-lg font-semibold text-ink" }, `${k + 1}. ${c.title}`),
        h("ul", { className: "mt-1.5 space-y-1.5 text-[0.95rem] leading-relaxed text-ink" },
          beats.filter((b) => b.chapter === k).map((b, j) => h("li", { key: j },
            b.caption, b.sr && h("span", { className: "block text-sm text-muted" }, `On screen: ${b.sr}`))))))));
  }

  // How long the beats take to play, in seconds.
  const duration = (beats) => timeline(withHolds(beats)).total;

  FF.player = { Player, duration, mix, ease, seg, lerp, clamp01 };
})();
