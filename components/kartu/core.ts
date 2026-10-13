import { TENGAH_HARI } from '@/lib/cards'
import { BASE_PATH } from '@/lib/site'
import { appFontFaces } from './appFonts'

/**
 * carousel-core, loaded once, on this page only, in the browser only. The
 * dynamic import keeps it out of every other route's bundle and out of the
 * static prerender: nothing here runs until the kartu page mounts.
 *
 * Before anything renders, fonts are pointed at the copy under the basePath
 * (scripts/copy-carousel-fonts.mjs) plus the app's own faces, and the
 * variant is registered. A failure in either — a missing face, a VariantError
 * listing contrast problems — rejects, and the page shows it instead of
 * exporting.
 */

export type Core = typeof import('carousel-core')
export type Zip = typeof import('carousel-core/zip')

let core: Promise<Core> | null = null

export function loadCore(): Promise<Core> {
  if (!core) {
    core = (async () => {
      const loaded = await import('carousel-core')
      loaded.configureFonts({ baseUrl: `${BASE_PATH}/carousel-core/fonts/`, faces: appFontFaces() })
      if (!loaded.hasVariant(TENGAH_HARI.id)) loaded.registerVariant(TENGAH_HARI)
      return loaded
    })()
    // A failed load is retried on the next call rather than cached as failed.
    core.catch(() => {
      core = null
    })
  }
  return core
}

/** JSZip lives behind its own entry point: loaded only when a ZIP is asked for. */
export function loadZip(): Promise<Zip> {
  return import('carousel-core/zip')
}

/** Carousel Press, the hosted editor: the fallback when a deck needs hand work. */
export const CAROUSEL_PRESS_URL = 'https://andifathulms.github.io/carousel-press/'
