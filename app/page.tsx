import Link from 'next/link'
import { DEFAULT_LOCALE, LOCALES, getDictionary } from '@/lib/i18n'

/**
 * The root is a static landing that sends the visitor to the Indonesian site.
 * `output: 'export'` has no redirects, so this is a meta refresh with real
 * links behind it — which is also what a visitor without scripting gets.
 */
export const metadata = {
  title: 'Hari Tanpa Bayangan',
}

export default function RootPage() {
  const dictionary = getDictionary(DEFAULT_LOCALE)

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta httpEquiv="refresh" content={`0; url=./${DEFAULT_LOCALE}/`} />
      </head>
      <div className="mx-auto max-w-2xl px-5 py-24">
        <h1 className="font-display text-4xl">{dictionary.meta.title}</h1>
        <p className="mt-4 max-w-prose leading-relaxed">{dictionary.meta.tagline}</p>
        <ul className="mt-8 flex gap-6">
          {LOCALES.map((locale) => (
            <li key={locale}>
              <Link href={`/${locale}`} className="border-b border-shadow pb-0.5" hrefLang={locale}>
                {locale === 'id' ? 'Bahasa Indonesia' : 'English'}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
