import type { Metadata } from 'next'
import { DatesDetail } from '@/components/dates/DatesDetail'
import { PlacePicker } from '@/components/place/PlacePicker'
import { NoonAnywhere } from '@/components/readout/NoonAnywhere'
import { ShareBar } from '@/components/share/ShareBar'
import { type Locale, getDictionary, localeStaticParams } from '@/lib/i18n'
import { pageMetadata } from '@/lib/site'

export function generateStaticParams() {
  return localeStaticParams()
}

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const dictionary = getDictionary(params.locale)
  return pageMetadata({
    locale: params.locale,
    slug: 'tanggal',
    title: `${dictionary.dates.heading} — ${dictionary.meta.title}`,
    description: dictionary.dates.lede,
  })
}

export default function DatesPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="font-display text-title">{dictionary.dates.heading}</h1>
        <p className="mt-3 max-w-prose leading-relaxed">{dictionary.dates.lede}</p>
      </header>

      <PlacePicker dictionary={dictionary} locale={params.locale} />
      <DatesDetail dictionary={dictionary} />
      <NoonAnywhere dictionary={dictionary} />
      <ShareBar dictionary={dictionary} />
    </div>
  )
}
