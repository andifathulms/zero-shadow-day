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

export const metadata: Metadata = {
  title: 'Hari Tanpa Bayangan — Zero Shadow Day',
  description:
    'Dua kali setahun matahari berdiri tepat di atas kepala dan benda tegak berhenti berbayang. Dihitung dari lintang, bujur, dan tanggal — tanpa data luar.',
}

export const viewport: Viewport = {
  themeColor: '#EDE9DF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
