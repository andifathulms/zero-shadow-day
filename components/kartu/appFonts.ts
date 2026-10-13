import type { FontFaceSource } from 'carousel-core'
import { DISPLAY_FAMILY, SANS_FAMILY } from '@/lib/cards/variant'

/**
 * The app's own variable woff2 files, handed to carousel-core so the cards
 * are set in the same faces as the site: Bricolage Grotesque for headlines,
 * Plus Jakarta Sans for text.
 *
 * next/font self-hosts them under content-hashed names, so the URL is read
 * from the stylesheet next/font already put on the page: the @font-face whose
 * family is the one behind the layout's CSS variable, and whose unicode-range
 * covers basic Latin. Same origin, already under the basePath, already
 * fetched by the page — no new request and no copy of the files.
 *
 * Both files are variable on wght 200–800 (read from their fvar tables), so
 * one face covers every weight the editorial family gates on (400–700).
 */

const WEIGHT_RANGE: [number, number] = [200, 800]

const ROLES = [
  { family: DISPLAY_FAMILY, variable: '--font-display' },
  { family: SANS_FAMILY, variable: '--font-sans' },
] as const

/** Throws, naming the variable, when a face cannot be found: never a silent fallback. */
export function appFontFaces(doc: Document = document): FontFaceSource[] {
  const root = getComputedStyle(doc.documentElement)
  return ROLES.map(({ family, variable }) => {
    const stack = root.getPropertyValue(variable).trim()
    const generated = stack.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') ?? ''
    const url = generated ? latinFile(generated, doc) : null
    if (!url) {
      throw new Error(
        `Font ${family} tidak ditemukan di stylesheet aplikasi (${variable}: ${stack || 'kosong'}).`,
      )
    }
    return { family, weight: WEIGHT_RANGE, url }
  })
}

/** The src of the @font-face for `family` whose unicode-range covers "A". */
function latinFile(family: string, doc: Document): string | null {
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue // a cross-origin sheet; this app has none, but never fail on one
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const name = rule.style.getPropertyValue('font-family').trim().replace(/^['"]|['"]$/g, '')
      if (name !== family) continue
      if (!coversBasicLatin(rule.style.getPropertyValue('unicode-range'))) continue
      const src = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(rule.style.getPropertyValue('src'))
      if (src?.[1]) return new URL(src[1], doc.baseURI).href
    }
  }
  return null
}

/** Whether a unicode-range ("U+0000-00FF, U+0131, …"; empty means all) includes U+0041. */
function coversBasicLatin(range: string): boolean {
  if (range.trim() === '') return true
  return range.split(',').some((part) => {
    const match = /U\+([0-9a-f?]+)(?:-([0-9a-f]+))?/i.exec(part.trim())
    if (!match?.[1]) return false
    const from = Number.parseInt(match[1].replace(/\?/g, '0'), 16)
    const to = Number.parseInt(match[2] ?? match[1].replace(/\?/g, 'f'), 16)
    return from <= 0x41 && 0x41 <= to
  })
}
