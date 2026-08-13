import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'

export function Footer({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <footer className="mt-16 border-t border-shadow/15">
      <div className="mx-auto max-w-6xl px-5 py-8 text-xs leading-relaxed text-shadow/60">
        <p className="max-w-prose">{dictionary.method.disclaimer}</p>
        <p className="mt-2 max-w-prose">{dictionary.place.privacy}</p>
        <p className="mt-2">
          <Link href={`/${locale}/metode`} className="underline underline-offset-2">
            {dictionary.nav.method}
          </Link>
          {' · '}
          <a
            href="https://www.bmkg.go.id/"
            className="underline underline-offset-2"
            rel="noreferrer noopener"
          >
            BMKG
          </a>
        </p>
      </div>
    </footer>
  )
}
