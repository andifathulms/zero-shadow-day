import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { pageUrl } from '@/lib/site'

/** Every static route under app/[locale], by its folder name. */
const SLUGS = ['', 'bayangan', 'tanggal', 'kurva', 'eratosthenes', 'sapuan', 'metode']

export default function sitemap(): MetadataRoute.Sitemap {
  return SLUGS.flatMap((slug) =>
    LOCALES.map((locale) => ({
      url: pageUrl(locale, slug),
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, pageUrl(l, slug)])),
      },
    })),
  )
}
