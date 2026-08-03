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
3. Selected work — list-driven (not cards)
4. About — narrow column, editorial feel
5. Skills / Stack — mono-aligned list
6. Recognition — mono key/value rows
7. Writing — single outbound CTA
8. Contact — large, single CTA
9. Footer — minimal mono captions

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
- Hero: eyebrow, display title, mono key/value meta grid (4 col desktop / 2 col tablet)
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
