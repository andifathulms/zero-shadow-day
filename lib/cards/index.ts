/**
 * `lib/cards` — TikTok carousel decks built from the engine's own output
 * (docs/RECON_CARDS.md). Pure: no React, no DOM, no clock. The kartu page
 * picks the inputs and hands the text to carousel-core.
 */

export * from './types'
export * from './build'
export { cityForPlace } from './events'
export { CAPTION_MAX, TITLE_MAX } from './caption'
export { CAVEAT, EYE_SAFETY, TEMPLATE_ID } from './text'
export { TENGAH_HARI } from './variant'
