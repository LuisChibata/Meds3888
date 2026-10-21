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
  const IconMinus = (p) => h(Svg, p, h("path", { d: "M6 12h12" }));
  const IconPlay = (p) => h(Svg, p, h("path", { d: "M8 5.5v13l10.5-6.5z", fill: "currentColor" }));
  const IconPause = (p) => h(Svg, p, h("path", { d: "M8 5.5v13M16 5.5v13" }));
  const IconRestart = (p) => h(Svg, p, h("path", { d: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" }));

  // How each label from matching/records.js looks, on both pages. Never colour alone: every label has its own
  // icon, and its name goes in the text or the accessible label next to it.
  const RECORD_LOOK = {
    helped: { Icon: IconCheck, cell: "border-accent/45 bg-accent-soft text-accent" },
    worse: { Icon: IconCross, cell: "border-ochre/55 bg-ochre-soft text-ochre" },
    same: { Icon: IconMinus, cell: "border-line-strong bg-sunken text-muted" },
    not_enough: { Icon: null, cell: "border-dashed border-line-strong bg-surface text-muted" },
    nobody: { Icon: null, cell: "border-line/70 bg-transparent text-muted" },
  };
  const recordLook = (rec) => (rec.people || rec.waiting ? RECORD_LOOK[rec.label] : RECORD_LOOK.nobody);

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

  function DemoBadge({ children = "Fictional demo profile" }) {
    return h("span", { className: "inline-flex items-center rounded-md border border-dashed border-ochre/70 bg-ochre-soft px-2 py-0.5 text-xs font-bold text-ochre" }, children);
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

  // page: "story" (story.html, the walkthrough) or "details" (index.html). Each links to the other.
  function Header({ page = "details" } = {}) {
    const link = "rounded-md px-1 py-1 text-[0.95rem] font-bold text-accent underline-offset-4 hover:underline";
    const story = page === "story";
    return h("header", { className: "sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur" },
      h("div", { className: "mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8" },
        h("a", { href: "../index.html", className: "flex shrink-0 items-center gap-2.5 rounded-md", "aria-label": "Thera-Fits: about the project" },
          h(Logo), h("span", { className: "font-display text-lg font-semibold tracking-tight text-ink" }, "Thera-Fits"),
          h("span", { className: "hidden rounded-full border border-line-strong px-3 py-1 text-sm text-muted md:inline" }, story ? "How it works" : "Matching details")),
        h("nav", { className: "flex items-center gap-3 sm:gap-4", "aria-label": "Thera-Fits" },
          h("a", { href: "../index.html", className: `${link} hidden sm:inline` }, "About"),
          story
            ? h("a", { href: "index.html", className: link }, h("span", { className: "sm:hidden" }, "Details"), h("span", { className: "hidden sm:inline" }, "Explore the details"))
            : h("a", { href: "story.html", className: link }, "How it works"),
          h("a", { href: "../App/index.html", className: link }, h("span", { className: "sm:hidden" }, "Demo"), h("span", { className: "hidden sm:inline" }, "Try the demo")))));
  }

  function Footer({ page = "details" } = {}) {
    return h("footer", { className: "border-t border-line" },
      h("div", { className: "mx-auto max-w-7xl space-y-2 px-4 py-8 text-sm leading-relaxed text-muted sm:px-8" },
        h("p", { className: "max-w-3xl" }, page === "story"
          ? "A walkthrough of how Thera-Fits would work. People using it would only see their own profile and shortlist: never scores, and therapists are never ranked publicly."
          : "A behind-the-scenes view for the project team. People using Thera-Fits would only see their shortlist: they wouldn't see scores, and therapists are never ranked publicly."),
        h("p", { className: "max-w-3xl" },
          "Thera-Fits is a university design prototype. It doesn't provide therapy, diagnosis or medical advice, and all therapist profiles are fictional. If you need support now, call Lifeline on ",
          h("span", { className: "font-bold text-ink" }, "13 11 14"), ", or ",
          h("span", { className: "font-bold text-ink" }, "000"), " in an emergency.")));
  }

  FF.ui = { h, IconCheck, IconCross, IconInfo, IconChevron, IconUp, IconDown, IconArrow, IconMinus, IconPlay, IconPause, IconRestart, RECORD_LOOK, recordLook, Button, Notice, DemoBadge, Tag, Swatch, Header, Footer };
})();
