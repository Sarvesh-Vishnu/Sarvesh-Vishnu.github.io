# Portfolio — Design System

A clean, futuristic, minimal portfolio. Confident sans-serif typography paired with deep Prussian Blue accents on a warm off-white canvas. Generous whitespace, deliberate composition, and quiet motion. No clutter, no unnecessary ornamentation — every element earns its place.

The aesthetic is **considered, not decorated**. Swiss design meets technical documentation: precise, structural, forward-looking without being cold.

Target: Lighthouse 95+ on Performance, Accessibility, Best Practices, and SEO.

> **Amendments.** This file is the source of truth for the built site. Where the
> live CSS diverges from the original brief, the change is recorded in §14 with a
> reason. Nothing should be improvised in CSS without landing here first.

---

## 1. Brand Principles

1. **Precision over decoration** — alignment, kerning, and spacing carry the design.
2. **Restraint over excess** — Prussian blue appears sparingly, like punctuation.
3. **Hierarchy through scale and weight** — not through color or boxes.
4. **Motion is intentional** — used to guide attention, never to entertain.

---

## 2. Color System

```css
:root {
  /* Primary accent — Prussian Blue */
  --prussian:        #003153;  /* Hero accent, links, primary CTAs */
  --prussian-deep:   #00253F;  /* Hover states, depth */
  --prussian-soft:   #1A5F8C;  /* Secondary accents */
  --prussian-tint:   #E8EEF3;  /* Tinted accent surfaces */

  /* Neutrals — warm */
  --canvas:          #F7F5F0;  /* Page background */
  --surface:         #FFFFFF;  /* Elevated surface */
  --ink:             #0E0E0E;  /* Primary text — never pure black */
  --ink-soft:        #4A4A48;  /* Secondary text */
  --ink-muted:       #6E6E6A;  /* Captions, meta — see §14.3 */
  --line:            #E2DED4;  /* Hairline dividers */

  /* Functional */
  --success:         #2E5E3E;
  --warning:         #B45309;
  --error:           #9F2B2B;
}

:root[data-theme="dark"] {
  --canvas:        #0E1116;
  --surface:       #161B22;
  --ink:           #F0EFEB;
  --ink-soft:      #B5B3AC;
  --ink-muted:     #7F7D77;   /* see §14.3 */
  --line:          #2A2F38;
  --prussian:      #6FA8D6;   /* Brightened for legibility */
  --prussian-tint: #1A2230;
}
```

**Usage rules**
- Prussian should occupy ~5–10% of any view. Punctuation, not paint.
- Body text is `--ink`, never `#000`.
- Prussian-on-canvas hits ~9:1 — accessible at any size.
- Every text/background pair must clear the §10 minimums. Contrast wins over tone.

---

## 3. Typography

### Stack
```css
--font-sans: 'General Sans', 'Helvetica Neue', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
```

`General Sans` from Fontshare (free, commercial) — geometric sans with subtle character. `JetBrains Mono` from Google Fonts for technical accents (project indices, years, captions, code).

### Scale (modular ratio 1.250)

| Token         | Size    | Use                              |
|---------------|---------|----------------------------------|
| `--text-2xs`  | 11px    | Eyebrows, section labels (§14.2) |
| `--text-xs`   | 12px    | Captions, meta, mono values      |
| `--text-sm`   | 14px    | Secondary text, UI labels        |
| `--text-base` | 16px    | Body                             |
| `--text-lg`   | 20px    | Lead paragraphs                  |
| `--text-xl`   | 25px    | Subheads                         |
| `--text-2xl`  | 31px    | Section headings                 |
| `--text-3xl`  | 39px    | Page headings                    |
| `--text-4xl`  | 49px    | Hero subhead                     |
| `--text-5xl`  | 61px    | Hero display                     |
| `--text-6xl`  | 76px    | Large display                    |
| `--text-7xl`  | 95px    | Display — extended (§14.2)       |
| `--text-8xl`  | 119px   | Display — extended (§14.2)       |
| `--text-9xl`  | 149px   | Display — extended (§14.2)       |

### Weights
- **300 Light** — large display only
- **400 Regular** — body
- **500 Medium** — UI labels, nav
- **600 Semibold** — headings
- 700+ — never

### Line height & tracking
- Hero display (≥95px): `line-height: 0.95`, `letter-spacing: -0.035em`
- Display (31–76px): `line-height: 1.05`, `letter-spacing: -0.02em`
- Body: `line-height: 1.6`, `letter-spacing: 0`
- Mono / UI: `line-height: 1.4`, `letter-spacing: 0`

### Hierarchy patterns
- **Eyebrow / section label**: mono, uppercase, 11px, tracking `0.12em`, `--ink-muted`
- **Section heading**: sans, 600, fluid 39 → 76px
- **Body**: sans, 400, 16–20px, `max-width: 65ch`

### Scale tension (§14.2)
The design's modernity comes from the *gap* between display and label, not from
ornament. Display type runs as large as the viewport allows; mono labels stay
small and tightly tracked. Mid-range sizes (body, subhead, lead) do **not** grow
to match — inflating everything collapses the tension that makes the page work.

---

## 4. Spacing — 4px baseline

```
--space-1:   4px      --space-12:  48px
--space-2:   8px      --space-16:  64px
--space-3:   12px     --space-24:  96px
--space-4:   16px     --space-32:  128px
--space-6:   24px     --space-48:  192px
--space-8:   32px
```

Section vertical padding lives in `--space-32` to `--space-48`. Be generous — whitespace is the design.

---

## 5. Layout

