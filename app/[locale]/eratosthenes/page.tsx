import type { Metadata } from 'next'
import { EratosthenesLab } from '@/components/eratosthenes/EratosthenesLab'
import { PageHeader } from '@/components/site/PageHeader'
import { type Locale, getDictionary, localeStaticParams } from '@/lib/i18n'
import { pageMetadata } from '@/lib/site'

export function generateStaticParams() {
  return localeStaticParams()
}

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const dictionary = getDictionary(params.locale)
  return pageMetadata({
    locale: params.locale,
    slug: 'eratosthenes',
    title: `${dictionary.eratosthenes.heading} — ${dictionary.meta.title}`,
    description: dictionary.eratosthenes.lede,
  })
}

export default function EratosthenesPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={dictionary.eratosthenes.kicker}
        title={dictionary.eratosthenes.heading}
        lede={dictionary.eratosthenes.lede}
      />
      <EratosthenesLab dictionary={dictionary} />
    </div>
  )
}
