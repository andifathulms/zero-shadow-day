import { DatesDetail } from '@/components/dates/DatesDetail'
import { PlacePicker } from '@/components/place/PlacePicker'
import { NoonAnywhere } from '@/components/readout/NoonAnywhere'
import { type Locale, getDictionary } from '@/lib/i18n'

export default function DatesPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl">{dictionary.dates.heading}</h1>
        <p className="mt-3 max-w-prose leading-relaxed">{dictionary.dates.lede}</p>
      </header>

      <PlacePicker dictionary={dictionary} locale={params.locale} />
      <DatesDetail dictionary={dictionary} />
      <NoonAnywhere dictionary={dictionary} />
    </div>
  )
}
