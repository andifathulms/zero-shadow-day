import type { Metadata } from 'next'
import { Analemma } from '@/components/curves/Analemma'
import { ShadowTipCurves } from '@/components/curves/ShadowTipCurves'
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
    slug: 'kurva',
    title: `${dictionary.curves.heading} — ${dictionary.meta.title}`,
    // No single curves.lede exists; tipLede is the page's own first
    // explanatory sentence, already rendered as visible content below.
    description: dictionary.curves.tipLede,
  })
}

export default function CurvesPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  const tabs = [
    { id: 'jejak', label: dictionary.nav.curves },
    { id: 'analema', label: dictionary.nav.analemma },
  ]

  return (
    <div className="space-y-12">
      <PageHeader eyebrow={dictionary.nav.explore} title={dictionary.curves.heading} />

      {/* Two views on one page, reachable from the Jelajahi menu by anchor. */}
      <nav aria-label={dictionary.curves.heading} className="sticky top-[4.25rem] z-30 -mx-1 w-fit">
        <ul className="flex gap-1 rounded-full border border-shadow/10 bg-chalk/90 p-1 backdrop-blur">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <a
                href={`#${tab.id}`}
                className="block rounded-full px-4 py-1.5 text-sm font-semibold text-shadow-2 transition hover:bg-sky hover:text-sky-deep"
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="jejak" aria-labelledby="jejak-title" className="scroll-mt-32 space-y-5">
        <h2 id="jejak-title" className="text-title">
          {dictionary.nav.curves}
        </h2>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ShadowTipCurves dictionary={dictionary} />
          <p className="max-w-prose text-lg leading-relaxed text-shadow-2 lg:pt-2">{dictionary.curves.tipLede}</p>
        </div>
      </section>

      <section id="analema" aria-labelledby="analema-title" className="scroll-mt-32 space-y-5">
        <h2 id="analema-title" className="text-title">
          {dictionary.nav.analemma}
        </h2>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Analemma dictionary={dictionary} />
          <p className="max-w-prose text-lg leading-relaxed text-shadow-2 lg:pt-2">{dictionary.curves.analemmaLede}</p>
        </div>
      </section>
    </div>
  )
}
