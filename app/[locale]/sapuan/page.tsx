import type { Metadata } from 'next'
import { PageHeader } from '@/components/site/PageHeader'
import { SweepMap } from '@/components/sweep/SweepMap'
import { type Locale, getDictionary, localeStaticParams } from '@/lib/i18n'
import { pageMetadata } from '@/lib/site'

export function generateStaticParams() {
  return localeStaticParams()
}

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const dictionary = getDictionary(params.locale)
  return pageMetadata({
    locale: params.locale,
    slug: 'sapuan',
    title: `${dictionary.sweep.heading} — ${dictionary.meta.title}`,
    description: dictionary.sweep.lede,
  })
}

export default function SweepPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={dictionary.nav.explore}
        title={dictionary.sweep.heading}
        lede={dictionary.sweep.lede}
      />

      <SweepMap dictionary={dictionary} />
    </div>
  )
}
