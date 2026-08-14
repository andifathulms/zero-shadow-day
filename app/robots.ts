import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * The site is served from a repository subpath on GitHub Pages
 * (SITE_URL, not the domain root), so this file itself lands at
 * .../zero-shadow-day/robots.txt rather than the domain root crawlers check
 * by default — a real limitation of subpath hosting, not something this file
 * can work around. It's included anyway: harmless, correctly formed, and
 * useful to any crawler that does reach it directly or via a manually
 * submitted sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}sitemap.xml`,
  }
}
