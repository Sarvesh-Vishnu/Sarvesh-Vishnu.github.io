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
- Manual light/dark toggle; `prefers-reduced-motion` honored (no motion layer at all)

## Structure

```
.
├── index.html              # single-page portfolio
├── styles.css              # all tokens + components
├── main.js                 # theme toggle, header, fallback reveal
├── motion.js               # Lenis + GSAP layer
├── work/                   # project pages
├── scripts/figures.py      # regenerates the schematic work-grid figures in index.html
├── assets/                 # favicon, OG image, résumé, vendor/
├── sitemap.xml
├── robots.txt
└── .nojekyll               # disables Jekyll on GH Pages
```

The design system lives in `design.md`; structural or visual changes are recorded as §14 amendments.