- **Grid**: 12 col desktop / 6 col tablet / 4 col mobile
- **Gutter**: 24px desktop, 16px mobile
- **Max content width**: 1200px
- **Reading width**: 65ch (~720px)

### Breakpoints
```
--bp-sm: 640px    --bp-lg: 1024px
--bp-md: 768px    --bp-xl: 1280px
```

### Page structure (Blueprint, §14.16–14.17)
1. Header — fixed, 64px; hairline border on scroll
2. Hero — the thesis, with a redline under its values; beneath it one plain line:
   name, role, and four links. Nothing else
3. Work — a reel of three sheets: two from work, one personal (§14.15)
4. The path here — two threads that merge (§14.11), with a short bio beside it
5. At a glance — one ledger: role, toolkit, education, writing
6. Contact — "Let's connect."
7. Footer — mono captions and a colophon

---

## 6. Components

### Navigation
- Name/logo (left) — mono, lowercase
- Links (right) — sans, 14px medium
- Hover: prussian underline animates left→right (200ms)
- Theme toggle (far right) — icon only, 18px stroke icon (§14.1)
- No dropdowns, ever

### Project list entry (signature pattern)
```
01    Project Name                                    2025
      Client · Role · Stack
      ──────────────────────────────────────────────
```
- Index number in mono
- Hover: row shifts right 8px, prussian dot appears at left, line darkens
- Click: detail page

### Project detail page
- Hero: section index eyebrow, display title, one-line mono byline
- Result strip: 2–3 outcome figures in display type over mono labels (§14.5).
  **Omitted entirely when the project has no honest metric** — never padded.
- Tools line: mono, muted, below the strip
- Body: 65ch reading column
- Full-bleed image break with mono caption
- "Next project" hairline link at the bottom

### Buttons
- **Primary**: filled prussian, white text, 14px medium, padding 12×24, radius 2px
- **Ghost**: transparent, 1px prussian border
- **Inline link**: text + prussian underline, hover thickens
- No drop shadows. No gradients. Ever.

### Form inputs
- Bottom border only (1px `--line`), no box
- Label above, mono uppercase 11px
- Focus: border becomes prussian, 2px

---

## 7. Motion

> Quiet, purposeful, never gratuitous.

```css
--ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1);
--duration-fast:  150ms;
--duration-base:  250ms;
--duration-slow:  600ms;
```

**Page load choreography (~1.2s total)**
- Hero text: staggered fade-up, 12px translate, 600ms, 80ms stagger
- Header: fades in last

**Scroll-triggered**
- Section headings: fade + 8px translate-up at 20% visibility
- Project rows: 60ms stagger
- Use `IntersectionObserver`, never scroll listeners

**Hover**
- Links: 150ms color transition
- Project rows: 250ms transform + opacity

**Respect `prefers-reduced-motion: reduce`** — disable all transforms, keep opacity changes only.

*The GSAP/Lenis layer, the hero signal and what each effect is for: §14.9.*

---

## 8. Iconography

- Stroke icons only, 1.5px stroke
- Sizes: 18px, 20px, or 24px
- Lucide or Heroicons (outline), or hand-rolled SVG
- Always `currentColor`, never hard-coded fills

---

## 9. Visual Signatures

- **Hairlines**: 1px `--line` dividers between sections, never thicker
- **Mono indices**: project list uses `01`, `02`, `03` — adds technical feel
- **No drop shadows**: depth comes from spacing and typography
- **Subtle grain overlay** on hero (2% opacity noise) — tactile quality without being decorative
- **Asymmetric hero**: name aligned to a 4-column offset, not centered
- **Scale tension**: oversized display against small tracked mono labels (§14.2)

---

## 10. Accessibility

- WCAG AA contrast minimums (body ≥ 4.5:1, large ≥ 3:1) — **binding**; where a
  palette value conflicts, the palette changes, not this rule
- Focus rings: 2px prussian outline, 2px offset, never `outline: none`
- Honor `prefers-reduced-motion`
- Semantic HTML: real headings, landmarks, skip-to-content link
- Any interactive control must expose state (`aria-pressed`, `aria-label`)
- Controls that require JS are hidden via `<noscript>` rather than left dead
- Lighthouse target: **95+ all four categories**

---

## 11. Performance budget

- Initial page weight: < 500KB
- LCP target: < 1.2s
- No frameworks unless justified — vanilla HTML/CSS/JS preferred
- Fonts: `font-display: swap`, preconnect to provider
- Defer all non-critical JS

---

## 12. File structure

```
/
├── index.html
├── styles.css              # tokens + base + components
├── main.js                 # theme toggle, header, fallback reveal, reduced motion
├── motion.js               # Lenis + GSAP layer (§14.9); progressive enhancement only
├── lab.js                  # the models behind the figures (§14.13): pure core + renderers + DOM
├── tests/lab.test.cjs      # node --test: the models, the sentences, the renderers
├── scripts/figures.cjs     # writes the static fallbacks from lab.js into the pages
├── work/                   # project detail pages (four, §14.10)
├── assets/
│   ├── vendor/             # gsap, ScrollTrigger, SplitText, lenis — pinned
│   ├── og-image.png
│   ├── favicon.svg
│   └── resume.pdf
├── design.md               # this file
├── README.md
├── sitemap.xml
├── robots.txt
└── .nojekyll               # disables Jekyll on GH Pages
```

---

## 13. Don'ts (hard constraints)

