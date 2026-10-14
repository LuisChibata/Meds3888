"use strict";
/*
  Shared building blocks, in the style of App/src/ui.js. No JSX: React.createElement via `h`.
  Colours are Tailwind tokens mapped to CSS variables in index.html; use the tokens, not hex.
  Bar colours per kind of points are --kind-<id> in index.html (validated for colour-blind separation).
*/
window.FF = window.FF || {};

(function () {
  const h = React.createElement;

  const Svg = ({ children, className = "h-5 w-5", strokeWidth = 2 }) =>
    h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className }, children);
  const IconCheck = (p) => h(Svg, p, h("path", { d: "M5 12.5l4.5 4.5L19 7.5" }));
  const IconCross = (p) => h(Svg, p, h("path", { d: "M7 7l10 10M17 7L7 17" }));
  const IconInfo = (p) => h(Svg, p, h("circle", { cx: "12", cy: "12", r: "8.5" }), h("path", { d: "M12 11v5M12 8h.01" }));
  const IconChevron = (p) => h(Svg, p, h("path", { d: "M6 9l6 6 6-6" }));
  const IconUp = (p) => h(Svg, p, h("path", { d: "M12 19V5M6 11l6-6 6 6" }));
  const IconDown = (p) => h(Svg, p, h("path", { d: "M12 5v14M6 13l6 6 6-6" }));
  const IconArrow = (p) => h(Svg, p, h("path", { d: "M5 12h14M13 6l6 6-6 6" }));

  function Button({ variant = "primary", className = "", type = "button", children, ...rest }) {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[0.95rem] font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-40";
    const variants = {
      primary: "bg-accent text-accent-ink hover:bg-accent/90",
      secondary: "border border-line-strong bg-surface text-ink hover:border-ink/60",
      quiet: "px-2.5 py-1.5 text-accent hover:bg-accent-soft",
    };
    return h("button", { type, className: `${base} ${variants[variant]} ${className}`, ...rest }, children);
  }

  function Notice({ children, tone = "plain", className = "" }) {
    const tones = { accent: "border-accent/25 bg-accent-soft", ochre: "border-ochre/40 bg-ochre-soft", plain: "border-line bg-surface" };
    return h("div", { className: `flex gap-3 rounded-xl border p-3.5 text-[0.95rem] leading-relaxed text-ink ${tones[tone]} ${className}` },
      h(IconInfo, { className: "mt-0.5 h-5 w-5 shrink-0 text-accent" }),
      h("div", null, children));
  }

  function DemoBadge() {
    return h("span", { className: "inline-flex items-center rounded-md border border-dashed border-ochre/70 bg-ochre-soft px-2 py-0.5 text-xs font-bold text-ochre" }, "Fictional demo profile");
  }

  function Tag({ tone = "plain", children }) {
    const tones = { accent: "bg-accent text-accent-ink", ochre: "border border-ochre/50 bg-ochre-soft text-ochre", plain: "border border-line-strong text-muted" };
    return h("span", { className: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${tones[tone]}` }, children);
  }

  // Legend and table key for a kind of points. The swatch mirrors the bar: a filled rounded rect.
  function Swatch({ kind, className = "" }) {
    return h("span", { "aria-hidden": "true", className: `inline-block h-3 w-3 shrink-0 rounded-[3px] ${className}`, style: { background: `rgb(var(--kind-${kind}))` } });
  }

  function Logo() {
    return h("svg", { viewBox: "0 0 28 28", className: "h-7 w-7", "aria-hidden": "true" },
      h("rect", { x: "3", y: "5", width: "22", height: "4.5", rx: "2.25", fill: "rgb(var(--accent))" }),
      h("rect", { x: "3", y: "11.75", width: "16", height: "4.5", rx: "2.25", fill: "rgb(var(--accent))", opacity: "0.55" }),
      h("rect", { x: "3", y: "18.5", width: "10", height: "4.5", rx: "2.25", fill: "rgb(var(--accent))", opacity: "0.3" }));
  }

  function Header() {
    return h("header", { className: "sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur" },
      h("div", { className: "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8" },
        h("div", { className: "flex items-center gap-2.5" },
          h(Logo), h("span", { className: "font-display text-lg font-semibold tracking-tight text-ink" }, "Thera-Fits"),
          h("span", { className: "hidden rounded-full border border-line-strong px-3 py-1 text-sm text-muted sm:inline" }, "Matching explainer")),
        h("a", { href: "../App/index.html", className: "rounded-md px-1 py-1 text-[0.95rem] font-bold text-accent underline-offset-4 hover:underline" }, "Basic prototype")));
  }

  function Footer() {
    return h("footer", { className: "border-t border-line" },
      h("div", { className: "mx-auto max-w-7xl space-y-2 px-4 py-8 text-sm leading-relaxed text-muted sm:px-8" },
        h("p", { className: "max-w-3xl" },
          "A behind-the-scenes view for the project team. People using Thera-Fits would only see their shortlist: they wouldn't see scores, and therapists are never ranked publicly."),
        h("p", { className: "max-w-3xl" },
          "Thera-Fits is a university design prototype. It doesn't provide therapy, diagnosis or medical advice, and all therapist profiles are fictional. If you need support now, call Lifeline on ",
          h("span", { className: "font-bold text-ink" }, "13 11 14"), ", or ",
          h("span", { className: "font-bold text-ink" }, "000"), " in an emergency.")));
  }

  FF.ui = { h, IconCheck, IconCross, IconInfo, IconChevron, IconUp, IconDown, IconArrow, Button, Notice, DemoBadge, Tag, Swatch, Header, Footer };
})();
