import type { Metadata } from 'next'
import { Hero } from '@/components/home/Hero'
import { TodayNusantara } from '@/components/home/TodayNusantara'
import { ToolCards } from '@/components/home/ToolCards'
import { YearRibbon } from '@/components/home/YearRibbon'
import { type Locale, getDictionary, localeStaticParams } from '@/lib/i18n'
import { pageMetadata } from '@/lib/site'

export function generateStaticParams() {
  return localeStaticParams()
}

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const dictionary = getDictionary(params.locale)
  const isId = params.locale === 'id'
  return pageMetadata({
    locale: params.locale,
    title: isId
      ? `${dictionary.meta.localName} — ${dictionary.meta.title}`
      : `${dictionary.meta.title} — ${dictionary.meta.localName}`,
    description: dictionary.home.plain,
  })
}

/**
 * Answer first, then the reason, then a reason to come back, then the tools.
 */
export default function HomePage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  // Plain language: what is happening, in three steps, behind a disclosure
  // under the chart that already shows it.
  const steps = [
    { title: dictionary.home.how1Title, body: dictionary.home.how1 },
    { title: dictionary.home.how2Title, body: dictionary.home.how2 },
    { title: dictionary.home.how3Title, body: dictionary.home.how3 },
  ]

  return (
    <div className="space-y-16 sm:space-y-20">
      <Hero dictionary={dictionary} locale={params.locale} />

      <div className="space-y-4">
        <YearRibbon dictionary={dictionary} locale={params.locale} />
        <details id="kenapa" className="group panel scroll-mt-24 open:pb-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-sky-deep">
            {dictionary.home.howHeading} · {dictionary.home.learnMore}
            <span aria-hidden className="transition group-open:rotate-45">+</span>
          </summary>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-shadow/10 pt-4">
                <span className="font-mono text-sm text-shadow-2" aria-hidden>
                  {index + 1}
                </span>
                <h3 className="mt-2 text-xl">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-shadow-2">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 max-w-3xl space-y-4">
            <p className="leading-relaxed text-shadow-2">{dictionary.home.body}</p>
            <p className="border-l-2 border-sun pl-4 leading-relaxed">{dictionary.home.flip}</p>
            <p className="border-l-2 border-sun pl-4 leading-relaxed">{dictionary.home.noonOffset}</p>
          </div>
        </details>
      </div>

      <TodayNusantara dictionary={dictionary} locale={params.locale} />

      <ToolCards dictionary={dictionary} locale={params.locale} />
    </div>
  )
}
