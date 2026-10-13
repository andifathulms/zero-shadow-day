import type { City } from '@/data/cities/indonesia'
import type { CivilDate } from '@/lib/solar/julian'

/**
 * The card stories this app can tell (docs/RECON_CARDS.md §4–§5). Each is a
 * builder over the engine's own output: no number in a deck is ever typed.
 */
export const CARD_KINDS = [
  'cek-kotamu',
  'bayangan-minggu-ini',
  'cluster-hari-ini',
  'kota-terakhir',
  'ukur-bumi',
  'tengah-hari-bukan-jam-12',
  'mitos-vs-hitungan',
] as const

export type CardKind = (typeof CARD_KINDS)[number]

/**
 * What a deck is built from. A listed city only — never coordinates, so no
 * deck can carry a location off the device (CLAUDE.md invariant 9). A
 * geolocated place is named by `cityForPlace` before it gets here.
 */
export interface DeckRequest {
  readonly kind: CardKind
  readonly city: City
  /** The civil date the deck is written for: "hari ini" in its copy. */
  readonly today: CivilDate
}

export interface CardDeck {
  readonly kind: CardKind
  /** carousel-core deck text: header, then slides separated by `---`. */
  readonly text: string
  /** TikTok title, at most TITLE_MAX characters. */
  readonly title: string
  /** TikTok description, at most CAPTION_MAX characters. */
  readonly caption: string
  /** File name stem for the ZIP. */
  readonly name: string
}
