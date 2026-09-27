'use client'

import { formatLatitude } from '@/lib/format'
import type { Dictionary, Locale } from '@/lib/i18n'
import { usePlace } from './PlaceProvider'

/**
 * The chosen place, always in view. Every number on every page depends on it,
 * so it lives in the header rather than at the foot of a tool.
 */
export function PlaceChip({
  dictionary,
  locale,
  className = '',
}: {
  dictionary: Dictionary
  locale: Locale
  className?: string
}) {
  const { place, openPicker } = usePlace()

  return (
    <button
      type="button"
      onClick={openPicker}
      aria-haspopup="dialog"
      className={`group inline-flex min-w-0 items-center gap-2 rounded-full border border-shadow/15 bg-chalk py-1.5 pl-2.5 pr-3.5 text-sm font-semibold transition hover:border-sky-deep/50 ${className}`}
    >
      <PinIcon />
      <span className="truncate">{place.label}</span>
      <span className="hidden font-mono text-xs font-normal text-shadow-2 tabular sm:inline">
        {formatLatitude(place.latDeg, locale, 2)}
      </span>
      <span className="sr-only">— {dictionary.place.change}</span>
    </button>
  )
}

function PinIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden className="shrink-0 text-sky-deep">
      <path
        d="M6 13s5-4.6 5-8A5 5 0 0 0 1 5c0 3.4 5 8 5 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="6" cy="5" r="1.7" fill="currentColor" />
    </svg>
  )
}
