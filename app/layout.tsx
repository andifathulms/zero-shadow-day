import type { Metadata, Viewport } from 'next'
import { Chivo_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'

/**
 * Fonts are self-hosted through next/font: no CDN, no request at runtime
 * (CLAUDE.md invariant 13).
 *
 * Instrument Serif for display — the register of an observatory notice.
 * Instrument Sans for controls and prose. Chivo Mono, tabular, for every time,
 * angle and ratio (PRD §9).
 */
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = Chivo_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

/**
 * The site is served from a repository path on GitHub Pages. Next prefixes the
 * icon links it generates from file convention, but not the manifest link — so
 * that one is written out with the basePath by hand. Without it the link points
 * at the domain root, 404s, and installing to a home screen fails silently.
 */
const BASE_PATH =
  process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_BASE_PATH ?? '/zero-shadow-day')
    : ''

const DESCRIPTION =
  'Dua kali setahun matahari berdiri tepat di atas kepala dan benda tegak berhenti berbayang. Dihitung dari lintang, bujur, dan tanggal — tanpa data luar.'

/**
 * `app/icon.svg`, `app/apple-icon.png` and `app/opengraph-image.png` are picked
 * up by file convention, so the tags for them are not written by hand here.
 * What is written here is what convention does not cover: the social card's
 * text, and the iOS bits that decide how an installed copy behaves.
 */
export const metadata: Metadata = {
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
  themeColor: '#FBF4E4',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        {/* Scroll-reveal starts hidden and is shown by an observer. Without
            scripting nothing would ever show it, so the pending state is
            cancelled outright. */}
        <noscript>
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: '.reveal-pending{opacity:1!important}' }} />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  )
}
