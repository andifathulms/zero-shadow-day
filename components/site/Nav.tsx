import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'

const SECTIONS = [
  { slug: '', key: 'home' },
  { slug: 'bayangan', key: 'gnomon' },
  { slug: 'tanggal', key: 'dates' },
  { slug: 'kurva', key: 'curves' },
  { slug: 'eratosthenes', key: 'eratosthenes' },
  { slug: 'sapuan', key: 'sweep' },
  { slug: 'metode', key: 'method' },
] as const

export function Nav({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const other: Locale = locale === 'id' ? 'en' : 'id'

  return (
    <header className="border-b border-shadow/15">
      <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-3 px-5 py-4">
        <Link href={`/${locale}`} className="font-display text-xl leading-none">
          {dictionary.meta.title}
        </Link>
        <nav aria-label={dictionary.nav.home}>
          <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
            {SECTIONS.slice(1).map((section) => (
              <li key={section.slug}>
                <Link
                  href={`/${locale}/${section.slug}`}
                  className="border-b border-transparent pb-0.5 hover:border-shadow"
                >
                  {dictionary.nav[section.key]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/${other}`}
                className="label border-b border-transparent pb-0.5 hover:border-shadow"
                hrefLang={other}
              >
                {other.toUpperCase()}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
