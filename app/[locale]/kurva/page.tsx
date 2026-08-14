import type { Metadata } from 'next'
import { Analemma } from '@/components/curves/Analemma'
import { ShadowTipCurves } from '@/components/curves/ShadowTipCurves'
import { PlacePicker } from '@/components/place/PlacePicker'
import { type Locale, getDictionary, localeStaticParams } from '@/lib/i18n'
import { pageMetadata } from '@/lib/site'

export function generateStaticParams() {
  return localeStaticParams()
}

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const dictionary = getDictionary(params.locale)
  return pageMetadata({
    locale: params.locale,
    slug: 'kurva',
    title: `${dictionary.curves.heading} — ${dictionary.meta.title}`,
    // No single curves.lede exists; tipLede is the page's own first
    // explanatory sentence, already rendered as visible content below.
    description: dictionary.curves.tipLede,
  })
}

export default function CurvesPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-12">
      <header className="max-w-3xl">
        <h1 className="font-display text-title">{dictionary.curves.heading}</h1>
      </header>

      <PlacePicker dictionary={dictionary} locale={params.locale} />

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ShadowTipCurves dictionary={dictionary} />
        <p className="max-w-prose leading-relaxed lg:pt-4">{dictionary.curves.tipLede}</p>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Analemma dictionary={dictionary} />
        <p className="max-w-prose leading-relaxed lg:pt-4">{dictionary.curves.analemmaLede}</p>
      </section>
    </div>
  )
}
