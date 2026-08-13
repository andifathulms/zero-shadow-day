import Link from 'next/link'
import { GnomonView } from '@/components/gnomon/GnomonView'
import { PlacePicker } from '@/components/place/PlacePicker'
import { type Locale, getDictionary } from '@/lib/i18n'

export default function GnomonPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl">{dictionary.gnomon.heading}</h1>
        <p className="mt-3 max-w-prose leading-relaxed">{dictionary.gnomon.lede}</p>
        {/* The window caveat, and the method behind it, linked here rather than buried. */}
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-shadow/70">
          {dictionary.dates.windowNote}{' '}
          <Link
            href={`/${params.locale}/metode`}
            className="underline underline-offset-2 hover:text-marker"
          >
            {dictionary.nav.method}
          </Link>
        </p>
      </header>

      <GnomonView dictionary={dictionary} />

      <PlacePicker dictionary={dictionary} locale={params.locale} />
    </div>
  )
}