- ❌ No purple gradients, no glassmorphism, no neon glows
- ❌ No emoji decoration in UI chrome
- ❌ No "scroll to explore" arrows or animated indicators
- ❌ No hero video backgrounds
- ❌ No animated gradient/particle/blob backgrounds
- ❌ No skeuomorphic or layered drop shadows
- ❌ No second accent color — prussian + neutrals only
- ❌ No serifs unless a deliberate editorial moment
- ❌ No frameworks unless the project demands it
- ❌ No testimonial walls, praise carousels, or logo strips (§14.4)

---

## 14. Amendments

### 14.1 — Theme is a manual toggle, not a system read
*Supersedes: original §13 "No dark mode toggle — respect system preference automatically."*

Light is the canonical theme and the first-visit default. A single icon-only
toggle sits in the header; the choice persists in `localStorage`. Dark mode is
opt-in via `:root[data-theme="dark"]` — `prefers-color-scheme` is not consulted.

**Reason.** The palette is tuned for the warm canvas; a system-dark visitor was
being served a theme the design didn't lead with. An explicit control is more
honest than an inferred one. An inline `<head>` script sets the attribute before
first paint so there is no flash, and the control is hidden via `<noscript>`.

### 14.2 — Extended display scale + `--text-2xs`
*Extends: §3 scale table.*

Three display steps added above `--text-6xl` (95 / 119 / 149px, continuing the
1.250 ratio) and one label step below `--text-xs` (11px).

**Reason.** The original ceiling of 76px left the page minimal but not modern.
Contemporary editorial-minimal draws its impact from the *gap* between display
and label. Mid-range tokens are deliberately unchanged — see §3 "Scale tension".

### 14.3 — `--ink-muted` darkened for AA
*Changes: §2 palette. Light `#8A8A86` → `#6E6E6A`. Dark `#7A7872` → `#7F7D77`.*

**Reason.** The original muted grey measured **3.18:1** on `--canvas`, failing
the 4.5:1 body minimum that §10 sets — the spec contradicted itself, and §10
wins. The dark-theme value measured 4.32:1, also short. New values measure
**4.70:1** and **4.63:1** respectively. This token carries the mono meta text
across the whole site, so the failure was site-wide.

### 14.4 — No testimonial surfaces
*Adds to: §13.*

Recommendations and endorsements are not rendered on the site. They live on
LinkedIn, where the reader can weigh them in context and verify the source.

**Reason.** A praise block is the fastest way to make a restrained page read as
a landing page, and quoted praise on a self-published site carries little
evidential weight — the author chose the quotes. Restraint here is also a
credibility argument.

### 14.5 — Byline + result strip replaces the meta grid
*Changes: §6 project detail page.*

The 8-cell key/value grid (Client / Role / Year / Stack / Data / Outcome /
Audience / Status) is replaced by a one-line mono byline plus an optional strip
of 2–3 outcome figures set in display type.

**Reason.** Three failures. Half the cells carried no information — "Status:
Complete", "Audience: General web" existed to fill a grid. "Client" was the
wrong vocabulary for personal builds, independent research, and pro-bono work,
forcing everything into client-services language. And the result — the single
most persuasive fact on the page — was weighted identically to "Audience".

**The strip is not mandatory.** Projects without an honest metric (Numit, whose
premise is that it has no conversion metric; the ESG study, whose answer is a
range) get the byline and go straight to prose. The absence is information: it
tells the reader which work had measurable outcomes. Never invent a figure to
fill the pattern.

### 14.6 — Crosshair cursor over data figures
*Extends: §7 motion, §8.*

Result-strip figures carry `cursor: crosshair`, guarded by `@media (pointer:
fine)` so touch is untouched.

**Reason.** In every charting tool a crosshair means "you are inspecting a
value" — the idiom belongs to a data scientist's page. It is a native cursor
keyword: no JavaScript, no follower-dot lag, and it survives Windows
high-contrast mode where a custom `url()` cursor would vanish. Follower dots and
`cursor: none` are rejected — they hide the true pointer (an accessibility
regression) and read as generic. The crosshair passes §7's test ("guide
attention, never entertain"); a lagging blob does not.

### 14.7 — Timeline section (career spine)
*Superseded by §14.11 (two threads).*

*Adds: §5 page structure — §01 "Timeline", before Selected work.*

An overture section between the hero and the project list: a vertical timeline of
real, dated milestones (2019 Foundations → 2025 → Commercial &amp; executive), a
Prussian rail with dots, mono years, and one-line descriptions. Pure CSS, no JS,
responsive by default.

**History.** This slot first held a duration-bar chart, then a compounding
"combined-capability" curve (an inline-SVG line whose y-axis was a named thesis,
not a measured score). Both are retired. The curve was defensible but the subject
preferred a plain timeline — no y-axis to defend at all — so the honest floor is
simply: real dates, real facts, no invented quantity. That is the strongest
position of the three.

The section sits before Selected work so the arc ("who I am, where I'm from")
frames the projects rather than mixing with them. A genuine *time series* (a
measured value over time) still belongs in a project-page slot, built from real
project data — never fabricated here.

### 14.8 — Independent work, proof links, and the end of "Earlier work"
*Superseded in part by §14.10: the separate Independent work section and the
"Earlier" line are gone; the hero proof links stand.*

*Adds: §5 sections 5 (Independent work) and the hero proof-link row.
Changes: "Selected work" is renamed "Professional work"; Numit moves from it to
Independent work; the "Earlier work" rows collapse to one muted line.*

The audience is a hiring reviewer giving the page about a minute. Employer work
can never show code, so the independent builds have to carry the verifiable
evidence — and before this section existed, none of them were linked at all.

