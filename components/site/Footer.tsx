import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'
import { Mark } from './Mark'
import { MakerSignature } from './MakerSignature'
import { exploreItems } from './sections'

export function Footer({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const tools = [
    { href: 'tanggal', label: dictionary.nav.dates },
    { href: 'bayangan', label: dictionary.nav.gnomon },
    ...exploreItems(dictionary).map((item) => ({ href: item.href, label: item.label })),
    { href: 'eratosthenes', label: dictionary.nav.eratosthenes },
  ]

  return (
    <footer className="site-footer mt-20 border-t border-shadow/10 bg-chalk">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.02em]">
            <Mark size={28} />
            {locale === 'id' ? dictionary.meta.localName : dictionary.meta.title}
          </p>
          <p className="max-w-prose text-xs leading-relaxed text-shadow-2">{dictionary.method.disclaimer}</p>
          <p className="max-w-prose text-xs leading-relaxed text-shadow-2">{dictionary.place.privacy}</p>
        </div>

        <nav aria-label={dictionary.nav.footerTools}>
          <p className="label">{dictionary.nav.footerTools}</p>
          <ul className="mt-3 space-y-2">
            {tools.map((tool) => (
              <li key={tool.href}>
                <Link href={`/${locale}/${tool.href}`} className="text-shadow-2 transition hover:text-sky-deep">
                  {tool.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="label">{dictionary.nav.footerAbout}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href={`/${locale}/metode`} className="text-shadow-2 transition hover:text-sky-deep">
                {dictionary.nav.method}
              </Link>
            </li>
            <li>
              <a
                href="https://www.bmkg.go.id/"
                className="text-shadow-2 transition hover:text-sky-deep"
                rel="noreferrer noopener"
                target="_blank"
              >
                BMKG ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-shadow/10">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <MakerSignature />
        </div>
      </div>
    </footer>
  )
}
