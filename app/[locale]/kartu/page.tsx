import type { Metadata } from 'next'
import { KartuStudio } from '@/components/kartu/KartuStudio'
import { PageHeader } from '@/components/site/PageHeader'
import { localeStaticParams } from '@/lib/i18n'

/**
 * An operator's tool, not a destination: TikTok carousel cards written from
 * the engine's own numbers. Not in the nav, the tab bar or the sitemap, and
 * kept out of search. Indonesian in both locales — the cards are.
 */

export function generateStaticParams() {
  return localeStaticParams()
}

export const metadata: Metadata = {
  title: 'Buat kartu TikTok — Zero Shadow Day',
  robots: { index: false, follow: false },
}

export default function KartuPage() {
  return (
    <div className="space-y-8" lang="id">
      <PageHeader
        eyebrow="Alat"
        title="Buat kartu TikTok"
        lede="Kartu 1080×1920 dari hitungan aplikasi ini sendiri. Pilih cerita, kota, dan tanggal; teksnya bisa diedit, lalu unduh ZIP. Semua dirender di peramban, tidak ada yang diunggah."
      />
      <KartuStudio />
    </div>
  )
}
