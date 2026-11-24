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
- **Body**: sans, 400, 16–20px (18px on a phone), `max-width: 56ch`, about 70 characters (§14.23)

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
- **Reading width**: 56ch, about 70 characters of running text (§14.23; was 65ch)

### Breakpoints
```
--bp-sm: 640px    --bp-lg: 1024px
--bp-md: 768px    --bp-xl: 1280px
```

### Page structure (Blueprint, §14.16–14.17)
1. Header — fixed, 64px; hairline border on scroll
2. Hero — the thesis, with a redline under its values; beneath it one plain line:
   name, role, and four links. Nothing else
3. Work — a reel of four sheets: three from work, one personal (§14.15, §14.20)
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
- Body: 56ch reading column (§14.23)
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

*(Superseded by §14.23: prose now follows the sheet the reader chose.)*
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
| `--ink-muted` | `#A9BED8` (8.4:1; was `#8FA9C8`, §14.23) | `#4E6A8E` (5.5:1) |
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

### 14.20 — A fourth sheet: the water plan
*Changes: §14.15 (the reel now has four sheets: three work, one personal), §14.13
(which instruments are mounted). (2026-11-17)*

**Why it is back.** The owner asked for more work on the reel and chose the Western
Virginia Water Authority project. It is the one work project whose purpose is public
on its face: a utility cannot replace every pipe, so the order matters.

**The old figure could not return.** It counted failures prevented among four
hundred synthetic mains, which is the thing §14.18 rules out.

**What replaced it.** *The plan*: a small pipe network drawn for the page, in
linework, like a utility plan. The mains on the replacement list are in the redline.
The reader can raise the budget, switch the list between "the model" and "oldest
first", and point at (or tap) any main to read, in words, what the model sees there
and where each list puts it. Listed by age the picks bunch in the old town; listed by
the model they also reach younger mains in heavy clay or with breaks on record. That
contrast is the whole argument of the project, and it needs no numbers.

**No counts, no results.** The drawing and its sentences state shares in words
("about half", "most") and positions in words ("near the top"). Tests assert that no
digit appears in the figure or the sentence at any budget. The budget control reads
"a short list", "a longer list". The owner's own published facts ($150K, 6 to 12
months, 20+ years) stay in the facts strip, where they were on the live site.

**What is invented, and said so.** The network, the mains and their attributes are
made up (`plan()` in `lab.js`, seeded). The "model" in the drawing is a plain
weighted sum of age, soil, past breaks, road and material, a stand-in for the real
gradient-boosted model. The tile's tag reads "Drawn for this page" and the case-study
note says the network is not the Authority's. The plan carries "NOT TO SCALE".

**The reel.** Order: Commercial analytics, Language at scale, Water mains, then
Numit under Personal. The counter reads "Sheet N of 4". The print résumé still fits
two pages.

**Open with the owner.** Whether age, soil, past breaks, traffic and material are a
fair plain-language account of what the real model leaned on.


### 14.21 — A fifth sheet: Obscure, the route
*Changes: §14.15 (the reel now has five sheets: three work, two personal), §14.13
(which instruments are mounted). (2026-11-17)*

**Why.** ObscureMusicRecSys is the strongest public evidence of recommender and
experimentation depth: a six-part benchmark on one leakage-free split, off-policy
evaluation and bandits, and a live app. The owner chose to add it as the first
personal sheet, before Numit.

**The figure: the route.** Five steps from a song many people know to one almost
nobody plays, on a listeners axis (log scale), so the route is seen leaving the
head. The route is the redline; the same seed's route at the other pull setting is a
faint dashed line, so the trade-off is on the drawing. Stops are named in linework
on wide sheets, the reached stop in the margin. The tile walks the route out a step
at a time as the slide travels up the screen (or as the pointer crosses it). The
case study adds real form controls: three seeds and pull none / strong.

**The one figure with values on it.** §14.18 rules out data values on employer work.
This is a personal project on public, CC0 data, so the values are real and shown:
listener counts, the plays behind each step, whether a step was made again after the
cutoff. The data is generated from the ObscureMusicRecSys export (`OB` in `lab.js`,
with its source commit in the comment), never typed; the sentences are built from
it, and the benchmark line is built from `results/phase4.json` figures in the same
constant. The tile's tag reads "Real data · ListenBrainz".

