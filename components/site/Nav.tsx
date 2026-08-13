import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'
import { Mark } from './Mark'

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
  // Indonesian-first (CLAUDE.md): the wordmark leads with the Indonesian name
  // on the id locale rather than always leading with the English product name.
  const isId = locale === 'id'
  const primaryName = isId ? dictionary.meta.localName : dictionary.meta.title
  const secondaryName = isId ? dictionary.meta.title : dictionary.meta.localName

  // A one-line hint per section, read by screen readers and shown as a native
  // tooltip, so single-word nav labels like "Kurva" or "Sapuan" aren't opaque.
  const hints: Record<(typeof SECTIONS)[number]['key'], string> = {
    home: dictionary.nav.home,
    gnomon: dictionary.home.exploreGnomon,
    dates: dictionary.home.exploreDates,
    curves: dictionary.home.exploreCurves,
    eratosthenes: dictionary.home.exploreEratosthenes,
    sweep: dictionary.home.exploreSweep,
    method: dictionary.nav.methodHint,
  }

  return (
    <header className="border-b border-shadow/15">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4">
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-2.5 text-shadow"
          aria-label={dictionary.meta.title}
        >
          <Mark size={34} className="shrink-0 transition group-hover:text-marker-ink" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl leading-none">{primaryName}</span>
            <span className="mt-0.5 hidden text-[0.6875rem] tracking-[0.08em] text-shadow/70 sm:block">
              {secondaryName}
            </span>
          </span>
        </Link>
        <nav aria-label={dictionary.nav.home}>
          <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
            {SECTIONS.slice(1).map((section) => (
              <li key={section.slug}>
                <Link
                  href={`/${locale}/${section.slug}`}
                  title={hints[section.key]}
                  className="border-b border-transparent pb-0.5 hover:border-shadow"
                >
                  {dictionary.nav[section.key]}
                  <span className="sr-only"> — {hints[section.key]}</span>
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
