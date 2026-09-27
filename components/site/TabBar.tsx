'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Dictionary, Locale } from '@/lib/i18n'
import { type SectionKey, exploreItems, sectionOf } from './sections'

/**
 * The four sections within thumb reach, on a phone. Most readers in Indonesia
 * arrive on one, and a header menu that wraps to two lines is not navigation.
 */
export function TabBar({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const pathname = usePathname() ?? ''
  const active = sectionOf(pathname)
  const [exploring, setExploring] = useState(false)

  useEffect(() => setExploring(false), [pathname])

  const tab = (key: SectionKey, label: string, icon: React.ReactNode, href?: string) => {
    const className = `flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[0.6875rem] font-semibold transition ${
      active === key || (key === 'explore' && exploring) ? 'text-sky-deep' : 'text-shadow-2'
    }`
    return href ? (
      <Link href={href} aria-current={active === key ? 'page' : undefined} className={className}>
        {icon}
        {label}
      </Link>
    ) : (
      <button type="button" aria-expanded={exploring} onClick={() => setExploring((value) => !value)} className={className}>
        {icon}
        {label}
      </button>
    )
  }

  return (
    <nav
      aria-label={dictionary.nav.menu}
      className="tabbar fixed inset-x-0 bottom-0 z-40 border-t border-shadow/10 bg-chalk/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {exploring ? (
        <ul className="absolute inset-x-3 bottom-full mb-2 rounded-2xl border border-shadow/10 bg-chalk p-2 shadow-lift">
          {exploreItems(dictionary).map((item) => (
            <li key={item.href}>
              <Link
                href={`/${locale}/${item.href}`}
                onClick={() => setExploring(false)}
                className="block rounded-xl px-3 py-2.5 hover:bg-sky/60"
              >
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-xs text-shadow-2">{item.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid grid-cols-4 px-2 pt-1.5 pb-1">
        {tab('dates', dictionary.nav.dates, <CalendarIcon />, `/${locale}/tanggal`)}
        {tab('gnomon', dictionary.nav.gnomon, <GnomonIcon />, `/${locale}/bayangan`)}
        {tab('explore', dictionary.nav.explore, <CompassIcon />)}
        {tab('eratosthenes', dictionary.nav.eratosthenes, <GlobeIcon />, `/${locale}/eratosthenes`)}
      </div>
    </nav>
  )
}

const iconProps = { width: 22, height: 22, viewBox: '0 0 20 20', 'aria-hidden': true } as const

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="14" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function GnomonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 3v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 14l6 3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function CompassIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.8 7.2l-1.7 3.9-3.9 1.7 1.7-3.9z" fill="currentColor" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h14M10 3c-3 3.5-3 10.5 0 14M10 3c3 3.5 3 10.5 0 14" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
