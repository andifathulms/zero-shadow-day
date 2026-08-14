---
name: Zero Shadow Day
description: A tropical solar-position tool that reads like an observatory notice — hard light, one dark shadow, and a real sky behind it.
colors:
  bleached: "#FBF4E4"
  concrete: "#E8DCC4"
  chalk: "#FFFDF7"
  shadow: "#14110E"
  sun: "#FFB627"
  sun-ink: "#8A5300"
  marker: "#E2483D"
  marker-ink: "#A3271E"
  sky: "#BAE2F3"
  sky-deep: "#1668AA"
  sky-night: "#0A1020"
  palm: "#1F7A5A"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(2.75rem, 9vw, 6.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(2rem, 4.5vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  lede:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 2vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.14em"
  mono:
    fontFamily: "Chivo Mono, ui-monospace, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
    fontFeature: "tnum 1"
rounded:
  sm: "6px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.shadow}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.sun}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.shadow}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.shadow}"
    textColor: "{colors.chalk}"
  card-tool:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.shadow}"
    rounded: "{rounded.md}"
    padding: "24px"
  panel:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.shadow}"
    rounded: "{rounded.md}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.bleached}"
    textColor: "{colors.shadow}"
    rounded: "{rounded.sm}"
    padding: "8px 8px"
---

# Design System: Zero Shadow Day

## Overview

**Creative North Star: "The Observatory Notice"**

The material world is hard tropical light on sun-bleached concrete: warm paper-toned ground, one crisp dark shadow, no softness anywhere except the sky itself. The page reads like a printed instrument notice — a serif masthead, a monospace column of continuously-updating figures, and a single subject (the shadow) that stays darker than everything else on the page because it *is* the data, not decoration beside it.

Owner direction superseded the original flat, fully bleached-concrete-only palette (documented in `CLAUDE.md`) to let the sky be a real sky — a hero that plays a whole day from deep blue through sunrise orange to true night, rendered by a hand-rolled 8 KB 3D scene rather than a flat wash. What survived that change, because they carry meaning rather than taste, are the two rules every other decision defers to: the shadow is the darkest thing on the page, and vermilion marks the zero shadow day and nothing else.

Almost everything at rest is flat — no drop shadows, no gradients on cards, no gloss. The one ambient shadow (`lift`) exists purely to lift a chalk-white panel a few pixels off the paper ground, and it appears at rest on panels and on hover for interactive cards, never as decoration.

**Key Characteristics:**
- Warm, sun-bleached paper ground with one uncompromisingly dark ink color — never a mid-gray
- A real rendered sky (day-to-night gradient, 3D gnomon scene) sitting inside an otherwise flat, printed-page layout
- Every time, angle, and ratio renders in tabular monospace so it never reflows while being dragged
- Vermilion (marker) appears in exactly one role: the zero shadow day. Nowhere else.
- Sun ochre marks the sun's own path and nothing structural; its low-contrast base hex never carries text or data lines — `sun-ink`/`marker-ink` do that instead

## Colors

Two neutrals warm enough to read as sunlit paper, one ink dark enough to anchor everything, and two narrow-purpose accents that are rationed rather than decorative.

