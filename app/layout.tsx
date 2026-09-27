import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { BASE_PATH, SITE_ORIGIN, SITE_URL } from '@/lib/site'
import './globals.css'

/**
 * Fonts are self-hosted through next/font: no CDN, no request at runtime
 * (CLAUDE.md invariant 13).
 *
 * Bricolage Grotesque for display: a grotesque with an optical-size axis, tight
 * and confident at hero sizes, still friendly to a student.
 * Plus Jakarta Sans for prose and controls: drawn by Tokotype, a Jakarta
 * foundry, for the city's own identity.
 * JetBrains Mono, tabular, for every time, angle and ratio: an unambiguous zero
 * and figures that do not reflow as the date is dragged.
 */
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const DESCRIPTION =
  'Dua kali setahun matahari berdiri tepat di atas kepala dan benda tegak berhenti berbayang. Dihitung dari lintang, bujur, dan tanggal — tanpa data luar.'

/**
 * The root layout's own metadata is a generic fallback — every real route
 * page under app/[locale] now exports its own generateMetadata with a
 * title, description and canonical URL specific to that page (lib/site's
 * pageMetadata), which overrides this per Next's metadata merging. What's
 * left here is what genuinely doesn't vary by page: the manifest link, the
 * keywords, the iOS install behaviour.
 *
 * `app/icon.svg`, `app/apple-icon.png` and `app/opengraph-image.png` are picked
 * up by file convention, so the tags for them are not written by hand here.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: 'Zero Shadow Day — Hari Tanpa Bayangan',
  description: DESCRIPTION,
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  applicationName: 'Zero Shadow Day',
  authors: [{ name: 'Andi Fathul Mukminin', url: 'https://andifathulms.github.io/en/' }],
  keywords: [
    'hari tanpa bayangan',
    'kulminasi utama',
    'zero shadow day',
    'gnomon',
    'Eratosthenes',
    'Indonesia',
  ],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Zero Shadow Day',
    title: 'Zero Shadow Day — Hari Tanpa Bayangan',
    description: DESCRIPTION,
    locale: 'id_ID',
    alternateLocale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zero Shadow Day — Hari Tanpa Bayangan',
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: 'Zero Shadow Day',
    // The ink tile, so the status bar matches the icon it launched from.
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#F3F5F4',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