**The row pattern.** Hairline rows, not cards (§5 still holds): a 16:10
screenshot of the real, live product; a mono kicker; the name; one sentence of
claim; then a **proof line** — mono, behind a 2px Prussian rule — that states
only facts checkable at the link (test counts, eval scores, named data
sources). Then text links: Live ↗, Code ↗, Slides ↗, Case study →. A project
gets a Code link only when its repository is public; no dead or "coming soon"
links. The screenshot link is `tabindex="-1"` and `aria-hidden`, so keyboard
and screen-reader users meet each destination once, through its text link.
Images are 960×600 WebP, lazy-loaded with explicit dimensions (no layout shift);
all five together weigh ~135 KB.

**Order.** Follows the Product-DS-led positioning: Foresight (forecasting and
backtesting rigor), Nakshaa (retrieval evaluation), Pukhuri (public data), Haq
(on-device LLM with hallucination control), Numit (data journalism).

**Honesty notes carried on the page.** Pukhuri's free hosting sleeps after 48
hours idle, so its row says the first load can take ~30 seconds rather than
letting a reviewer think it is broken.

**Hero proof links.** GitHub · LinkedIn · Email · Résumé, directly under the
role line: a reviewer reaches code or contact in one click from the top.

**Earlier work.** Four coursework/side items had no link, code, or result to
inspect. At this bar, rows without evidence dilute the rows with it, so they
are now one muted line — breadth stays visible, without competing.


### 14.9 — Motion system v2: GSAP + Lenis, spent in one place
*Extends: §7 motion. On the home page, when motion is on, ScrollTrigger replaces
§7's "IntersectionObserver, never scroll listeners" rule. Also §11, §12.*

§7's test governs every effect: it must point at real content, or it does not ship.
The motion budget is spent in one place, the path (§14.11). Everything else is a
quiet reveal, and the hero never moves.

