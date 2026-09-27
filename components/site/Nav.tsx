'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PlaceChip } from '@/components/place/PlaceChip'
import type { Dictionary, Locale } from '@/lib/i18n'
import { Mark } from './Mark'
import { exploreItems, otherLocalePath, sectionOf } from './sections'

export function Nav({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const pathname = usePathname() ?? `/${locale}`
  const other: Locale = locale === 'id' ? 'en' : 'id'
  const active = sectionOf(pathname)
  // Indonesian-first (CLAUDE.md): the wordmark leads with the Indonesian name
  // on the id locale rather than always leading with the English product name.
  const primaryName = locale === 'id' ? dictionary.meta.localName : dictionary.meta.title

  const link = (slug: string, key: 'dates' | 'gnomon' | 'eratosthenes', label: string, hint: string) => (
    <li>
      <Link
        href={`/${locale}/${slug}`}
        title={hint}
        aria-current={active === key ? 'page' : undefined}
        className={navItemClass(active === key)}
      >
        {label}
      </Link>
    </li>
  )

  return (
    <header className="site-nav sticky top-0 z-40 border-b border-shadow/10 bg-bleached/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-5">
        <Link
          href={`/${locale}`}
          className="group flex shrink-0 items-center gap-2.5 text-shadow"
          aria-label={dictionary.meta.title}
        >
          <Mark size={36} className="shrink-0 transition group-hover:text-sky-deep" />
          <span className="hidden font-display text-lg font-bold leading-none tracking-[-0.02em] sm:block">
            {primaryName}
          </span>
        </Link>

        <nav aria-label={dictionary.nav.menu} className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm font-medium">
            {link('tanggal', 'dates', dictionary.nav.dates, dictionary.nav.datesHint)}
            {link('bayangan', 'gnomon', dictionary.nav.gnomon, dictionary.home.exploreGnomon)}
            <li>
              <ExploreMenu locale={locale} dictionary={dictionary} active={active === 'explore'} />
            </li>
            {link('eratosthenes', 'eratosthenes', dictionary.nav.eratosthenes, dictionary.home.exploreEratosthenes)}
          </ul>
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <PlaceChip dictionary={dictionary} locale={locale} className="max-w-[11rem] sm:max-w-none" />
          <Link
            href={otherLocalePath(pathname, other)}
            hrefLang={other}
            title={dictionary.nav.otherLanguage}
            className="rounded-lg px-2.5 py-2 text-xs font-bold tracking-[0.1em] text-shadow-2 transition hover:text-sky-deep"
          >
            {other.toUpperCase()}
            <span className="sr-only"> — {dictionary.nav.otherLanguage}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

function navItemClass(active: boolean): string {
  return `inline-flex items-center gap-1 rounded-lg px-3 py-2 transition ${
    active ? 'bg-sky text-sky-deep' : 'text-shadow-2 hover:bg-shadow/5 hover:text-shadow'
  }`
}

/** Jelajahi: the three deeper visualisations, in a disclosure menu. */
function ExploreMenu({
  locale,
  dictionary,
  active,
}: {
  locale: Locale
  dictionary: Dictionary
  active: boolean
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={navItemClass(active)}
      >
        {dictionary.nav.explore}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={`transition ${open ? 'rotate-180' : ''}`}>
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open ? (
        <ul className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-shadow/10 bg-chalk p-2 shadow-lift">
          {exploreItems(dictionary).map((item) => (
            <li key={item.href}>
              <Link
                href={`/${locale}/${item.href}`}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 transition hover:bg-sky/60"
              >
                <span className="block font-semibold text-shadow">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-shadow-2">{item.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
