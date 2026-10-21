"use strict";
// Tailwind's config for the explainer's pages: the colour tokens in site/theme.css, and the two fonts.
// Loaded right after the Tailwind CDN script.
(function () {
  const twVar = (name) => `rgb(var(--${name}) / <alpha-value>)`;
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          paper: twVar("paper"), surface: twVar("surface"), sunken: twVar("sunken"), ink: twVar("ink"), muted: twVar("muted"),
          line: twVar("line"), "line-strong": twVar("line-strong"),
          accent: twVar("accent"), "accent-ink": twVar("accent-ink"), "accent-soft": twVar("accent-soft"),
          ochre: twVar("ochre"), "ochre-soft": twVar("ochre-soft"),
        },
        fontFamily: {
          display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
          sans: ['"Atkinson Hyperlegible"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        },
      },
    },
  };
})();
