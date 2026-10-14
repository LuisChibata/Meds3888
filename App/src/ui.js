"use strict";
/*
  Shared building blocks, carried over from documents/FIT-FIRST prototype (1).html.
  No JSX: React.createElement via the `h` alias. Colours are Tailwind tokens mapped to CSS variables
  in index.html (paper surface sunken ink muted line accent ochre); use the tokens, not hex.
*/
window.FF = window.FF || {};

(function () {
  const h = React.createElement;

  const Svg = ({ children, className = "h-5 w-5", strokeWidth = 2 }) =>
    h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className }, children);
  const IconCheck = (p) => h(Svg, p, h("path", { d: "M5 12.5l4.5 4.5L19 7.5" }));
  const IconBack = (p) => h(Svg, p, h("path", { d: "M15 6l-6 6 6 6" }));
  const IconNext = (p) => h(Svg, p, h("path", { d: "M9 6l6 6-6 6" }));
  const IconInfo = (p) => h(Svg, p, h("circle", { cx: "12", cy: "12", r: "8.5" }), h("path", { d: "M12 11v5M12 8h.01" }));

  function Button({ variant = "primary", className = "", type = "button", children, ...rest }) {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-40";
    const variants = {
      primary: "bg-accent text-accent-ink hover:bg-accent/90",
      secondary: "border border-line-strong bg-surface text-ink hover:border-ink/60",
      quiet: "px-3 text-accent hover:bg-accent-soft",
    };
    return h("button", { type, className: `${base} ${variants[variant]} ${className}`, ...rest }, children);
  }

  function ScreenTitle({ children, className = "" }) {
    return h("h1", { id: "screen-title", tabIndex: -1, className: `font-display text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.025em] text-ink focus:outline-none sm:text-[2.4rem] ${className}` }, children);
  }

  function Page({ width = "max-w-3xl", children }) {
    return h("div", { className: `mx-auto w-full ${width} px-4 pb-20 pt-8 sm:px-8 sm:pt-12` }, children);
  }

  function DemoBadge() {
    return h("span", { className: "inline-flex items-center rounded-md border border-dashed border-ochre/70 bg-ochre-soft px-2 py-0.5 text-xs font-bold text-ochre" }, "Fictional demo profile");
  }

  // Photo, or initials if the therapist has none. Decorative: the name is always written next to it.
  function Avatar({ t }) {
    const ring = "h-16 w-16 shrink-0 rounded-full border border-line-strong";
    if (t.photo) return h("img", { src: t.photo, alt: "", width: 64, height: 64, className: `${ring} bg-sunken object-cover` });
    return h("span", { "aria-hidden": "true", className: `${ring} inline-flex items-center justify-center bg-paper font-display text-xl font-semibold text-ink` }, t.initials);
  }

  const LEVELS = {
    strong: { label: "Strong" },
    partial: { label: "Partial" },
    limited: { label: "Less aligned" },
    info: { label: "Information" },
  };

  // Shape differs per level, and the level is also written out: alignment never relies on colour alone.
  function AlignMark({ level }) {
    if (level === "strong") {
      return h("span", { className: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink", "aria-hidden": "true" },
        h(IconCheck, { className: "h-3.5 w-3.5", strokeWidth: 3 }));
    }
    if (level === "partial") {
      return h("span", { className: "inline-flex h-6 w-6 shrink-0", "aria-hidden": "true" },
        h("svg", { viewBox: "0 0 24 24", className: "h-full w-full" },
          h("circle", { cx: "12", cy: "12", r: "10", fill: "none", stroke: "rgb(var(--ochre))", strokeWidth: "2.2" }),
          h("path", { d: "M12 2a10 10 0 0 1 0 20z", fill: "rgb(var(--ochre))" })));
    }
    if (level === "limited") {
      return h("span", { className: "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-line-strong text-muted", "aria-hidden": "true" },
        h("svg", { viewBox: "0 0 24 24", className: "h-3.5 w-3.5" }, h("path", { d: "M6 12h12", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round" })));
    }
    return h("span", { className: "inline-flex h-6 w-6 shrink-0 items-center justify-center text-muted", "aria-hidden": "true" }, h(IconInfo, { className: "h-5 w-5" }));
  }

  function Notice({ children, tone = "accent", className = "" }) {
    const tones = { accent: "border-accent/25 bg-accent-soft", ochre: "border-ochre/40 bg-ochre-soft", plain: "border-line bg-surface" };
    return h("div", { className: `flex gap-3 rounded-xl border p-4 text-[0.95rem] leading-relaxed text-ink ${tones[tone]} ${className}` },
      h(IconInfo, { className: "mt-0.5 h-5 w-5 shrink-0 text-accent" }),
      h("div", null, children));
  }

  function Logo() {
    return h("svg", { viewBox: "0 0 28 28", className: "h-7 w-7", "aria-hidden": "true" },
      h("rect", { x: "3", y: "5", width: "22", height: "4.5", rx: "2.25", fill: "rgb(var(--accent))" }),
      h("rect", { x: "3", y: "11.75", width: "16", height: "4.5", rx: "2.25", fill: "rgb(var(--accent))", opacity: "0.55" }),
      h("rect", { x: "3", y: "18.5", width: "10", height: "4.5", rx: "2.25", fill: "rgb(var(--accent))", opacity: "0.3" }));
  }

  function Header({ onHome }) {
    return h("header", { className: "sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur" },
      h("div", { className: "mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8" },
        h("button", { type: "button", onClick: onHome, className: "flex items-center gap-2.5 rounded-md py-1", "aria-label": "Thera-Fits home" },
          h(Logo), h("span", { className: "font-display text-lg font-semibold tracking-tight text-ink" }, "Thera-Fits")),
        h("span", { className: "rounded-full border border-line-strong px-3 py-1 text-sm text-muted" }, "Prototype for testing")));
  }

  function Footer() {
    return h("footer", { className: "border-t border-line" },
      h("div", { className: "mx-auto max-w-5xl px-4 py-8 text-sm leading-relaxed text-muted sm:px-8" },
        h("p", { className: "max-w-3xl" },
          "Thera-Fits is a university design prototype. It doesn't provide therapy, diagnosis or medical advice, and all therapist profiles are fictional, with free stock photos. If you need support now, call Lifeline on ",
          h("span", { className: "font-bold text-ink" }, "13 11 14"), ", or ",
          h("span", { className: "font-bold text-ink" }, "000"), " in an emergency.")));
  }

  // One answer option. Native radio/checkbox underneath, so keyboard and screen readers work as usual.
  function Choice({ type, name, checked, disabled, onChange, children }) {
    return h("label", { className: `relative flex ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}` },
      h("input", { type, name, className: "peer sr-only", checked, disabled, onChange }),
      h("span", { className: "flex w-full items-center gap-3 rounded-xl border border-line-strong bg-surface px-4 py-3 text-[1rem] text-ink transition-colors hover:border-ink/60 peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:font-bold peer-focus-visible:outline peer-focus-visible:outline-[2.5px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" },
        h("span", { className: `inline-flex h-5 w-5 shrink-0 items-center justify-center border ${type === "radio" ? "rounded-full" : "rounded"} ${checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong"}`, "aria-hidden": "true" },
          checked && (type === "radio" ? h("span", { className: "h-2 w-2 rounded-full bg-accent-ink" }) : h(IconCheck, { className: "h-3.5 w-3.5", strokeWidth: 3.5 }))),
        children));
  }

  // Small inline toggle for "must-have".
  function Toggle({ checked, onChange, children }) {
    return h("label", { className: "inline-flex cursor-pointer items-center gap-2 text-[0.95rem] text-ink" },
      h("input", { type: "checkbox", checked, onChange, className: "h-4 w-4 accent-[rgb(var(--accent))]" }),
      children);
  }

  FF.ui = { h, IconBack, IconNext, IconInfo, Button, ScreenTitle, Page, DemoBadge, Avatar, LEVELS, AlignMark, Notice, Header, Footer, Choice, Toggle };
})();
