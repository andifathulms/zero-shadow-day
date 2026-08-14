import type { Metadata } from 'next'
import Link from 'next/link'
import { DatesSummary } from '@/components/dates/DatesSummary'
import { Hero } from '@/components/home/Hero'
import { Reveal } from '@/components/motion/Reveal'
import { PlacePicker } from '@/components/place/PlacePicker'
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

export default function HomePage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  // Plain language first: what is happening, in three steps, before any
  // astronomy vocabulary appears anywhere on the page.
  const steps = [
    { title: dictionary.home.how1Title, body: dictionary.home.how1 },
    { title: dictionary.home.how2Title, body: dictionary.home.how2 },
    { title: dictionary.home.how3Title, body: dictionary.home.how3 },
  ]

  const tools = [
    { slug: 'bayangan', label: dictionary.nav.gnomon, body: dictionary.home.exploreGnomon },
    { slug: 'tanggal', label: dictionary.nav.dates, body: dictionary.home.exploreDates },
    { slug: 'kurva', label: dictionary.nav.curves, body: dictionary.home.exploreCurves },
    {
      slug: 'eratosthenes',
      label: dictionary.nav.eratosthenes,
      body: dictionary.home.exploreEratosthenes,
    },
    { slug: 'sapuan', label: dictionary.nav.sweep, body: dictionary.home.exploreSweep },
  ]

  return (
    <div className="space-y-16">
      <Hero dictionary={dictionary} locale={params.locale} />

      <section id="kenapa" className="scroll-mt-8">
        <h2 className="max-w-[20ch] font-display text-title">{dictionary.home.howHeading}</h2>
        <ol className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal
              key={step.title}
              as="li"
              delayMs={index * 90}
              className="border-t border-shadow/15 pt-5"
            >
              <span className="font-mono text-sm text-shadow/45" aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-display text-2xl">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-shadow/80">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section
        id="tempat"
        className="scroll-mt-8 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start"
      >
        <PlacePicker dictionary={dictionary} locale={params.locale} />
        <DatesSummary
          dictionary={dictionary}
          locale={params.locale}
          href={`/${params.locale}/tanggal`}
        />
      </section>

      <section>
        <h2 className="font-display text-title">{dictionary.home.exploreHeading}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <Reveal key={tool.slug} as="li" delayMs={index * 70}>
              <Link
                href={`/${params.locale}/${tool.slug}`}
                className="group flex h-full flex-col rounded-lg border border-shadow/10 bg-chalk p-6 transition duration-300 hover:-translate-y-1 hover:border-shadow/30 hover:shadow-lift"
              >
                <span className="flex items-baseline justify-between gap-3 font-display text-2xl transition group-hover:text-marker-ink">
                  {tool.label}
                  <span
                    aria-hidden
                    className="font-sans text-lg text-shadow/40 transition duration-300 group-hover:translate-x-1 group-hover:text-marker-ink"
                  >
                    →
                  </span>
                </span>
                <span className="mt-2 leading-relaxed text-shadow/80">{tool.body}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="max-w-3xl">
        <p className="max-w-prose leading-relaxed text-shadow/80">{dictionary.home.body}</p>
        <ul className="mt-6 space-y-4">
          <li className="border-l-2 border-sun pl-4">
            <p className="max-w-prose leading-relaxed">{dictionary.home.flip}</p>
          </li>
          <li className="border-l-2 border-sun pl-4">
            <p className="max-w-prose leading-relaxed">{dictionary.home.noonOffset}</p>
          </li>
        </ul>
      </section>
    </div>
  )
}
