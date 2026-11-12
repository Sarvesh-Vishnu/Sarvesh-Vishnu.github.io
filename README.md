# Sarvesh-Vishnu.github.io

Personal portfolio — Sarvesh Vishnu Muhundu Parthiban.

Vanilla HTML / CSS / JS. No build step. Hosted via GitHub Pages from `main` at `/`.

## Local

```
npx serve . -l 4321
# → http://localhost:4321
```

## Stack

- HTML5 + CSS custom properties, no build step
- JetBrains Mono (Google Fonts) + General Sans (Fontshare)
- Motion: GSAP 3.15 (ScrollTrigger, SplitText) + Lenis 1.3.27, vendored and pinned in
  `assets/vendor/`, loaded as progressive enhancement (`motion.js`); project pages load Lenis only
- Figures are working models (`lab.js`) that run in the browser on synthetic data;
  tested with `node --test tests/lab.test.cjs`
- Design work follows the `munnetrum-design` skill; `node ~/.claude/skills/munnetrum-design/scripts/tells.mjs .` scans for tells
- Manual light/dark toggle; `prefers-reduced-motion` honored (no motion layer at all)

## Structure

```
.
├── index.html              # single-page portfolio
├── styles.css              # all tokens + components
├── main.js                 # theme toggle, header, fallback reveal
├── motion.js               # Lenis + GSAP layer
├── work/                   # project pages
├── lab.js                  # the working models behind the figures
├── tests/lab.test.cjs      # node --test tests/lab.test.cjs
├── scripts/figures.cjs     # node scripts/figures.cjs: static fallbacks for the figures
├── assets/                 # favicon, OG image, résumé, vendor/
├── sitemap.xml
├── robots.txt
└── .nojekyll               # disables Jekyll on GH Pages
```

The design system lives in `design.md`; structural or visual changes are recorded as §14 amendments.
