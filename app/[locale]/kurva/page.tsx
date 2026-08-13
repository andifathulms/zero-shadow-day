import { Analemma } from '@/components/curves/Analemma'
import { ShadowTipCurves } from '@/components/curves/ShadowTipCurves'
import { PlacePicker } from '@/components/place/PlacePicker'
import { type Locale, getDictionary } from '@/lib/i18n'

export default function CurvesPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-12">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl">{dictionary.curves.heading}</h1>
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
