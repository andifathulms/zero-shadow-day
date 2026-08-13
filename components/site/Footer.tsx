import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'
import { MakerSignature } from './MakerSignature'

export function Footer({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <footer className="mt-16 border-t border-shadow/15">
      <div className="mx-auto max-w-6xl px-5 py-8 text-xs leading-relaxed text-shadow/70">
        <p className="max-w-prose">{dictionary.method.disclaimer}</p>
        <p className="mt-2 max-w-prose">{dictionary.place.privacy}</p>

        {/* The bottom bar: the site's own notices on the left, the maker's
            credit opposite. Grouping keeps them apart without a second rule. */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p>
            <Link href={`/${locale}/metode`} className="underline underline-offset-2">
              {dictionary.nav.method}
            </Link>
            {' · '}
            <a
              href="https://www.bmkg.go.id/"
              className="underline underline-offset-2"
              rel="noreferrer noopener"
              target="_blank"
            >
              BMKG
            </a>
          </p>

          <MakerSignature />
        </div>
      </div>
    </footer>
  )
}
