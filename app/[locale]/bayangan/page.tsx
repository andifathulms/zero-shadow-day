import type { Metadata } from 'next'
import Link from 'next/link'
import { GnomonView } from '@/components/gnomon/GnomonView'
import { PlacePicker } from '@/components/place/PlacePicker'
import { type Locale, getDictionary } from '@/lib/i18n'
import { pageMetadata } from '@/lib/site'

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const dictionary = getDictionary(params.locale)
  return pageMetadata({
    locale: params.locale,
    slug: 'bayangan',
    title: `${dictionary.gnomon.heading} — ${dictionary.meta.title}`,
    description: dictionary.gnomon.lede,
  })
}

export default function GnomonPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="font-display text-title">{dictionary.gnomon.heading}</h1>
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