**Libraries, vendored and pinned, with no build step.** GSAP 3.15.0 core +
ScrollTrigger + SplitText (all free since Webflow's acquisition) and Lenis 1.3.27
(MIT, licence header kept), served from `assets/vendor/` with no runtime CDN; all
`defer`. lenis.css is inlined into styles.css. Project pages load Lenis only
(`autoRaf`), not GSAP.

**What moves.**

| Element | Effect |
|---|---|
| The path (§14.11) | both threads draw with scroll (scrubbed, so they follow you both ways); dots light as the line reaches them; the merge curves meet; today's dot sends out one ring, once |
| Section titles | lines rise out of a mask, once (SplitText) |
| Rows marked `.reveal` | batched fade-up as they enter |
| Scrolling | Lenis smooth scroll; in-page links glide to a −72px header offset; skip link left native |

**What does not, and why.**
- *Hero.* Static. The name, role and tagline are the first read; any entrance makes
  a reviewer wait, and the hero text sits on the LCP path.
- *Considered, built, and cut.* A hero "signal" (India's monthly temperature with a
  backtested 24-month forecast): rigorous, but it said nothing about the work. A
  skills ticker that sped up with scroll: unverifiable keywords as decoration.
  Decrypting labels, count-up figures, magnetic buttons: each added movement and no
  meaning. Removed rather than tuned.
- *Vanta.js.* Rejected: ~120 KB gzipped, three.js r134, no reduced-motion handling,
  recognisably stock looks, and it breaks §13 (no animated backgrounds).
- *React Bits.* Not a dependency (React-only, MIT + Commons Clause). The one pattern
  kept, SplitText line reveal, is plain GSAP.

**Guarantees.**
- *Reduced motion.* An inline `<head>` script sets `.motion` only when the reader has
  not asked for reduced motion; without it motion.js exits, Lenis is never created,
  and the path renders fully drawn.
- *Failure.* motion.js marks `.motion-gsap` when it takes over. main.js clears that
  class and every inline style it set if motion.js throws (`motion:fail`) or has not
  set `motion-ready` within 3s. Nothing can stay hidden or undrawn.
- *No JS.* The path is complete in CSS (lines, dots, merge); reveals are forced
  visible by `<noscript>` styles.

### 14.10 — One work list, best work only
*Changes: §5. "Professional work" and "Independent work" become one section,
"§ 02 — Work / Selected work."*

The page now carries only work that clears the bar a top-tier DS reviewer sets. A
thinner page of strong rows beats a fuller page where weaker rows dilute the strong
ones. Two section names ("Projects I've recently shipped", "Shipped, with the
evidence attached") also read as a claim each; one neutral heading lets the rows
speak.

**In:** Cooper Surgical (AOP analytics: quota across 75+ territory managers, ensemble
forecasting for 25+ product lines), Western Virginia Water Authority (failure
prediction on 20 years of CMMS data, ~$150K value), Pinnacle Fertility (NLP on 100K+
patient records), Numit (live, independent). One tile pattern for all four (§14.12);
Numit is marked "Independent build" in its meta line.

**Out, and why:** Nicholas School audience analytics (solid numbers, but reads as
marketing rather than DS at this bar; still named on the path); ESG causal study (no
result or code on its page); Blue Cross (2022, pro bono, ~5% lift); the "Earlier"
line; and, at the owner's call, Foresight, Nakshaa, Pukhuri and Haq until they reach
the bar set for this page. Their pages and screenshots are removed from the site (history
keeps them).

### 14.11 — The path here: two threads, one practice
*Supersedes: §14.7.*

The career spine is drawn as two lanes that merge. **Technical** (filled dots): SRM's
CS / AI & ML degree, Siemens. **Business** (hollow dots): Deloitte Strategy &
Analytics, Duke Fuqua. The technical lane runs on beside the business one; both
curve into a single, heavier line, and every role since sits on it (ringed dots):
Pinnacle and the Nicholas School, Western Virginia Water, Cooper Surgical. The two
lanes are named in words on their rows (Technical / Business), so the encoding never
rests on shape alone; the merged line goes unlabelled on purpose: the picture and the
title say it.

**Why this picture.** The positioning, a data scientist who is also fluent in
strategy, is the Product-DS pitch. The merge says it in one look, and it is an
honest diagram: real dates, real roles, no invented quantity (the lesson of §14.7).

**Mechanics.** Lanes sit at fixed fractions of a 64px rail (48px under 640px):
technical 10/48, business 38/48, merged 24/48. The merge is an SVG drawn on the same
48-unit grid, stretched to the rail with `non-scaling-stroke`, so the curves meet the
lanes at any width. Each line is a hairline track with a Prussian fill whose length
is `--p` (1 when static). One accent, monochrome encoding by position and dot shape.

### 14.12 — Work as figure-led tiles
*The static schematics described here are superseded by the working models of §14.13;
the tile pattern, the honesty rule and the 2×2 grid stand.*

*Changes: §6's hairline project list (home page only) becomes a 2×2 grid of tiles; one
column under 768px. Project pages are unchanged.*

The owner asked for a more visual preview. Three of the four entries are client work,
so their pictures cannot be screenshots. Each instead gets a **method figure**: a
small, paper-style schematic of how the work was done, drawn in the page's own ink and
Prussian, tagged "Schematic" on the tile.

- **Cooper Surgical:** history, then four model forecasts (ARIMA, Prophet, SARIMAX,
  Boosting) fanning out, with the ensemble in Prussian through their spread.
- **Western Virginia Water:** cumulative failure probability over 18 months for
  several assets; the flagged one (Prussian) crosses the replacement threshold inside
  the shaded 6–12-month window, which is the project's lead time.
- **Pinnacle Fertility:** diverging sentiment bars for 12 facilities (negative in
  Prussian, positive in neutral), one facility emphasised.
- **Numit:** the live product's real screenshot, tagged "Live product".

**Honesty rule.** The shapes illustrate the method; none of the values are client data,
and the tag says so. Real figures from the work (75+, 25+, $150K, 6–12 months, 100K+,
12 facilities) appear only where the case study states them.

**Mechanics.** Inline SVG, 400×250 viewBox (16:10, the same as the tile and the
screenshot), so the figures theme with the tokens and cost no requests. Mono labels are
10 user units; secondary labels (`.fig-minor`) hide under 640px, where they would fall
below ~9px. On hover, the Prussian line of the figure redraws once (CSS only; off under
reduced motion). The art comes from a deterministic generator (fixed seeds), so a
redraw gives identical figures.

### 14.13 — Figures that answer back
*Extends: §14.12 (tiles), §6 (project pages), §7. Adds `lab.js`.*

Designer portfolios win attention with craft, because craft is their work. A data
scientist's craft is the analysis, so the page lets the reader operate it. This is the
explorable-explanation tradition (Bret Victor, Distill, Ciechanowski): reactive figures
with the author doing their share, never a sandbox with no guidance.

**Three instruments, one per client project.** Each restates a line the case study
already makes, on synthetic data, with real arithmetic in the browser.

| Project | Instrument | The reader moves | What it shows |
|---|---|---|---|
| Cooper Surgical | The committee | the month forecasting starts; which members sit | four forecasters (seasonal naive, Holt-Winters, harmonic regression, Theta) refit on the past only; their mean is never the worst, and is better on average than any member |
| WV Water | The list | the replacement budget | failures prevented by the model's ranking, by oldest-first, and by chance |
| Pinnacle | The sample | comments read per facility; a redraw | when a facility ranking is luck and when it is signal (Wilson intervals; rank stability over 300 redraws) |

**Two scales of the same figure.**
- *Home tile:* the figure follows the pointer across it (or, with no pointer, the tile's
  trip up the screen), and the tile's tag becomes a live readout. Clicking still opens
  the case study.
- *Case study:* the instrument leads the page, inside the first screen. Real form
  controls (range, checkbox, button), direct dragging on the figure, and two sentences
  that are rewritten from the model's output on every change: what you are looking at
  now, and what holds across every setting.
- A tile's figure grows into its instrument through a cross-document view transition
  (CSS only; browsers without it just navigate; off under reduced motion).

**Honesty rules.**
- Every instrument carries a note: the data is synthetic, what the production method
  was, and how the in-browser version differs. Real project figures appear only where
  the case study states them.
- No sentence is written by hand around a number. `sayCommittee`, `sayList` and
  `saySample` build the text from what the model returned, and tests assert the text
  contains exactly those numbers.
- Nothing is tuned to flatter. The committee claim that is guaranteed (never worse than
  its average member) is stated as arithmetic; the counts that are not guaranteed are
  whatever the backtest returns.

**Architecture (`lab.js`, no dependencies).** Pure model functions with a seeded
generator, then pure renderers `(state, {w, h, full}) -> SVG string`, then a thin DOM
layer. Figures render at real pixel size, so mono labels are one size on every screen;
under 620px the labels leave the plot (a legend for the committee, in-plot labels for
the list). `tests/lab.test.cjs` covers the models (including a no-leakage test: the
forecasters must give identical output when the future is corrupted), the sentences and
the renderers. `scripts/figures.cjs` uses the same renderers to write the static
fallbacks, so readers without JavaScript get a complete figure and a true sentence.

**Accessibility.** The instrument is fully operable from the keyboard through its form
controls; the sentence is an `aria-live` region; the figure itself is decorative to
assistive tech because the sentence carries its content. Pointer-following on tiles is
the reader's own movement, so it stays on under reduced motion; scroll-following does
not.

**Also in this change.** Work now precedes The path here. The share card
(`og-image.png`) is redrawn with the correct title and the committee figure, its URL is
absolute, and case studies carry share tags. Native controls follow the page theme
(`color-scheme`), not the operating system.

### 14.14 — v3: thesis first, four movements, one voice
*Changes: §5 structure, §3 display weights, §6 project prose, §9 hero. The version
before this is tagged `v2.0`.*

v2 put working models behind the projects but kept a conventional shell: a name for a
hero and seven numbered sections, three of them résumé filler. v3 rebuilds the shell
around the same idea.

**Hero.** The name becomes a masthead (still the `h1`). The display line is the thesis,
"I build models that end in a decision.", set light and full-measure. Under it is a
sentence in which one number is a slider (`role="slider"`, drag or arrow keys): change
the replacement budget and the other numbers and the strip figure follow. It is the
smallest possible explorable explanation, in the first screen, and it comes from a real
project (the list, §14.13). Once, shortly after load, the number moves out and back on
its own to show that it can; it never repeats and is skipped under reduced motion. The
"Drag the number" hint only appears when the script is running.

**Four movements instead of seven sections.** Work; The path here, with three short
paragraphs of the bio beside it (sticky on wide screens); At a glance, a single ledger
that absorbs Stack, Recognition and Writing; Contact. Cut: the two long bio paragraphs
that repeated the path and the work, and the Deloitte and IBM certificates.

**One voice.** Display type is light throughout: section titles drop from 600 to 400,
case-study titles to 400, and "Let's talk." is set at display size in 300 so the page
ends the way it began. Emphasis comes from size and from Prussian, not from weight.

**Case-study prose.** From 900px up, section names (Objective, Approach, Outcome, What
I'd do next) sit in the left margin as mono side-heads and the text keeps its reading
measure beside them, like a paper. Pure CSS grid; below 900px they stack as before.

### 14.15 — v4: three projects in a reel, and the first pass with the house skill
*Changes: §5, §14.12 (the 2×2 grid is replaced), §14.13 (which instruments are
mounted), §14.14 (hero sentence). Built on v3. (2026-11-12)*

**Three projects.** Two from work, one personal:
- *Commercial operations and analytics* (Cooper Surgical): the planning analytics,
  plus the LangGraph research companion, described by method only.
- *Natural language processing* (Pinnacle Fertility and Siemens).
- *Numit* (personal).

The Western Virginia Water tile and page are removed for now; the role stays on the
path. Old addresses (`cooper-surgical.html`, `pinnacle-fertility.html`,
`wv-water.html`) are redirect stubs. The list model stays in `lab.js`, tested, unmounted.

**The reel.** The owner asked for a larger, more visual display "like a carousel".
One slide at a time at up to 1040px, each led by a 16:9 stage: the working model for
work projects (rendered with its labels at this size), the live product for Numit.
It is a native scroll-snap row, so swipe, trackpad, scroll and Tab work with no
script; the script adds the index, the arrows and the counter. The next slide always
shows its edge. Nothing advances by itself.

**Work and personal, told apart three ways.** The index groups the names under
"Work" and "Personal"; each slide has a kind line ("Work · Cooper Surgical",
"Personal project"); and the mark beside it reuses the path's vocabulary, filled for
work and hollow for personal.

**Hero sentence.** Now driven by the committee model, since the water project left:
"Forecast the next year from [month] with four models and they miss by X to Y. Their
average misses by Z, and over N starting months it was never the worst of them." The
month is the slider. Every number, and the closing clause, comes from `heroParts()`.

**Title.** Senior Data Scientist, everywhere it appears (masthead, path, ledger,
page title, structured data, share card).

**Copy.** New lines on the home page and the two added case-study sections (the
research companion; Siemens) are drafts for the owner to edit. The companion is
described at the level of method and public sources: no internal name, no outputs.

**Found by the tells scan and fixed** (munnetrum-design skill, first run: 14 findings
down to 3):
- *Content hidden until a script reveals it.* `.reveal` now starts visible; it is
  hidden only under `.js`, which an inline script sets and removes again if `main.js`
  has not reported within 4s.
- *Numbers on sections with no order.* "§ 01 — Work" becomes "Work".
- *Dashes as separators* in the path rows become full stops.
- *Figure labels at 10.5px* become 11px. One hard-coded white becomes a token.
- *Kept, with a reason recorded in the CSS:* the header's backdrop blur, which is a
  real layering case.
- *Left for the owner:* em-dash density in the long-form prose, which is their voice.

**Considered and rejected.** An auto-advancing carousel (movement without cause, and
it takes control from the reader). Arrows only, with no index (the work/personal
split would rest on one small label). Keeping four tiles (the owner asked for three
and for size). Dragging the reel with the mouse (it would fight the figures, which
follow the pointer).

### 14.16 — Blueprint
*Supersedes: §2 colour, §3 typefaces, the warm-paper atmosphere of §1 and §9, and the
hero of §14.14. Branch `blueprint`, built on v4. (2026-11-12)*

The owner asked to drop the warm paper feel and for fresh ideas, then chose this
direction. Cream grounds have also become one of the most recognisable signs of a
generated page.

**The idea.** Prussian blue is this site's colour, and it is the pigment blueprints
were made with. A blueprint is a model drawn before anything is built or decided. So
the site is one: Prussian is the ground, everything is drawn in near-white linework,
and a single vermilion redline marks the one thing a figure or sentence is about, the
way an engineer marks a revision.

**Colour.** Two sheets, one drawing. The toggle switches between them; the blue sheet
is the default (`data-theme="blue"`, stored as `sheet` in localStorage).

| Token | Blue sheet | White print | Role |
|---|---|---|---|
| `--canvas` | `#003153` | `#FFFFFF` | the sheet |
| `--surface` | `#053A61` | `#F4F8FB` | a panel on it (figure stages) |
| `--ink` | `#F4F8FB` | `#003153` | text (13.4:1 / 13.4:1) |
| `--ink-soft` | `#CFE0EC` | `#1F4E73` | supporting text |
| `--ink-muted` | `#94B6CF` | `#4D7391` | labels (6.3:1 / 5.0:1) |
| `--line` | `#2A5A7E` | `#C6D6E2` | hairlines |
| `--mark` | `#F4F8FB` | `#003153` | drawn lines, links, outlines |
| `--accent` | `#FF7A59` | `#C93B1A` | the redline (5.2:1 / 5.0:1) |
| `--accent-deep` | `#FF977C` | `#A82E12` | its hover |
| `--tint` | `#0B446F` | `#EAF1F6` | hover wash |

The old single accent is split into two roles. `--mark` is linework. `--accent` is the
redline and stays rare: the committee's line in a figure, the facilities that stand
apart, the live readout, the draggable word, the current sheet in the index, the
primary button, today's dot on the path, and the underline in the thesis. If a second
thing on a screen wants the redline, one of them is wrong.

**Long reading sits on paper.** Case-study prose is wrapped in `.paper`, which applies
the white-print tokens to that block: a white sheet laid on the blue one. Deep blue is
comfortable for a screen of display type and figures, not for eight paragraphs.

**Type.** IBM Plex Sans (300, 400, 500) and IBM Plex Mono (400, 500), from one
provider. An engineering-document voice; display stays light. General Sans and
JetBrains Mono carried the paper look and are gone, and one of two render-blocking
font requests went with them.

**Hero.** The thesis is now the owner's: "Building forecasts, AI systems and civic
tools with purpose, meaning, integrity and care." The four values carry the redline.
"Care" was chosen over "passion" and "love": it is plainer, it is what the civic work
shows, and "passionate" is on the list of words that say nothing. The forecasting
sentence stays beneath it as "a small proof". The figure is now a proper drawing
beside it, and under the drawing sits the **title block**: drawn by, role, revision,
and how to reach him. The name (`h1`) lives there.

**Character, shown rather than claimed.**
- *General notes*: six standing rules, set the way a drawing lists its notes. Four are
  the owner's own words from this site and his other projects; two are drafts.
- *A reason on every sheet*: each project carries one line on why it mattered. Numit's
  is the owner's sentence from its case study.
- *Contact*: "Especially about work that has to be right, and work that has to matter."
- *Colophon*: "Drawn in Prussian blue, the pigment of the blueprint."

**The reel** counts in sheets ("Sheet 1 of 3"). Its first slide now shows *the record*
(the committee's miss and each member's, for every starting month), so the hero's
figure is not repeated one scroll later.

**Print is the résumé.** A print stylesheet lays the page out as a two-page CV on the
white print: thesis, title block with addresses spelled out, the three projects with
their reasons, the path, the ledger. Instruments, controls and navigation are left
off. First pass; it replaces nothing yet (`assets/resume.pdf` is still linked).

**Considered and rejected.**
- *Grid-paper background.* The colour and linework carry the idea; a fake grid is
  ornament, and it is on the tells list.
- *A fixed title block in the corner of the viewport.* It would cover content at
  laptop widths. It sits in the hero instead; the header keeps Contact in reach.
- *Vermilion for links and the path.* Too much red. Linework is white; the redline
  means "this one".
- *Bench (white, colour only in data)* and *Control room (graphite and amber)*: the
  other two directions offered. Safer and more common, in that order.
- *"Passion" or "love"* in the thesis: see Hero.

### 14.17 — Blueprint, after the owner's review
*Changes: §14.16 (hero, colour values, General notes, contact). (2026-11-12)*

**Hero, quieted.** The draggable "small proof" sentence, its drawing and the title
block are removed. The owner found the proof gimmicky and the boxed introduction
heavy. The hero is now the thesis alone, and under it one unboxed line: name, role,
links. Nothing was put in their place: the working models start one scroll down, in
the reel, where they belong to a project. `mountHero` and `heroParts` are deleted
from `lab.js`.

**A deeper blue.** The ground moves from `#003153` to `#0A2240`: less green, darker,
closer to ink and navy. This is nearer the pigment's own masstone. All dependent
values moved with it.

| Token | Blue sheet | White print |
|---|---|---|
| `--canvas` | `#0A2240` | `#FFFFFF` |
| `--surface` | `#0F2C52` | `#F3F6FA` |
| `--ink` | `#F3F6FA` (15.0:1) | `#0A2240` (15.0:1) |
| `--ink-soft` | `#CBD7E7` | `#23406A` |
| `--ink-muted` | `#8FA9C8` (6.6:1) | `#4E6A8E` (5.5:1) |
| `--line` | `#27456F` | `#C9D4E2` |
| `--mark` | `#F3F6FA` | `#0A2240` |
| `--accent` | `#FF7A59` (6.3:1) | `#C93B1A` (5.0:1) |
| `--accent-deep` | `#FF977C` | `#A82E12` |
| `--tint` | `#14365F` | `#EAF0F7` |

What the colour is for: steadiness and trust (navy), authorship and permanence (ink),
and focus (a quiet, dark field). Its risk is coldness, which the vermilion, the light
type and the human copy are there to offset. The sheet toggle stays; the owner likes it.

**General notes removed.** A list of rules was too direct. The signal is carried more
quietly instead: the redline under the four values, one reason on each project, the
honesty notes that already sit under every instrument, and a colophon ("Every figure
here is computed in your browser, from data labelled as synthetic.").

**Contact, warmer.** "Let's connect." with a note that is open to ideas, shared work
and roles.

**Kept at the owner's request:** the path, and the sheet toggle.

**Considered and rejected.** Replacing the proof with another hero device (a number, a
smaller figure): the hero reads better with nothing. Keeping the title block without
its border: it was the introduction-as-form that felt heavy, not only the lines.

### 14.18 — The first project: a drawing of the system, and no synthetic numbers
*Changes: §14.13 (which instruments are mounted), §14.15 and §14.16 (first slide).
(2026-11-15)*

**The concern.** The owner: with synthetic numbers on a figure about employer work,
"either we are sharing a work within our professional career that we shouldn't or it
feels confusing as a reader." Both halves are right. A labelled synthetic forecast
still reads, at a glance, like a company's numbers, and a reader who notices the
label has to work out what they are looking at.

**The rule that follows.** A figure about employer work carries no data values at
all, real or synthetic. It may show structure: what was built and how the parts
connect.

**What replaced it.** The Cooper Surgical slide and the instrument on its case study
are now *the spine*: a drawing of the system in five columns (sources, spine,
analysis, surfaces, decisions) with the real component names. Six decisions sit on
the right. Pointing at any label, or pressing a decision's button, lights the path
that feeds it in the redline, and a sentence states that path in words. Under 900px
the map becomes a trace: one decision's path, read top to bottom. With no pointer,
the decisions light one after another as the slide scrolls.

It is the Blueprint idea used literally (a drawing of what was built), and it shows
the thing a forecast chart could not: the breadth of the work and the ownership of
the whole system. The picture and the sentence are both read from one table of
paths (`SP_PATHS` in `lab.js`), so they cannot disagree.

**A quiet signal in the drawing.** The research companion's line runs from public
sources to the weekly brief without touching the internal spine. The rule "nothing
internal goes in" is visible as geometry, and a test asserts it.

**Copy.** The slide and case study are rewritten from the owner's account of the
role: Commercial Excellence (building the spine, reporting, the annual operating
plan, a cross-sell experiment owned end to end), then Strategy and Market Insights
as Senior Data Scientist (business performance, SKU-by-country demand forecasts,
long-range planning, price elasticity, market research), and the research companion.
Counts the owner states (75+ territory managers, 25+ product lines) stay; no results
or internal names appear.

**Retained but unmounted.** The committee, record and list models stay in `lab.js`
with their tests. The sample model followed them two days later (§14.19).

**Considered and rejected.** Keeping the forecast with its numbers removed (a chart
without values is decoration). A synthetic A/B-test figure for the cross-sell work
(still numbers, and it would repeat the second slide's statistics).

### 14.19 — The second project: one comment, marked up
*Changes: §14.13 (which instruments are mounted), §14.18 (the sample is unmounted).
(2026-11-17)*

**The concern.** The owner, on the sample figure: "the visual is confusing and not
fairly representative." It answered a statistics question next to the work (how many
comments before a facility ranking can be trusted) with synthetic percentages. A
visitor saw dots and intervals and learned nothing about what the pipeline does to a
comment. It also broke the §14.18 rule.

**The rule that follows.** A figure shows the work itself, not a neighbouring
question about it. For text work, the text is the picture.

**What replaced it.** *The reading*: one comment set large in Plex Mono and marked up
the way the pipeline reads each record, in five steps.

| Step | What appears |
|---|---|
| As written | the comment, plain |
| Cleaned | filler words fade (a real stoplist, `RD_STOP`) |
| Tone | a bracket on each remark, labelled unhappy or pleased |
| Touchpoint | the part of the visit each remark is about |
| Driver | the one remark that counts toward a driver of satisfaction, in the redline |

The leaders grow as more is read into a remark, so the annotation builds outward
from the words. On the home slide, moving across the figure (or scrolling the slide
up the screen) advances a step at a time, and the five steps sit along the foot. On
the case study the steps are buttons, and there are three comments to choose from:
a mixed one (the lead), a pleased one, and a billing complaint. Under 620px the
callouts become underlines and a short ledger.

**No numbers.** Nothing on the figure is a quantity. The sentences are built from the
same table as the drawing (`RD_COMMENTS` in `lab.js`) and a test asserts they carry
no digits. The only counts on the page are the owner's own (100K+ records, 12
facilities), in the standing line under the figure.

**The comments are written for the page.** They are examples in the style of patient
feedback, never a patient's words. The home tile says so in its tag ("Written for
this page"), and the case study says so in its note. Each has exactly one driver, so
the redline stays single.

**Two quiet signals.** The lead comment is mixed: two unhappy remarks and one
pleased. Scored as a whole it would average out to neutral, which is the reason the
work cut sentiment by touchpoint. The second comment contains "never felt lost": a
word count reads "lost" as a complaint, and the tone step says why that is wrong.

**Open with the owner.** The drawing shows tone and touchpoint attached to remarks
inside a comment. If the Pinnacle models scored whole records and took the
touchpoint from a field on the record, the brackets should become one label per
comment. The Siemens work has no figure yet; it needs the owner's account first.

**Also changed.** The footer line now reads "The drawings are made in your browser.
None of them contains company or patient data." Both mounts skip a redraw when
nothing changed, so moving within a step restarts no animation.

**Considered and rejected.** A pile of strokes sorting into theme rows (row lengths
read as quantities). A second pipeline schematic (two system diagrams back to back).

