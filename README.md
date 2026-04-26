# sarveshvishnu.github.io

Personal portfolio — Sarvesh Vishnu Muhundu Parthiban.

Vanilla HTML / CSS / JS. No build step. Hosted via GitHub Pages from `main` at `/`.

## Local

```
npx serve . -l 4321
# → http://localhost:4321
```

## Stack

- HTML5 + CSS custom properties
- JetBrains Mono (Google Fonts) + General Sans (Fontshare)
- IntersectionObserver for reveal motion
- `prefers-color-scheme` for auto dark mode
- `prefers-reduced-motion` honored

## Structure

```
.
├── index.html              # single-page portfolio
├── styles.css              # all tokens + components
├── main.js                 # reveal + header on scroll
├── sitemap.xml
├── robots.txt
├── .nojekyll               # disables Jekyll on GH Pages
├── assets/
│   └── favicon.svg
└── work/
    └── project-template.html
```

Design system is documented separately in `design.md` (kept out of the repo).
