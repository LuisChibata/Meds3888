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

  // The group's logo mark (head and puzzle piece), traced from documents/logo.jpeg. Same shape as img/logo.svg.
  const LOGO_PATH = "M62.0 0.2L63.9 0.3L65.6 0.5L67.4 0.8L69.0 1.2L70.7 1.7L72.2 2.2L73.7 2.8L75.0 3.4L76.3 4.1L77.6 4.9L79.0 5.9L80.4 7.0L81.8 8.3L83.2 9.6L84.4 10.9L85.5 12.3L86.4 13.7L87.3 15.0L88.1 16.4L88.7 17.8L89.3 19.2L89.7 20.7L90.1 22.3L90.4 24.0L90.7 25.8L90.9 27.6L91.0 29.4L91.0 31.1L91.0 32.8L91.0 34.2L90.9 35.2L90.8 35.8L90.6 36.1L89.9 36.3L88.7 36.5L87.0 36.6L84.9 36.6L83.2 36.7L82.1 37.0L81.4 37.5L81.3 38.1L81.1 38.7L80.7 39.4L80.3 40.1L79.8 40.8L79.2 41.4L78.7 41.9L78.1 42.3L77.6 42.5L77.0 42.7L76.3 42.8L75.7 42.9L74.9 42.9L74.3 42.8L73.6 42.7L73.0 42.5L72.5 42.3L72.0 42.0L71.5 41.6L71.0 41.3L70.6 40.8L70.2 40.3L69.9 39.6L69.6 38.8L69.4 37.9L68.5 37.2L67.1 36.7L65.0 36.5L62.3 36.4L60.3 35.6L59.0 34.1L58.3 31.9L58.2 28.9L58.4 26.6L58.8 25.0L59.5 24.0L60.4 23.7L61.2 23.3L61.9 22.9L62.5 22.4L63.0 21.9L63.4 21.3L63.7 20.7L64.0 20.2L64.1 19.6L64.2 18.9L64.2 18.1L64.0 17.3L63.8 16.4L63.5 15.6L63.0 14.8L62.5 14.2L61.9 13.7L61.3 13.2L60.6 12.8L59.9 12.6L59.2 12.4L58.7 11.5L58.3 10.0L58.1 7.8L58.1 5.0L58.2 2.8L58.3 1.3L58.6 0.5L58.9 0.3L59.5 0.2L60.6 0.1ZM46.9 11.4L47.6 11.4L48.2 11.4L48.6 11.5L48.8 11.6L49.0 11.7L49.1 12.5L49.2 13.9L49.2 16.0L49.3 18.8L49.4 20.9L49.6 22.3L49.8 23.0L50.2 23.0L50.5 23.1L50.9 23.2L51.3 23.4L51.8 23.6L52.3 23.9L52.7 24.2L53.2 24.6L53.6 25.0L54.0 25.5L54.3 26.0L54.6 26.5L54.8 27.0L55.0 27.7L55.1 28.4L55.2 29.2L55.2 30.1L55.1 30.9L55.0 31.7L54.8 32.3L54.6 32.8L54.3 33.4L53.9 33.9L53.4 34.5L52.9 35.0L52.3 35.5L51.7 35.8L51.1 36.1L50.4 36.3L49.9 37.1L49.6 38.6L49.4 40.6L49.4 43.4L49.9 45.4L51.0 46.9L52.7 47.6L54.8 47.8L56.5 47.9L57.6 48.2L58.1 48.5L58.1 48.8L58.2 49.3L58.3 49.8L58.5 50.3L58.7 50.9L59.0 51.5L59.4 52.0L59.8 52.5L60.3 53.0L60.8 53.4L61.3 53.8L61.7 54.0L62.2 54.2L62.8 54.3L63.3 54.4L64.0 54.5L64.6 54.5L65.3 54.4L65.9 54.3L66.4 54.1L67.0 53.9L67.5 53.6L68.0 53.2L68.4 52.8L68.9 52.3L69.2 51.7L69.6 51.0L69.9 50.1L70.2 49.2L71.1 48.4L72.5 47.9L74.4 47.7L76.9 47.7L78.8 47.7L80.1 47.8L80.8 48.0L80.9 48.2L81.0 51.5L81.1 58.0L81.1 67.6L81.1 80.4L81.1 90.0L81.0 96.4L80.9 99.7L80.8 99.8L78.6 99.9L74.3 100.0L67.9 100.0L59.4 100.0L53.1 100.0L48.8 99.9L46.5 99.8L46.4 99.7L46.3 99.4L46.3 98.9L46.2 98.2L46.2 97.4L46.2 96.6L46.2 96.0L46.1 95.4L45.9 94.9L45.8 94.4L45.5 93.8L45.2 93.2L44.9 92.5L44.4 91.9L43.9 91.2L43.3 90.6L42.6 90.0L41.9 89.5L41.0 89.0L40.1 88.6L39.1 88.2L37.6 87.9L35.7 87.7L33.4 87.7L30.6 87.7L28.2 87.5L26.1 87.2L24.5 86.8L23.2 86.3L22.1 85.7L21.1 85.0L20.2 84.3L19.5 83.5L18.9 82.7L18.3 81.9L17.9 81.1L17.5 80.4L17.2 79.5L16.9 78.6L16.7 77.5L16.5 76.5L16.4 75.2L16.3 73.6L16.3 71.9L16.4 70.0L16.4 68.5L16.4 67.5L16.3 66.9L16.2 66.8L15.8 66.6L15.1 66.5L14.2 66.3L13.0 66.1L11.9 65.9L11.1 65.6L10.4 65.2L9.9 64.8L9.5 64.3L9.3 63.9L9.1 63.3L9.0 62.8L9.1 62.3L9.2 61.7L9.3 61.2L9.6 60.6L10.2 59.5L11.2 57.9L12.6 55.8L14.3 53.1L15.7 51.0L16.6 49.4L17.1 48.3L17.3 47.8L17.3 46.9L17.4 45.7L17.3 44.1L17.3 42.1L17.3 40.5L17.3 39.1L17.4 38.0L17.5 37.3L17.7 36.3L18.0 35.1L18.4 33.8L18.9 32.3L19.4 30.9L19.9 29.6L20.5 28.4L21.1 27.3L21.9 26.1L23.0 24.7L24.2 23.2L25.7 21.6L27.0 20.2L28.3 18.9L29.5 17.9L30.6 17.2L31.7 16.4L33.0 15.7L34.3 15.0L35.7 14.3L37.2 13.7L38.9 13.1L40.8 12.6L42.8 12.1L44.4 11.7L45.8 11.5Z";

  function Logo() {
    return h("svg", { viewBox: "0 0 100 100", className: "h-7 w-7", "aria-hidden": "true" },
      h("path", { d: LOGO_PATH, fill: "rgb(var(--logo))" }),
      h("rect", { x: "74.1", y: "14.8", width: "4.8", height: "14.5", rx: "1", fill: "rgb(var(--logo-cross))" }),
      h("rect", { x: "69.3", y: "19.6", width: "14.5", height: "4.8", rx: "1", fill: "rgb(var(--logo-cross))" }));
  }

  function Header({ onHome }) {
    return h("header", { className: "sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur" },
      h("div", { className: "mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8" },
        h("button", { type: "button", onClick: onHome, className: "flex items-center gap-2.5 rounded-md py-1", "aria-label": "Thera-Fits home" },
          h(Logo), h("span", { className: "font-display text-lg font-semibold tracking-tight text-ink" }, "Thera-Fits")),
        h("div", { className: "flex items-center gap-4" },
          h("span", { className: "hidden rounded-full border border-line-strong px-3 py-1 text-sm text-muted sm:inline" }, "Prototype for testing"),
          h("a", { href: "../index.html", className: "rounded-md px-1 py-1 text-[0.95rem] font-bold text-accent underline-offset-4 hover:underline" }, "About"))));
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
