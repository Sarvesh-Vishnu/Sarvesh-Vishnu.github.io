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
  `assets/vendor/`, loaded as progressive enhancement (`motion.js`)
- Manual light/dark toggle; `prefers-reduced-motion` honored (no motion layer at all)

## The hero signal

The chart under the hero is real: India's monthly mean temperature (Copernicus ERA5 via
Our World in Data, CC BY 4.0) with a 24-month forecast. The model is backtested before
any number reaches the caption. To refresh it with new data:

```bash
python3 scripts/build_signal.py   # needs numpy; rewrites the signal block + assets/data/signal.json
```

## Structure

```
.
├── index.html              # single-page portfolio
├── styles.css              # all tokens + components
├── main.js                 # theme toggle, header, signal readout, fallback reveal
├── motion.js               # GSAP + Lenis layer
├── work/                   # project pages
├── data/                   # signal source data
├── scripts/build_signal.py # signal model + backtest
├── assets/                 # favicon, résumé, screenshots, vendor/, data/
├── sitemap.xml
├── robots.txt
└── .nojekyll               # disables Jekyll on GH Pages
```

The design system lives in `design.md`; structural or visual changes are recorded as §14 amendments.
