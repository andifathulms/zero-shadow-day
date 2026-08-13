import { SweepMap } from '@/components/sweep/SweepMap'
import { type Locale, getDictionary } from '@/lib/i18n'

export default function SweepPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="font-display text-title">{dictionary.sweep.heading}</h1>
        <p className="mt-3 max-w-prose leading-relaxed">{dictionary.sweep.lede}</p>
      </header>

      <SweepMap dictionary={dictionary} />
    </div>
  )
}
