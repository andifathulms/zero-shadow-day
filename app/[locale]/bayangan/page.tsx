import type { Metadata } from 'next'
import Link from 'next/link'
import { GnomonView } from '@/components/gnomon/GnomonView'
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
    slug: 'bayangan',
    title: `${dictionary.gnomon.heading} — ${dictionary.meta.title}`,
    description: dictionary.gnomon.lede,
  })
}

export default function GnomonPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-10">
      <PageHeader title={dictionary.gnomon.heading} lede={dictionary.gnomon.lede}>
        {/* The window caveat, and the method behind it, linked here rather than buried. */}
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-shadow-2">
          {dictionary.dates.windowNote}{' '}
          <Link href={`/${params.locale}/metode`} className="link">
            {dictionary.nav.method} →
          </Link>
        </p>
      </PageHeader>

      <GnomonView dictionary={dictionary} />
    </div>
  )
}