### Primary
- **Shadow Ink** (#14110E): The subject and the default text color. Nothing else on the page is ever darker — that hierarchy is the whole visual argument, since the shadow's length and bearing *are* the readout, not an illustration beside one.

### Secondary
- **Sun Ochre** (#FFB627): The sun's own path — the analemma, the declination curve, sun-adjacent accents. Never used for text or fine data lines; at 2.4:1 on bleached ground it fails the contrast a meaningful graphic needs.
- **Sun Ink** (#8A5300): Sun ochre's accessible companion (≥4.5:1 on bleached and on the sky-40 wash). Carries any time this needs to be legible small text or a data line rather than a broad fill.

### Tertiary
- **Marker Vermilion** (#E2483D): The zero shadow day, and nothing else — not a general "important" or "error" color. Used at ≥3:1 for graphical marks (scrubber ticks, map pins).
- **Marker Ink** (#A3271E): Vermilion's accessible companion (≥4.5:1) for zero-shadow-day text and small labels where the base hue can't carry contrast.

### Neutral
- **Bleached Paper** (#FBF4E4): The page ground. Warm, sun-bleached, never pure white.
- **Concrete** (#E8DCC4): Surfaces the shadow visually falls onto — secondary ground layer, dividers between paper and object.
- **Chalk** (#FFFDF7): Raised surfaces — panels, cards, the hero's primary button — sitting a shade lighter and cooler than the ground beneath them.
- **Sky Wash** (#BAE2F3): Cool daytime sky, used in gradients and cool-toned surfaces.
- **Sky Deep** (#1668AA): The top of the daytime sky gradient (`tropical-noon`) and a general "cool, deep" surface tone.
- **Sky Night** (#0A1020): Night sky; also the hero section's own background before the scene paints over it, so there's never a flash of the wrong tone.
- **Palm Green** (#1F7A5A): Vegetation / horizon band in the 3D scene, and a secondary accent where a second cool hue is needed outside the sky family.

### Named Rules
**The Darkest Ink Rule.** Shadow Ink is the darkest color anywhere in the system. No future token, tint, or opacity value may be introduced that reads darker than `#14110E` — the shadow's visual primacy is the whole point of the product.

**The One Accent Rule.** Marker Vermilion marks the zero shadow day and nothing else — not a generic "primary CTA" color, not an error state, not a hover accent. If a new UI moment needs emphasis, reach for Shadow Ink at full opacity or Sun Ochre before reaching for vermilion.

## Typography

**Display Font:** Instrument Serif (with Georgia, serif fallback)
**Body Font:** Instrument Sans (with system-ui, sans-serif fallback)
**Label/Mono Font:** Chivo Mono, tabular figures pinned to weight 400

**Character:** A serif for display sets the register of a printed observatory notice; Instrument Sans keeps controls and running prose plain and quiet underneath it, so the serif is the only place personality shows. Chivo Mono exists purely for data — it never appears in prose.

### Hierarchy
- **Display / Hero** (400, `clamp(2.75rem, 9vw, 6.5rem)`, line-height 0.95, letter-spacing -0.02em): The page's own name on the homepage hero, set as a block with almost no leading so a two-line wordmark reads as one shape.
- **Headline / Title** (400, `clamp(2rem, 4.5vw, 3.25rem)`, line-height 1.05, letter-spacing -0.015em): Section headings (`## Overview`-scale moments) across every route.
- **Lede** (400, `clamp(1.125rem, 2vw, 1.5rem)`, line-height 1.5): The one intro paragraph under a hero or section headline, set larger than body text and given room to breathe.
- **Body** (400, 1rem, line-height 1.625, Instrument Sans): Running prose everywhere else, capped near 65–75ch (`max-w-prose`) for readability.
- **Label** (400, 0.6875rem / 11px, letter-spacing 0.14em, uppercase, `text-shadow/70`): Field labels, readout row labels, and the secondary wordmark line. Deliberately quiet — 70% shadow opacity is the tested floor that still clears 4.5:1.
- **Mono/Value** (400, 0.95rem, Chivo Mono, tabular numerals via `tnum`): Every time, angle, ratio, and coordinate in the app. Non-negotiable — a proportional font here would let digits reflow mid-drag.

### Named Rules
**The Tabular Everywhere Rule.** Any angle, time, or shadow ratio renders with `font-variant-numeric: tabular-nums` (the `.tabular` utility). These values update continuously as the date scrubber moves; a non-tabular font would make the layout visibly shift on every frame.

**The Serif-Is-Rare Rule.** Instrument Serif appears only at `h1`/`h2`/`h3` scale and the wordmark. It never sets body copy, labels, or UI chrome — its rarity is what keeps the "observatory notice" register from tipping into generic editorial.

## Layout

The page is a single centered column, `max-w-6xl` (1152px), with `px-5` gutters and generous vertical rhythm — top-level sections on the homepage stack with `space-y-16` (64px) between them, and internal card/step grids use smaller `gap-4`–`gap-8` steps. Grids go responsive at `sm:` (2–3 columns for the tool cards and the three-step "how it works" list) and `lg:` (the place-picker-plus-summary section splits into a fixed `22rem` sidebar beside a fluid column only at `lg:`). Nothing is dense: the gnomon and the sky scene are always given a tall, near-square-to-widescreen frame (`min-h-[clamp(26rem,72vh,42rem)]` on the hero) so there's room around the subject for a long shadow.

## Elevation & Depth

Flat by default — panels, nav, and footer sit at zero elevation with only a 1px `shadow/10`–`shadow/15` border to separate surfaces from the paper ground beneath them. The system uses exactly two shadow tokens, both understated:

### Shadow Vocabulary
- **`lift`** (`0 1px 2px rgba(20,17,14,0.06), 0 12px 32px -12px rgba(20,17,14,0.28)`): A soft ambient lift for chalk-white panels at rest (the place picker, the readout panel) and for tool cards on hover, paired with a small `-translate-y-1`.
- **`sink`** (`inset 0 1px 3px rgba(20,17,14,0.12)`): A subtle inset for a pressed/recessed surface; used sparingly.

### Named Rules
**The Flat-By-Default Rule.** Elevation is reserved for panels that are genuinely raised above the paper ground (chalk surfaces) or for a hover response on an interactive card. It is never applied to decorate a static block of text or a section wrapper.

## Shapes

Corners are soft but restrained: `rounded-md` (8px) on cards and panels, `rounded-sm`-equivalent (6px, Tailwind's `rounded-md` is reused for form inputs at this scale) on text inputs and selects, and `rounded-full` pills for every button and the browser range-input thumb. Borders are hairline and always shadow-tinted (`border-shadow/10` through `border-shadow/40`) rather than a separate gray — there is no independent border-color token. The 3D gnomon scene and SVG scrubber are the only sharp-edged elements in the system, deliberately, because they're instruments rather than UI chrome.

## Components

### Buttons
- **Shape:** Full pill (`rounded-full`) for every button in the system, no exceptions.
- **Primary** (hero / on-dark contexts): Chalk background (#FFFDF7), Shadow Ink text, `px-6 py-3`, `text-sm font-medium`. Used exactly once per view, for the single highest-intent action (e.g. "Enter the gnomon").
- **Secondary / Outline:** Transparent background, `border-shadow/40`, `px-4 py-2 text-sm` (e.g. "Locate me").
- **Hover / Focus:** Primary shifts to Sun Ochre background; Secondary fully inverts (`bg-shadow text-chalk`). Every interactive element also gets a 2px `outline-shadow` focus ring via `:focus-visible`, offset 2px — never a bare browser default.
- **Ghost / Text link:** Underlined with `decoration-shadow/40` (or `decoration-chalk/40` on dark grounds), `underline-offset-2` to `-4`, darkening to full-strength underline and shadow-ink text on hover.

### Cards / Containers
- **Corner Style:** `rounded-md` (8px equivalent via Tailwind's `rounded-lg`, 0.5rem).
- **Background:** Chalk (#FFFDF7) on Bleached (#FBF4E4) ground, distinguished only by the background shift plus a hairline `border-shadow/10` — never a shadow at rest for a plain card.
- **Shadow Strategy:** No shadow at rest; `lift` plus `-translate-y-1` and a darkened border (`border-shadow/30`) on hover, so the card visibly detaches from the page instead of gaining a shadow at rest.
- **Border:** 1px, `shadow/10` at rest.
- **Internal Padding:** `p-6` (24px) for tool cards; `p-5 sm:p-6` (20–24px) for the denser readout/place-picker panel.

### Inputs / Fields
- **Style:** `rounded-md` (Tailwind's `rounded-md`, 6px), `border-shadow/25`, Bleached background so a field visually sits *in* the paper rather than floating above it like a card. Coordinate fields use `font-mono tabular`; the city select and labels use `font-sans`.
- **Focus:** The shared `:focus-visible` treatment — 2px solid `outline-shadow`, 2px offset. No separate glow or border-color change layered on top.
- **Error / Disabled:** No dedicated visual error state observed on fields themselves; status text below a field (e.g. geolocation denied) uses `text-marker-ink` at `text-sm`.

### Navigation
- **Style:** A single-row header, `border-b border-shadow/15`, wordmark (icon mark + two-line lockup: Instrument Serif primary name over an uppercase-tracked Label-scale secondary name) on the left, a flat text-link list on the right. Links get a `border-b border-transparent` that fills to `border-shadow` on hover — no background pill, no color change, just the underline resolving. The locale switcher reuses the Label typography (`text-[0.6875rem] uppercase tracking-[0.14em]`) to read as a small instrument toggle rather than a normal nav item.
- **Mobile:** Wraps via flexbox (`flex-wrap`) rather than collapsing into a drawer or hamburger; the nav list simply reflows to a second line under narrow widths.

### Date Scrubber (signature component)
The custom SVG-backed range input that drives nearly every view: a thin signed curve of the year's noon shadow ratio (north-pointing above the centerline, south-pointing below) drawn in Shadow Ink at 1.75px, with the two zero-shadow-day crossings marked by a 2px vermilion tick plus a filled vermilion dot — the only vermilion on the page. A native `<input type="range">` sits invisibly on top (`accent-marker`) so the browser's own accessible slider semantics and touch target survive underneath the custom drawing. Month ticks render below in tabular mono at 11px. This is the component every other design decision (tabular numerals, the one-accent rule, the flat-by-default elevation) exists to serve.

### Skeleton / Loading
A shape-tracing placeholder, not a spinner: a `rounded-lg border-shadow/10 bg-chalk` block sized to match the eventual content, animated with a slow (1.8s) diagonal sweep of `shadow/5` opacity. Traces the space the real content will occupy rather than substituting an unrelated loading icon.

## Do's and Don'ts

### Do:
- **Do** keep Shadow Ink (#14110E) the darkest value in any composition — no gray, no near-black, ever reads darker than the shadow itself.
- **Do** use `sun-ink` / `marker-ink` instead of the base `sun` / `marker` hex whenever the color needs to carry text or a thin data line — the base hues are display-only fills that fail small-text contrast by design.
- **Do** render every time/angle/ratio value in `font-mono tabular` so dragged values never reflow.
- **Do** keep interactive surfaces flat at rest and reserve the `lift` shadow for genuine elevation change (panels above ground, cards on hover).
- **Do** use full pill (`rounded-full`) shape for every button; it's the one consistent silhouette across the whole system.

### Don't:
- **Don't** use Marker Vermilion for anything other than the zero shadow day itself — not a generic CTA, not a form error, not a "new" badge.
- **Don't** set body text, labels, or UI chrome in Instrument Serif; it is reserved for display headings and the wordmark only.
- **Don't** add a drop shadow to a static card or text block at rest — elevation communicates a state change (raised panel, hover), not decoration.
- **Don't** introduce a gray or neutral tone darker than `#14110E`; every "darker" need should route through Shadow Ink at higher opacity instead of a new near-black token.
- **Don't** scale or restyle the shadow/gnomon rendering for visual effect in a way that breaks the length-to-altitude ratio — it is the literal data, not an illustration (CLAUDE.md invariant 10).
