import Link from 'next/link'
import { DatesSummary } from '@/components/dates/DatesSummary'
import { PlacePicker } from '@/components/place/PlacePicker'
import { type Locale, getDictionary } from '@/lib/i18n'

export default function HomePage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  return (
    <div className="space-y-12">
      <section className="max-w-3xl">
        <h1 className="font-display text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05]">
          {dictionary.meta.title}
        </h1>
        <p className="mt-5 max-w-prose text-lg leading-relaxed">{dictionary.home.lede}</p>
        <p className="mt-4 max-w-prose leading-relaxed text-shadow/80">{dictionary.home.body}</p>

        <Link
          href={`/${params.locale}/bayangan`}
          className="mt-7 inline-block border border-shadow px-4 py-2 text-sm hover:bg-shadow hover:text-bleached"
        >
          {dictionary.home.enter}
        </Link>
      </section>

      <PlacePicker dictionary={dictionary} locale={params.locale} />

      <DatesSummary
        dictionary={dictionary}
        locale={params.locale}
        href={`/${params.locale}/tanggal`}
      />

      <section className="max-w-3xl">
        <p className="max-w-prose leading-relaxed text-shadow/80">{dictionary.home.twoMore}</p>
        <ul className="mt-4 space-y-4">
          <li className="border-l-2 border-shadow/25 pl-4">
            <p className="max-w-prose leading-relaxed">{dictionary.home.flip}</p>
          </li>
          <li className="border-l-2 border-shadow/25 pl-4">
            <p className="max-w-prose leading-relaxed">{dictionary.home.noonOffset}</p>
          </li>
        </ul>
      </section>
    </div>
  )
}
