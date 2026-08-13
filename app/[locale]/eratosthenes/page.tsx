import { EratosthenesLab } from '@/components/eratosthenes/EratosthenesLab'
import { PlacePicker } from '@/components/place/PlacePicker'
import { type Locale, getDictionary } from '@/lib/i18n'

export default function EratosthenesPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="font-display text-title">{dictionary.eratosthenes.heading}</h1>
        <p className="mt-3 max-w-prose leading-relaxed">{dictionary.eratosthenes.lede}</p>
      </header>

      <PlacePicker dictionary={dictionary} locale={params.locale} />
      <EratosthenesLab dictionary={dictionary} />
    </div>
  )
}
