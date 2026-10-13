/**
 * TikTok's text limits, the same ones NusaStats' TikTokText uses. A title or
 * caption that would run over is cut on a word boundary with an ellipsis,
 * never mid-number.
 */

export const TITLE_MAX = 90
export const CAPTION_MAX = 2200

/** Hashtags are copy, chosen by hand: the repo verifies none of them (RECON §6). */
const HASHTAGS = ['#haritanpabayangan', '#kulminasi', '#sains', '#astronomi', '#indonesia']

/** `text` cut to at most `max` characters, at a space, with "…". */
export function fit(text: string, max: number): string {
  const single = text.trim()
  if (single.length <= max) return single
  const room = single.slice(0, max - 1)
  const space = room.lastIndexOf(' ')
  return `${(space > max / 2 ? room.slice(0, space) : room).trimEnd()}…`
}

/** A hashtag from a city name: "Banda Aceh" → "#bandaaceh". */
export function cityTag(name: string): string {
  return `#${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
}

/**
 * The description: the hook, the facts paragraph, the caveat, then hashtags.
 * Paragraphs are kept; only the facts give way if the whole runs long.
 */
export function caption(
  hook: string,
  facts: readonly string[],
  caveat: string,
  cityNames: readonly string[],
): string {
  const tags = [...new Set([...HASHTAGS, ...cityNames.map(cityTag)])].join(' ')
  const tail = `\n\n${caveat}\n\n${tags}`
  const head = `${hook}\n\n${facts.join('\n')}`
  return `${fit(head, CAPTION_MAX - tail.length)}${tail}`
}
