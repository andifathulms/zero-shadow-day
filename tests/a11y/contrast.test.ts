import { describe, expect, it } from 'vitest'
import config from '@/tailwind.config'

/**
 * The palette is fixed by PRD §9, but a fixed palette still has to be legible.
 * These are the WCAG 2.1 thresholds:
 *
 *   1.4.3  4.5:1 for normal text, 3:1 for large text (>=24px, or >=19px bold)
 *   1.4.11 3:1 for a graphic that carries meaning
 *
 * The ratios below are the ones the app actually uses. If a tone is lightened,
 * this fails rather than shipping something unreadable in hard tropical light —
 * which is exactly the condition this site is read in.
 */

const colors = (config.theme?.extend?.colors ?? {}) as Record<string, string>

type Rgb = readonly [number, number, number]

function hex(value: string): Rgb {
  const parsed = [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16))
  return [parsed[0]!, parsed[1]!, parsed[2]!]
}

/** WCAG relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const channel = (value: number): number => {
    const scaled = value / 255
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter! + 0.05) / (darker! + 0.05)
}

/** Tailwind's `text-shadow/70` is the token composited over its background. */
function over(foreground: Rgb, background: Rgb, alpha: number): Rgb {
  return [
    foreground[0] * alpha + background[0] * (1 - alpha),
    foreground[1] * alpha + background[1] * (1 - alpha),
    foreground[2] * alpha + background[2] * (1 - alpha),
  ]
}

const bleached = hex(colors.bleached!)
const shadow = hex(colors.shadow!)
const concrete20 = over(hex(colors.concrete!), bleached, 0.2)
const chalk = hex(colors.chalk!)
const concrete25 = over(hex(colors.concrete!), bleached, 0.25)
const sky40 = over(hex(colors.sky!), bleached, 0.4)

describe('body and readout text', () => {
  it('full-strength shadow on bleached ground is far above AA', () => {
    expect(contrast(shadow, bleached)).toBeGreaterThan(11)
  })

  it('the .label tone at 70% clears 4.5:1 on every surface it sits on', () => {
    for (const [name, background] of [
      ['bleached', bleached],
      ['concrete/20', concrete20],
      ['concrete/25', concrete25],
      ['chalk', chalk],
    ] as const) {
      expect(contrast(over(shadow, background, 0.7), background), name).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('55% — the tone this started at — would not have passed', () => {
    expect(contrast(over(shadow, bleached, 0.55), bleached)).toBeLessThan(4.5)
  })

  it('reversed out of the shadow tone, bleached text is legible', () => {
    expect(contrast(bleached, shadow)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('the two accents', () => {
  it('vermilion carries display text and marks, but not small text on concrete', () => {
    // Large text and graphics need 3:1; both pass comfortably.
    expect(contrast(hex(colors.marker!), bleached)).toBeGreaterThanOrEqual(3)
    expect(contrast(hex(colors.marker!), concrete20)).toBeGreaterThanOrEqual(3)
    // Which is why small vermilion text uses the darker companion.
    expect(contrast(hex(colors['marker-ink']!), concrete20)).toBeGreaterThanOrEqual(4.5)
  })

  it('ochre cannot carry a data line, so the darker companion does', () => {
    // The PRD's sun ochre is 2.4:1 on bleached ground — below the 3:1 that a
    // meaningful graphic needs. It keeps the washes and fills.
    expect(contrast(hex(colors.sun!), bleached)).toBeLessThan(3)
    // Lines and small text use sun-ink, which clears both thresholds.
    expect(contrast(hex(colors['sun-ink']!), bleached)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(hex(colors['sun-ink']!), sky40)).toBeGreaterThanOrEqual(4.5)
  })

  it('the darker companions stay in their own hue family', () => {
    // Same ordering of channels: still ochre, still vermilion, just darker.
    const [sunR, sunG, sunB] = hex(colors.sun!)
    const [inkR, inkG, inkB] = hex(colors['sun-ink']!)
    expect(inkR).toBeGreaterThan(inkG)
    expect(inkG).toBeGreaterThan(inkB)
    expect(sunR).toBeGreaterThan(sunG)
    expect(sunG).toBeGreaterThan(sunB)
    expect(luminance(hex(colors['sun-ink']!))).toBeLessThan(luminance(hex(colors.sun!)))
    expect(luminance(hex(colors['marker-ink']!))).toBeLessThan(luminance(hex(colors.marker!)))
  })
})

describe('the sky tones', () => {
  it('deep sky and palm carry white text, for gradient overlays', () => {
    expect(contrast(hex(colors['sky-deep']!), hex(colors.chalk!))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(hex(colors.palm!), hex(colors.chalk!))).toBeGreaterThanOrEqual(4.5)
  })

  it('night sky is dark enough for the ground to read against it', () => {
    expect(luminance(hex(colors['sky-night']!))).toBeLessThan(0.05)
  })
})

describe('the shadow is the darkest thing on the page', () => {
  it('nothing in the palette is darker than the shadow tone', () => {
    const tones = [
      'bleached', 'concrete', 'chalk', 'sun', 'marker', 'sky', 'sky-deep',
      'sun-ink', 'marker-ink', 'palm',
    ]
    for (const tone of tones) {
      expect(luminance(hex(colors[tone]!)), tone).toBeGreaterThan(luminance(shadow))
    }
  })
})
