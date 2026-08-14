import type { Metadata } from 'next'
import { LOCALES, type Locale } from '@/lib/i18n'

/**
 * The one place the site's own address is assembled — origin, GitHub Pages
 * basePath, and every URL built from them. `app/layout.tsx` and every
 * route's `generateMetadata` import from here rather than each re-deriving
 * it, so canonical/OG/hreflang URLs can never drift out of step with each
 * other.
 */

/** Absolute URLs for the social card. A localhost origin here would render
 * fine locally and break everywhere the link is shared; scripts/postbuild.mjs
 * fails the build if one survives into the export. */
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://andifathulms.github.io'

/**
 * The site is served from a repository path on GitHub Pages. Next prefixes
 * the icon links it generates from file convention, but not the manifest
 * link or any absolute URL built by hand — those need this explicitly.
 */
export const BASE_PATH =
  process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '/zero-shadow-day')
    : ''

// metadataBase is the origin alone: Next appends the basePath to asset paths
// itself, so including it here too produces .../zero-shadow-day/zero-shadow-day/.
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}/`

/** Absolute URL for a route under a locale, e.g. `pageUrl('id', 'bayangan')`. */
export function pageUrl(locale: Locale, slug = ''): string {
  return `${SITE_ORIGIN}${BASE_PATH}/${locale}/${slug ? `${slug}/` : ''}`
}

const OG_LOCALE: Record<Locale, string> = { id: 'id_ID', en: 'en_US' }

/**
 * Metadata for one route in one locale, built from the title and description
 * the caller already has from the dictionary — never hand-authored copy that
 * can drift from what the page actually shows. Fills in the canonical link,
 * the hreflang alternates for every locale of the same route, and locale-
 * correct OpenGraph/Twitter tags — the part every route needs and none of
 * them should each re-derive by hand.
 */
export function pageMetadata({
  locale,
  slug = '',
  title,
  description,
}: {
  locale: Locale
  slug?: string
  title: string
  description: string
}): Metadata {
  const url = pageUrl(locale, slug)
  const languages = {
    ...Object.fromEntries(LOCALES.map((l) => [l, pageUrl(l, slug)])),
    // The root '/' redirects to '/id/' (Indonesian-first, PRD §9): the same
    // page a language-neutral request should land on.
    'x-default': pageUrl('id', slug),
  }

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Zero Shadow Day',
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
