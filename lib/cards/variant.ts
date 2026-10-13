/**
 * `editorial/tengah-hari`: this app's own carousel-core variant
 * (docs/RECON_CARDS.md §7). Data only; registered in the browser before any
 * deck renders, and checked in tests/cards against carousel-core's own
 * validator (its DESIGN §4.4 contrast rules).
 *
 * Every colour is an app token from tailwind.config.ts. Meaning carries over
 * from the site (CLAUDE.md invariant 12):
 *
 *   siang   the zero shadow day's slide. Its accent is `marker-ink`, the only
 *           vermilion here, and builders accent nothing but that day's date
 *           or time (lib/cards/text `zsdAccent`).
 *   kapur   the neutral slide: tables, how-tos. carousel-core paints a
 *           table's header row in the accent, so a table on `siang` would put
 *           vermilion on column labels; tables live here, accented `sky-deep`.
 *   langit  explainers, on the equatorial noon sky.
 *   deep    covers and ends that are not the day itself; the shadow tone,
 *           darkest thing on the card because the shadow is the subject.
 *
 * `rotation` is `kapur` alone, so a slide without `surface=` can never turn
 * vermilion by accident.
 *
 * Fonts: the app's own variable woff2 files, registered at runtime with
 * configureFonts({ faces }) (components/kartu/appFonts.ts). Editorial draws
 * headlines in its `serif` role, which here is Bricolage Grotesque.
 */

import type { Surface, Variant } from 'carousel-core/parse'
import config from '@/tailwind.config'

const palette = (config.theme?.extend?.colors ?? {}) as Record<string, unknown>

/** A token's value, read from tailwind.config.ts so the cards can never drift from the site. */
function token(name: string): string {
  const value = palette[name]
  if (typeof value !== 'string') throw new Error(`tailwind.config.ts has no colour token "${name}"`)
  return value
}

/** The tokens the variant uses, by name. */
export const TOKENS = {
  bleached: token('bleached'),
  concrete: token('concrete'),
  chalk: token('chalk'),
  shadow: token('shadow'),
  shadow2: token('shadow-2'),
  markerInk: token('marker-ink'),
  sky: token('sky'),
  skyDeep: token('sky-deep'),
  skyNight: token('sky-night'),
} as const

export const DISPLAY_FAMILY = 'Bricolage Grotesque'
export const SANS_FAMILY = 'Plus Jakarta Sans'
/** Bundled with carousel-core, the same face the app uses for figures. */
export const MONO_FAMILY = 'JetBrains Mono'

const t = TOKENS

const siang: Surface = {
  bg: t.bleached, ink: t.shadow, body: t.shadow2, muted: t.shadow2, accent: t.markerInk,
  badgeBg: t.skyDeep, badgeInk: t.chalk, blob: t.sky, icon: t.skyDeep, inlineCodeBg: t.concrete,
}

const kapur: Surface = {
  bg: t.chalk, ink: t.shadow, body: t.shadow2, muted: t.shadow2, accent: t.skyDeep,
  badgeBg: t.skyDeep, badgeInk: t.chalk, blob: t.bleached, icon: t.skyDeep, inlineCodeBg: t.bleached,
}

const langit: Surface = {
  bg: t.skyDeep, ink: t.chalk, body: t.sky, muted: t.sky, accent: t.chalk,
  badgeBg: t.chalk, badgeInk: t.skyDeep, blob: t.skyDeep, icon: t.sky, inlineCodeBg: t.shadow,
}

const deep: Surface = {
  bg: t.shadow, ink: t.chalk, body: t.sky, muted: t.concrete, accent: t.sky,
  badgeBg: t.sky, badgeInk: t.shadow, blob: t.skyNight, icon: t.sky, inlineCodeBg: t.skyNight,
}

export const TENGAH_HARI: Variant = {
  id: 'editorial/tengah-hari',
  name: 'Tengah Hari',
  family: 'editorial',
  fonts: { serif: DISPLAY_FAMILY, sans: SANS_FAMILY, mono: MONO_FAMILY },
  surfaces: { siang, kapur, langit, deep },
  rotation: ['kapur'],
  // No photos in these decks; the shape requires the tokens.
  onPhoto: {
    bg: '#000000', ink: t.chalk, body: 'rgba(255,255,255,0.90)', muted: 'rgba(255,255,255,0.75)',
    accent: t.sky, badgeBg: t.sky, badgeInk: t.shadow, blob: 'rgba(0,0,0,0)', icon: t.chalk,
    inlineCodeBg: 'rgba(255,255,255,0.18)', tint: t.skyNight,
  },
  // No code slides either; every token clears 4.5:1 on the shadow panel anyway.
  code: {
    panel: t.shadow, border: t.shadow, text: t.bleached, prompt: t.sky, command: t.chalk,
    subcommand: t.sky, flag: t.sky, string: t.sky, comment: t.concrete, number: t.sky,
    keyword: t.chalk, fn: t.sky, punct: t.concrete, dots: null,
  },
  // RECON §7 asks for a noon glow and a faint ground grid, with blobs off.
  // carousel-core 1.0.0 draws glow and dotGrid only in the `dev` family, so on
  // this editorial variant both flags are inert until the core draws them.
  deco: {
    blobs: false, dotGrid: true, scanlines: false, glow: true, bigGlyph: null,
    dotColor: 'rgba(14,19,24,0.06)', glowAlpha: 0.08,
  },
  swatches: [t.bleached, t.shadow, t.markerInk, t.skyDeep],
}