**Seeds.** Take On Me (the app's landing seed, chosen there by rule), Everybody
Wants to Rule the World, and Co2 by Prateek Kuhad. Co2 is there for the readers this
site is for: with strong pull its route stays in Indian independent music; without
it, it wanders. Its sentence also says plainly that none of its steps were repeated
after the cutoff, because India is thin in ListenBrainz.

**Tests.** Every route has five stops, no repeated artist, counts within bounds; the
sentence names the end and its zone and the repeated-step count exactly; no label
runs off either edge at 320 to 1040 px.

**Considered and rejected.** Showing the standard recommender's five picks as a
cluster at step one (a second idea on one drawing; the case study prose carries it).
A screenshot of the app (the drawing is the argument; the app is one link away).

**Open with the owner.** All copy on the slide and the case study is a draft for
the owner's edit.

### 14.22 — The fifth sheet: Numit, the globe
*Changes: §14.15 (the last sheet was the only one still showing a screenshot), §14.13
(which instruments are mounted), §14.21 (a second figure with real values). (2026-11-17)*

**Why.** Numit's slide was a cropped capture of the WebGL globe: the only raster on a
reel of drawings, with a cut-off wordmark in the corner, and nothing the reader could
do with it. Its case study had also drifted from the product. It still described a live
GDELT and ACLED stream that Numit switched off in July, and it never linked the site.

**The one idea.** Numit's own line: "Same world, different facing." A reader should
see, in one drawing, that the breaking and the repair sit on the same globe, and that
every mark is a real, sourced event.

**The figure: the globe.** An orthographic globe in linework: sphere, a faint
graticule, a simplified coastline. Each of Numit's curated events is one mark. Shadow
events are the redline; light events are drawn in linework (white on the blue sheet)
and sit on top, ringed in the ground colour so they stay separate. Mark size follows
severity or strength. The key doubles as the count: "293 of 356 in view".

**Shadow first.** In the product you meet the crisis before the response. The tile
keeps that order: as the slide travels up the screen (or the pointer crosses it) the
world turns to face the reader with shadow only, and the light marks then arrive a
few at a time. The static fallback and the resting state show both.

**Real data, the second exception to §14.18.** A personal project on the author's own
published list, so the counts are real and shown. `NM` in `lab.js` is generated by
`scripts/numit_data.cjs` from the Numit repository (its commit is in the constant):
position, weight and country for every event, the snapshot date, the number of light
events that state what they grew out of, and the size of the representation floor read
from Numit's own CI check. The words (title, place, source, date) are a separate file,
`assets/data/numit-events.js`, loaded only by the case study, so the home page does not
carry them. The facts strip on the case study is written by `scripts/figures.cjs` from
the same constant. Nothing is typed. Re-run the generator when Numit is refreshed.

**The case study instrument.** Real controls: Show (shadow, light, both), Turn the
globe (a range), and Read a mark (previous and next step through the marks in view,
west to east, so the keyboard can read any event). With a pointer: drag sideways to
turn, point at a mark to read it; on touch, tap. A plate beside the mark gives place,
what happened, source and date on wide sheets; the sentence under the figure gives the
same in full at every width, and adds what a light event grew out of when Numit records
it.

**Coastline.** Natural Earth 1:110m (public domain), outer rings only, simplified to
about 1,400 points and stored as quarter-degree steps. Drawn as whole-pixel relative
path steps, which keeps the static fallback near 13 KB.

**Copy.** A non-English name never stands alone: the slide's kind line and the case
study's eyebrow now give the meaning ("sun" in Meitei). The Approach list was corrected
to what Numit is today: the curated list is the globe; the live feed was built and
switched off because it placed stories in the outlet's country; the credibility index
is the author's own; the representation floor and the computed "world as of" date are
named. The case study links the live site.

**Tests.** Every mark is placed and has a title, place, source and date from the same
commit; a face holds exactly the marks in front of it (visibility is worked out a
second way in the test); shadow shows before light and the light only grows; the
sentence and the key state the counts the view computed; every mark in view can be
reached by stepping and read with its source; nothing, the plate included, leaves the
drawing from 320 to 1040 px.

**Considered and rejected.** A better screenshot, or the shadow and light diptych made
for the essay (still a picture of the product, not something to read; the product is
one link away). Two globes side by side (half the size on a phone, and it separates
what the product insists is one world). Lines from each light event to the break it
grew out of (Numit records that as a sentence, not as a link between events). Event
categories in the sentence (about one event in seven has no category). Carrying source
links on the portfolio (the links live on Numit, next to the full text).

**Print.** With five sheets the print résumé had grown to three pages (it was last
checked at four). The space between sheets and sections in the print stylesheet was
tightened by a few points and it is two pages again.

**Known limit.** On the white print the light marks are ink, darker than the shadow
marks. The key names them; the meaning of "light" is carried by the label there, not
by the colour.

**Open with the owner.** The corrected Approach bullets, the lab title and lede, the
meaning line and the slide's meta line are drafts.

### 14.23 — Readability on the blue sheet
*Changes: §2 and §14.17 (`--ink-muted`), §3 (reading width, small type), §14.16 (long
reading on `.paper`), §14.2 (what 11px is for). (2026-11-17)*

**Why.** An audit of every text style on every page, both sheets, at 1440 and 375 px
(contrast against the real background, size, weight, measure, tap size). Everything
passed AA. Five things still stood between a new reader and the content, and the owner
asked for all five.

**1. Small grey lines that carry information.** Employer, role, dates, what a number
means, tool lists and the notes that say a figure is invented were 11px mono in
`--ink-muted` (6.6:1 on the sheet, 5.8:1 on a panel). `--ink-muted` on the blue sheet
is now `#A9BED8` (8.4:1 and 7.4:1). Informative lines move from 11px to 12px: stat
labels, bylines, tool lists, path dates, at-a-glance labels, slide kind lines and the
side-heads of case-study prose. Figure notes move to 13px in `--ink-soft`. 11px stays
for pure labels: eyebrows, tile tags, figure labels, control labels. The white print's
muted colour is unchanged.

**2. Long reading follows the sheet.** `.paper` used to turn case-study prose white
inside the blue sheet: a 16:1 jump in brightness for the longest reading on the site,
and a white page for a reader who had chosen the dark one. `.paper` no longer sets its
own colours. Prose sits on whichever sheet the reader chose (about 11:1 at 20px on
blue), set apart by a hairline and the room above it. The white print is one click
away, as before. This reverses "long reading sits on paper" in §14.16.

**3. Measure.** `--reading-max` was `65ch`, which is 80 to 85 characters of running
text at 20px, because a `ch` is the width of a zero and the average letter is narrower.
It is now `56ch`: 48 to 74 characters a line in the audit.

**4. The redline as small text.** Vermilion text at 11 to 13px on a panel was 5.4:1 on
blue and 4.7:1 on white. Small text in the accent now uses `--accent-deep` (6.6:1 and
6.3:1): live tile tags, accented figure labels, the pressed button, the slider's
output, the highlighted words of the reading. Lines, marks and rules keep `--accent`.

**5. Phone.** Running text is 18px (`--text-md`) at 640px and below, which gives about
38 characters a line instead of 33. Nav links, the brand, the hero links, byline links
and the at-a-glance links are padded to at least 24px tall, and sliders to 28px, with
no change to where the text sits.

**After.** No text style on the blue sheet is under 6.6:1 except the disabled reel
arrow (exempt) and the LinkedIn button label at 6.2:1. No tap target is under 24px
except one link inside a sentence (exempt, 23px).

**Considered and rejected.** Softening the paper to an off-white instead of removing
it (still a white page in a dark room). Lifting the white print's muted colour too
(not asked for; it passes, and the size change helps there as well). Raising figure
labels above 11px (their layout is computed from character widths, and they are labels,
not sentences). A prefers-color-scheme default (the blue sheet is the design; the
toggle is in the header).

### 14.24 — A broader opening, the Obscure slide, and a résumé that agrees with the site
*Changes: §14.16 and §14.17 (the hero's line), §14.21 (the route figure), §14.16 (print
as the résumé). (2026-11-18)*

**Why.** The owner: "Building forecasts, AI systems and civic tools" reads as niche. The
site should speak to a tech recruiter, a UN official and a general reader, and carry
confidence, integrity and trust throughout. Asked to choose between a more technical
line and a more general one, the owner did not want to narrow the offer either way.

**The hero: two registers at two sizes.** The large line is general and makes one
claim: "Data science and AI that people can trust." It names the field in the words a
recruiter searches for and states the value in words anyone understands; the redline is
under "people can trust". A proof line under it carries the technical range and the
sectors in two plain sentences: forecasting, experiments, language models and
recommender systems; a medical-device business, a water authority, the world's crises.
Each item in it is backed by a sheet on the reel. The name, role and links are
unchanged. The values list (purpose, meaning, integrity, care) leaves the hero; the
site shows them in how the work is presented. Both lines are drafts for the owner.

**Trust said where the reader is looking.** The note above the reel now says what the
figures are: every one works, employer figures show the method and never company data,
personal ones run on real public data. The footer keeps its shorter version.

**The Obscure slide.** The route was a line with artist names on it and no start. A
general reader could not tell it was a walk between songs.
- Every stop is now a song: title and artist, and at the two ends how many people play
  it. Names alternate sides so two neighbours share one gap, one above the line and one
  below, and a name never sits on the route.
- The axis title hid behind the tile's tag. The unit now sits under the top tick.
- Under 860px a step is too narrow for a name, so the two ends are named under the
  plot: where the route starts and where it has got to.
- The dashed comparison line is drawn only on the case study, where it is labelled
  ("with strong pull"). On the tile it was an unexplained second line.
- "Head" and "long tail" move to whichever part of their line no song name occupies.
- The slide's description leads with what the thing does in plain words and ends with
  the methods a recruiter looks for.
Tests: both ends named with their counts for every seed; no two labels overlap and
nothing leaves the drawing, for every seed, pull and step at nine widths.

**The résumé.** The linked PDF was a Word export from July 2026 that named the old
role and older figures (70+ managers, 20+ product lines, 50K+ records) and carried a
phone number. `resume.html` is now the résumé: one column, real text, plain headings,
A4, two pages, set in the white print's type and colours. `scripts/resume_pdf.cjs`
prints it to `assets/resume.pdf`, so the file the site links cannot drift from the
page, and redraws the share card from the hero's line in the same run. Content comes
only from the previous résumé and from this site: current title and figures, the
cross-sell experiment, SKU-level forecasting and the research assistant added; Obscure,
Numit and On Paper added as projects; course lists removed; "C-suite" corrected to the
directors actually named. No phone number on the public copy. The home page's print
stylesheet stays a tidy two pages but is no longer the résumé.

**Wording, for confidence without overclaiming.** Three places undersold the work in
the owner's own prose and were rewritten as drafts: the first and third paragraphs
beside the path ("the more interesting bits", "Outside the dashboards", "more than is
strictly necessary"), and "wearing several hats … ad-hoc requests" on the Cooper case
study. The non-profit is now described by what it worked on, the UN Sustainable
Development Goals, as the résumé always has. Nothing was made larger than its source.

**Considered and rejected.** A hero line built on "decisions" (leaves out the systems
and products). The owner's three words as the line itself (a list of virtues is a
claim about oneself; "people can trust" is a claim about the work that the site can
back). A longer proof line naming employers (the id line below already does). Song
names on the phone tile at every stop (no room; the two ends carry it). One page for
the résumé (it needed 8pt type or cuts the owner has not asked for).

**Open with the owner.** Every new line is a draft, the résumé in full. The résumé's
two judgement calls: no phone number, and two pages.

### 14.25 — The name leads the hero
*Changes: §14.24 (the hero's line), §14.17 (the id line). (2026-11-19)*

**Why.** The owner, a day after §14.24 went live: "I want to edit the Data science and
AI that people can trust line. Perhaps, just Sarvesh Vishnu?" Shown three mock-ups
(name then the line; name then the role; name only), the owner chose the first.

**What changed.** The name is the large line and the page's one `h1`. A name is the
most confident way to open and narrows nothing, which was the worry behind §14.24.
"Data science and AI that people can trust." stays, a step down in size (22px to 39px),
where it reads as a description of the work and not as a slogan. It keeps the redline,
which never breaks across two lines. The two sentences of proof follow. The foot of the
sheet carries the role on the left and the links on the right; the name no longer
repeats there. The name stays on one line at every width (it eases down under 375px).
In print the name is the heading and the line sits under it; the page is still two
sheets. The share card follows the hero: name, the line, role, address.

**The résumé's profile.** The owner chose the methods-and-scale version from three
drafts: end-to-end ownership (pipelines, models, reporting), then three pieces of
recent work with the counts already stated in the bullets below it (75+ territory
managers, 25+ product lines, 100K+ records), then the Duke degree. The undergraduate
degree leaves the profile; it is in Education. Still two pages.

**Considered and rejected.** Name then role as the second line (conventional, but it
drops the one sentence that says what the work is for, and the redline with it). Name
only (the jump from a 107px name to a 20px paragraph is abrupt, and the paragraph has
to do all the explaining). Leaving the statement large with the name small (the
arrangement the owner asked to change).

**Open with the owner.** The résumé still spells "specialization" while the site uses
British spellings; the owner has not said which to keep.

### 14.26 — No stated claim in the hero
*Changes: §14.24 and §14.25 (the hero's line). (2026-11-19)*

**Why.** The owner, on seeing §14.25 built: remove "Data science and AI that people can
trust." "I want it to reflect through the work and not something we draw out. We can
use the underline accent to mark the text block underneath." This is the same call as
the removal of "The rules I build by" in §14.17: a value is shown, not announced.

**What changed.** The hero is the name, then the two sentences on what the work has
done, then role and links along the foot. The paragraph follows the name directly, so
on a wide sheet it steps up (20px to 25px) and its measure narrows to 54ch. The redline
moves into the paragraph, under "one sourced event at a time": the one phrase in it
that says how the work is done, in the work's own terms. It never breaks across two
lines and keeps a 2px weight at reading size. The page description and the share
description drop the sentence too. The share card is the name and the same paragraph,
read from the page. Print: name, role, links (the paragraph was already left out).

**Rule.** The site does not say that the work can be trusted. It names sources, labels
what is invented, shows method without employer data, and computes the numbers it
quotes. Do not bring back a values line in the hero or anywhere else without the
owner asking for one.

**Considered and rejected.** The redline under the range ("forecasting and experiments
to language models and recommender systems": two lines of underline, heavy). Under "My
work" (marks the block but says nothing). A short red rule above the paragraph (a new
device; the redline is defined as a mark under words). Keeping the paragraph at 20px on
a wide sheet (the drop from a 107px name was abrupt, the reason "name only" lost in
§14.25).

**Open with the owner.** Which words the redline sits under is my choice.

### 14.27 — Space that groups, and motion that keeps up
*Changes: §14.9 (motion timings), §14.15 (the reel is untouched), the section rhythm set
in v3. (2026-11-23)*

**Why.** The owner: "We need to do a better job at handling whitespace within the
portfolio. Kindly review the whitespace and the scrolling, interactivity dynamics."
Measured before changing anything, at 1440 by 900:
- Every section had 192px of padding above and below, so four bands of about 400px held
  nothing but a hairline floating in the middle, belonging to neither side. Only 41% of
  the page's height carried anything. The page ran 6.7 screens.
- A heading stood 96 to 120px from the thing it introduced.
- Scrolling at a brisk pace, blocks finished fading in when their top was already a
  quarter to a third of the way down the screen: the reader arrived before the content.
- A header link took about 1.3 seconds to travel, and nothing in the header said which
  section was on screen.
- The hero and the footer sat 24px left of every section and of the header.

**Space.** The hairline opens a section. Its label sits close under it (64px; 32px on a
phone) and the room goes above the line, after the previous section's last words (128px;
64px on a phone). So the largest gap on the page still falls between sections, about
200px, but it now reads as a pause before a new sheet and not as an empty screen. A
heading is 48px from its content (32px on a phone). In the contact section the note and
its buttons are one group. The page is 5.6 screens at 1440 and about 10% shorter on a
phone, with nothing removed. One left edge: the hero and footer now align with the
sections and the header at every width.

**Scrolling.**
- Reveals arrive before the reader does: rows fade over 0.45s from 10px (was 0.9s from
  16px) and start as soon as they enter; titles rise over 0.6s (was 1s). At the same
  brisk scroll, blocks now settle with their top between half and two thirds of the way
  down the screen.
- Smooth scrolling keeps a shorter tail: a wheel notch settles in about 0.5s (was 0.75s).
- A header link travels in 0.8s and lands with the section's rule tucked under the
  header and its label 64px below. The same landing holds without JavaScript and with
  reduced motion, through `scroll-padding-top`.
- The header marks the section being read (`aria-current`, the same linework underline
  as hover, never the redline). Nothing is marked over the hero.

**Left alone, on purpose.** The hero's own proportions (one screen, the name and the
paragraph centred above the foot). The reel: sideways scrolling, snap, buttons and keys
all measured as working; a swipe must pass half a sheet to advance, which is how native
snap behaves. The path's scrubbed line. The case-study pages, where the largest gap is
169px and 60% of the height carries content.

**Considered and rejected.** Equal, smaller padding on both sides of the rule (the rule
still floats). Removing the rules (they are the sheet edges of the drawing set).
Dropping smooth scrolling altogether (the path's scrubbed line reads better with it; the
tail was the fault). A scroll-progress bar (a second indicator for what the header mark
already says). Shrinking the hero to pull the work above the fold (the first screen is
the one place the page is allowed to be quiet).

### 14.28 Outcomes on the work case studies (Nov 23, 2026; `blueprint`)

The owner's review found every number on the site was scope, not result. Owner's answers
now carry the outcomes: Cooper forecast error (WAPE) about 18% → 8% against the linear
forecasts it replaced, from modelling unconstrained demand (orders incl. open, cancelled,
returned, backordered); product-line actuals within 5%; planning intervals for demand
planning and manufacturing; the cross-sell A/B test randomised accounts within territories
(~200 per territory), primary metric cross-sell orders, found no meaningful lift, and fed the
move to a single lead product. Water: the $150K is the in-house build of a likelihood-of-
failure study an outside consultancy proposed (CORRECTS the old "avoided emergency repairs"
wording on the case study and résumé). Results rows: Cooper 75+ / WAPE / ±5% (the "4-way
ensemble" stat is gone); water label "external study brought in house"; NLP adds sentiment F1.

**Placeholders.** The owner asked for stand-in numbers to edit (NLP models and scores,
test size and length, what Pinnacle changed). They are `<mark class="tbc">`, drawn with a
dashed accent outline, and `tests/copy.test.cjs` fails while any remain, so none can ship.
Removed: "No single model owns the truth…" (its committee figure left in §14.18).

### 14.29 Cooper rescoped; the research companion gets its own sheet (Nov 23, 2026; `blueprint`)

**Cooper scope.** Owner: the plan covers three business units, US medical devices plus
contraception and stem cell worldwide, "much more than the 75+ team". "75+ territory managers"
is gone everywhere (results row, AOP paragraph, home slide, résumé); the row now reads
"3 business units on plan, two of them global". No headcount is stated until the owner
gives one. "Stem-cell storage" is a placeholder for the owner's wording.

**Two facts reconciled.** WAPE 18% → 8% and "actuals within 5%" read as a contradiction
(an 8% typical miss cannot sit inside a 5% band) unless they are at different grains. The
page now says the WAPE is month by month and the 5% is each product line's full-year total,
where misses cancel. Both grains are placeholders until the owner confirms them. The
A/B test: ten territories, about 200 accounts each, about four months, five metrics ranked
before the test started (owner confirmed).

**The research companion** (`work/research-companion.html`, sheet 2 of 6, `brief` kind in
lab.js): the owner's weekly brief to leadership, in their inbox every Monday, plus ad hoc
questions on a topic. Method from the owner's own build (LangGraph graph, hybrid BM25 +
dense retrieval fused by RRF, story joining and repeat detection, source-tier confidence,
citations restricted to given passages by schema, code checks then a second model as critic,
human routing, source text as data). The internal name is NOT used on the site (§14.15 rule
stands: method only). The figure takes one invented public story (a state IVF mandate)
through Gather, Join, Weigh, Draft, Check, Send; the Check step strikes a date found in no
source. Wide (≥760): sources and brief side by side; narrower: one panel at a time, and a
compact mode drops source kinds on short tiles. No seed-corpus evaluation numbers from the
local build are quoted: they come from ~35 synthetic documents and would overstate. Every
line on the page is a draft; adoption numbers are a placeholder.
Considered and rejected: reusing the spine renderer for a node graph (sheet 1 is already a
graph; two in a row read as the same picture).

**Nov 24, owner's answers (§14.28–29 closed).** Stem-cell storage confirmed; fertility price
elasticity added to the Strategy paragraph and résumé. WAPE monthly / 5% full-year confirmed.
Companion: started 2026, five executive readers (senior directors to the Head of Sales); the
results row now leads with "5 executive readers". NLP: fine-tuned DistilBERT vs a VADER
baseline, 0.80 F1 on 1,200 hand-labelled comments, BERTopic drivers, gradient-boosted
classifier AUC 0.78 on held-out months; no known change at Pinnacle, so the sentence is cut.
The owner's old résumé line "improving patient satisfaction" was NOT used: nothing shows it
happened. All placeholders cleared; copy gate passes. Résumé bullets tightened to hold two
pages; home print hides `.slide-why` to hold six sheets on two pages.

### 14.30 The sheet index replaces the reel (Nov 24, 2026; `blueprint`)

The owner chose direction A after a critique that the site read as a standard portfolio
(name hero, carousel, timeline, skills, contact buttons) and that the blueprint idea lived only
in a "Sheet 1 of 5" counter. The idea now does the navigation.

- **Home.** The reel, its arrows, counter and index chips are gone. `Selected work` is an
  index of six hairline rows, all visible: sheet number, kind line (filled dot work, hollow
  personal), name, one line, and the result in large type (18% → 8%, 5, 0.80, $150K, 2.4×,
  Numit's event count generated into `<!-- nm:total -->` by figures.cjs). At ≥1024px the list
  takes 4/12 and the figure of the active sheet stands beside it, bleeding to the page's right
  margin so the wide drawings keep their wide form (spine's wide threshold lowered 900 → 840
  to fit a 1440 screen). Active = pointer, focus, or with no pointer the row crossing the
  middle of the screen (main.js). Without JS the first figure shows and hover switches (CSS
  `:has`). Below 1024 each row carries its own figure under it.
- **Hero.** No longer a full screen: the index starts on the first screen at 1440×900 and
  at 375×812. Reverses §14.27's "the first screen is allowed to be quiet" at the owner's word.
- **Figures.** No box and no fill; four corner ticks mark the sheet (`.tile-fig`, `.lab-stage`).
- **Case studies.** The results row comes before the instrument. The single "Next" link is
  replaced by a sheet index at the foot: all six, this one marked, previous and next.
- **Contact.** The filled LinkedIn button and three outlined buttons became one line of links
  with the email written out. "Let's connect." and its note stay (owner's earlier choice).
- **Phone menu** keeps Path. **Slide reason lines** (`.slide-why`) are gone from the home page;
  the case studies never had them. Print still fits two pages.
Considered and rejected: a stage above the list (the figure leaves the screen when pointing at
the last rows); a stage at half width (the spine and route fall back to their phone forms);
hiding figures on phones (the home page would have no picture at all).

### 14.31 Range: subjects by methods (Nov 24, 2026; `blueprint`)

The owner asked to show the range their interests follow. Chosen over a question-led home page
(B) and a drawing-set title sheet (C, built on branch `title-sheet` and kept there: title block in
the hero, discipline codes B/H/P/C on every sheet, the grid as a "key plan").

- A section after `Selected work`: a real `<table>`, rows = what the work is about (Business,
  Health, Public and civic, Culture), columns = the method it leans on (forecasting and risk,
  experiments, language models, ranking and recommending, maps and events, products and essays).
- Owner-chosen contents: the six sheets (numbered, linking to their case studies), On Paper
  (live, links out), Grid and Palette marked "in progress" with no link. Nothing else is listed.
- Below 768px each subject becomes a short list with its method beside each item. Hidden in print.
- Nav gains `Range`. All wording is a draft in COPY.md.

### 14.32 The sheet figure sticks beside the list (Nov 24, 2026; `blueprint`)

The figure was absolutely placed at the top of the index, so scrolling the list left it behind.
At ≥1024px `.sheets` is now a two-column grid; `.sheet-list` and `.sheet` are `display: contents`;
every figure shares one cell spanning all six rows and is `position: sticky` under the header,
so it travels with the list and lets go where the list ends. Height is the screen less the header
(max 600px). main.js listens on `.sheet-link` (a `display: contents` box has no geometry for the
IntersectionObserver). Below 1024px nothing changed.

### 14.33 Small instruments (Nov 24, 2026; `blueprint`)

Owner asked for playful touches that stay useful. Four built; the owner then cut two (redraw
made the figures look empty between sheets; the guide lines were noise). Kept: the marker and
the range lights, plus the native crosshair over every live figure stage.

- **Sheet marker.** At ≥1200px the header shows "02 / 06 · Research companion" in mono while
  the index is on screen (fades out elsewhere). Pointing at a numbered Range item shows
  "Sheet 05 · Obscure Music". `aria-hidden`: it repeats what the page already says.
- **Removed: redraw** (strokes drawn in on sheet change) and **drafting guides** (hairlines
  following the pointer). Content must be fully visible at every moment.
- **Crosshair.** `cursor: crosshair` now covers every live case-study stage, not only the plan;
  the globe and committee keep grab, buttons keep pointer.
- **Marker** capped at 15rem with an ellipsis: at 1440 a long name ran into the menu.
- **Range lights.** Pointing at a project lights its subject and method headers and its cell;
  pointing at a method header lights the whole column, empty cells included; a subject lights
  its row. ≥769px only (the phone table is a list). Keyboard focus does the same.
Considered and rejected: a site-wide custom cursor (slows reading, no touch equivalent), a
trailing cursor, magnetic buttons, scroll-jacking and any loop.

### 14.34 Accessibility pass (Nov 24, 2026; `blueprint`)

Audit: one h1 and ordered headings, named controls, no duplicate ids, AA contrast in both
themes, visible focus, skip link, reduced motion, no sideways scroll at 320. Five fixes:

1. **Case-study figures are images described by their sentences.** `.lab-fig` carries
   `role="img" aria-labelledby="lab-title" aria-describedby="lab-now lab-always"`, so a screen
   reader no longer reads the SVG's axis labels and ticks as a jumble. Controls sit outside it.
2. **Project rows.** Each name is an `h3` (heading navigation reaches every project); the
   row link is named by the name alone and described by kind, line and result. "18% → 8%" is
   read as "from 18% to 8%".
3. **Quiet pointer.** The live sentence under a figure (`.lab-now`) is set `aria-live="off"`
   while a pointer is driving it and `polite` when a button, slider or key is; same rule for
   the Range readout. A pointer sweep no longer reads a new sentence every few pixels.
4. **The project list is an `<ol>` again at every width.** §14.32's `display: contents` grid
   is replaced: each `.sheet-fig` is now an empty column as tall as the list (absolute, top 0,
   bottom 0) and its `.tile-fig` is sticky inside it. Same behaviour, list semantics kept.
5. **Range says what lights.** A readout under the table ("Public and civic: 4 projects, across
   3 methods: …") follows pointer and focus; lit cells get a ruled inset box as well as the tint,
   and lit headers an accent underline, so nothing depends on colour alone. Hidden below 769px.
Also: `a.rg-item` tap height 19 → 25px. Not done: axe/Lighthouse (not installed), a VoiceOver pass.

### 14.35 Font swap no longer shifts the home page (Nov 24, 2026; `blueprint`)

Lighthouse on live v3.5 (PageSpeed web UI): home mobile 99/100/100/100, desktop 83/100/100/100;
Cooper and Numit 100 on all four, both form factors. The desktop loss was CLS 0.338, all on
`#work`: since §14.30 the hero is no longer a full screen, so when Plex replaced the fallback the
hero rewrapped and pushed the index down. Two causes, two fixes:
- Measures were in `ch`, the width of "0" in the current font. Plex's "0" is 0.6em; Arial's
  0.556em. Every `Nch` is now `calc(N * var(--ch))` with `--ch: 0.6em`: identical under Plex,
  unchanged under any fallback.
- `'Plex Sans Fallback'` / `'Plex Mono Fallback'`: local Arial / Liberation Sans / Arimo and
  Courier New / Liberation Mono / Cousine with Plex's size, ascent and descent, placed second in
  both stacks (Lighthouse runs on Linux, where Helvetica Neue is absent).
Measured at 1350×940: `#work` top 506px under Plex and under the fallback (was 506 vs 540).

### 14.36 A private visit counter (Nov 24, 2026; `blueprint`)

Owner asked to know whether recruiters or interviewers visit. Chosen: an own counter on
Cloudflare (Munnetrum/portfolio-visits: Worker + D1, dashboard behind a password) over
GoatCounter, because Cloudflare names the network a visit came from.
- `count.js` on every page (not the two redirect pages): after `load`, one `sendBeacon` with
  page, referrer, `?via=` tag (kept in sessionStorage for the visit) and viewport width.
  Skipped off the live host, under `navigator.webdriver`, and in browsers opened once with
  `?nocount`. No cookie, no third party, under 1KB.
- The Worker stores no IP, no full user agent, no full referrer; a daily-salted hash groups a
  visit's pages within one day. Bots and other origins are dropped. Request logs are off.
- The résumé's site link is `?via=resume`. Footer line: "Visits are counted without cookies or
  stored IP addresses." Nothing about the counter is visible otherwise (job search stays private).
Rejected: visitor-to-company identification services (Leadfeeder, Clearbit Reveal): invasive.
