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

### Page structure
1. Header — fixed, 64px, transparent; hairline border on scroll
2. Hero — full viewport, asymmetric; name + role + tagline
3. Trajectory — combined-capability curve, the overture (§14.7)
4. Selected work — list-driven (not cards)
5. About — narrow column, editorial feel
6. Skills / Stack — mono-aligned list
7. Recognition — mono key/value rows
8. Writing — single outbound CTA
9. Contact — large, single CTA
10. Footer — minimal mono captions

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
├── main.js                 # theme toggle, scroll reveal, reduced motion
├── work/                   # project detail pages
├── assets/
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

### 14.7 — Trajectory section (combined-capability curve)
*Adds: §5 page structure — new §01 "Trajectory", before Selected work.
Supersedes the duration-timeline idea that briefly lived inside Selected work.*

An overture section between the hero and the project list: an inline-SVG curve
whose **x-axis is real dated milestones** (2019 Foundations → 2026 Commercial +
executive) and whose **y-axis is "combined capability", explicitly framed as a
thesis rather than a measured score.** One Prussian line over a flat `prussian-tint`
area, milestone dots with drop-lines to a baseline, and a dashed projection
reaching up-right to signal "ongoing". A dated text legend sits below.

**Reason — and the honesty guardrail.** The subject asked for a "growth /
exponential" curve of their skills. A literal skill-level y-axis is unfalsifiable
and reads as self-flattering. The defensible version keeps every x-value a real,
dated fact and makes the y-axis a *named thesis* — capability compounding because
domains combine (data × business × strategy × domain). The page says so outright
in `.tj-cap`: "the rising curve is the argument, not a measured score." Solid line
= what happened; dashed = extrapolation, per standard data-viz convention. This is
the same rule as §14.5: never present a shaped claim as a measured one.

The section is placed before Selected work so the arc ("who I am, where I'm from")
frames the projects rather than mixing with them. The line-draw animation only
runs under `:root.js` + no reduced-motion; without JS or with reduced motion the
line renders whole. Below `--bp-sm` the in-SVG labels hide and the text legend
carries the milestones. A genuine *time series* (a measured value over time) still
belongs in the project-page full-bleed slots, built from real project data — not
here.
