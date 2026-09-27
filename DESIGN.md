---
name: Zero Shadow Day
description: A tropical solar-position tool in the light of noon near the equator — white ground, one blue-black shadow, the equatorial sky as the only thing you press.
colors:
  bleached: "#F3F5F4"
  concrete: "#E3E8E8"
  chalk: "#FFFFFF"
  shadow: "#0E1318"
  shadow-2: "#4B5661"
  sun: "#FFB020"
  sun-ink: "#8A5300"
  marker: "#E0402C"
  marker-ink: "#B3261E"
  sky: "#DCEBF5"
  sky-deep: "#0A5CA8"
  sky-night: "#07101D"
  palm: "#12744F"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(3rem, 8vw, 5.75rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Bricolage Grotesque, Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.2vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.12em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
    fontFeature: "tnum 1"
rounded:
  field: "12px"
  panel: "16px"
  scene: "24px"
  full: "9999px"
components:
  btn-primary:
    backgroundColor: "{colors.sky-deep}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.field}"
  btn:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.shadow}"
    border: "shadow/15, sky-deep/50 on hover"
    rounded: "{rounded.field}"
  toggle:
    selected: "sky-deep fill, chalk text"
    rounded: "{rounded.full}"
  panel:
    backgroundColor: "{colors.chalk}"
    border: "shadow/10"
    rounded: "{rounded.panel}"
---

# Design System: Zero Shadow Day

## Overview

**North star: "Tropical noon."** At midday near the equator the light is white rather than golden, and shadows look blue-black because the open sky lights them. The page follows that physics: a cool, sun-bleached white ground, a blue-black ink that is also the shadow, and the equatorial sky blue as the single colour for anything you can press.

This replaced the warm-paper "observatory notice" look (cream ground, Instrument Serif, vermilion accents) in the 2026 redesign, at the owner's direction. Two rules survived because they carry meaning, and both are asserted in `tests/a11y/`:

- **The shadow is the darkest thing on the page.** `shadow` is the darkest token; `sky-night` exists only inside the scene.
- **Vermilion marks the zero shadow day and nothing else.** Not a hover, focus, slider, error, or "important". `tests/a11y/marker-reserved.test.ts` fails on any hover, focus or accent use.

The site is organised around what a reader came for: **when is my day** (home and Tanggal), **show me it happening** (Bayangan), **go deeper** (Jelajahi), and **teach it** (Ukur Bumi).

## Colours

| Token | Hex | Role |
|---|---|---|
| `bleached` | #F3F5F4 | Page ground |
| `chalk` | #FFFFFF | Panels and raised surfaces |
| `concrete` | #E3E8E8 | Tracks, dividers, the passed-date badge |
| `shadow` | #0E1318 | Ink and the shadow. 17:1 on ground |
| `shadow-2` | #4B5661 | Secondary text and labels. 6.8:1, a solid tone so contrast is exact |
| `sky-deep` | #0A5CA8 | Everything interactive: buttons, links, active tabs, focus rings, slider thumbs. 6.2:1 |
| `sky` | #DCEBF5 | Active-tab wash, hint boxes, hovered rows |
| `sun` | #FFB020 | The sun, daylight on the time track, the sun band. Fills only (1.7:1) |
| `sun-ink` | #8A5300 | The sun's path as a line or small text: declination curve, analemma, culmination tick |
| `marker` | #E0402C | Zero shadow day marks: dots, ticks, badges (≥3:1 graphics) |
| `marker-ink` | #B3261E | Zero shadow day text: the countdown, the date on a ZSD card |
| `palm` | #12744F | Indonesia's latitude band, coastline strokes |
| `sky-night` | #07101D | Scene backdrop and the Ukur Bumi card only |

Opacity mixes (`text-shadow/70`) are no longer used for text. Use `shadow-2`.

## Typography

- **Display: Bricolage Grotesque** (600–800). Headings and the countdown. An optical-size grotesque: tight at 90px, still friendly for students.
- **Text: Plus Jakarta Sans** (400–700). Prose, controls, labels. Drawn by Tokotype, a Jakarta foundry, for the city's identity.
- **Readings: JetBrains Mono** (400–500), tabular. Every time, angle, ratio and coordinate. Never prose.

All three are self-hosted through `next/font`. There are no runtime font requests.

Scale: `text-hero` for the countdown, `text-title` for page titles, `text-2xl` for section and card titles, `text-lg` ledes in `shadow-2`, `.label` (11px, 600, 0.12em caps) for field and reading labels, `.eyebrow` above page titles.

## Layout

- A sticky header: the mark and name, four destinations, the **place chip**, and the language switch (which keeps the current page). On phones the four destinations move to a **bottom tab bar**, and Jelajahi opens a small sheet of its three pages.
- The place is chosen in one **place sheet** (a native `<dialog>`, a bottom sheet on phones): search across the bundled cities, device location, or typed coordinates.
- Pages open with `PageHeader`: eyebrow, title, lede.
- Content column is `max-w-6xl` with 16–20px gutters.

## Components

- **Buttons.** `.btn-primary` (sky fill) is used once per view for the main action. `.btn` is outlined chalk that turns sky on hover. `.toggle` is a pill in a set, filled sky when `aria-pressed`. `.link` is sky with a soft underline.
- **Panels.** `.panel`: chalk, hairline border, 16px radius, no resting shadow. `shadow-lift` is reserved for scenes and floating menus; `shadow-press` (sky-tinted) for hovered cards and primary buttons.
- **Readings.** The gnomon leads with three large readings (shadow length, direction, sun altitude). The rest sit in a disclosure. The length turns `marker-ink` only on a zero shadow day.
- **Scrubbers.** A dock under the scene: a round sky play button beside the time track (daylight in sun wash, culmination in sun-ink), then the date track with the year's noon-shadow curve and vermilion ticks on the two days. Dropping the handle within a day of one snaps onto it.
- **Charts.** The year ribbon, the day cards' window strips, the noon-offset steps (ink → sky → sun → marker), and the Nusantara map all follow the colour roles above.
- **Fields.** `.field`: chalk, 12px radius, sky border on focus. Errors use a heavy ink border and a ⚠ mark, never vermilion.

## Motion

One orchestrated moment remains: the day playing in the scene. Everything else is feedback. Cards lift 4px on hover, the place sheet slides up, and the date snaps to the day. `prefers-reduced-motion` stops all of it, and the scene steps by the hour.

## Do and don't

- **Do** keep every interactive affordance in `sky-deep`.
- **Do** use `sun-ink` / `marker-ink` whenever the colour carries text or a thin line.
- **Do** render every reading in tabular mono.
- **Don't** use vermilion for anything but the zero shadow day. The test will fail.
- **Don't** introduce a tone darker than `shadow` outside the scene.
- **Don't** scale the gnomon's shadow for effect. Its length is the data (CLAUDE.md invariant 10).
