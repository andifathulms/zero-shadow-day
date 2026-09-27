'use client'

import { useCallback } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { buildIcs, downloadText } from '@/lib/export'
import type { Dictionary } from '@/lib/i18n'
import { zeroShadowDays } from '@/lib/zsd'

/**
 * Download a year's zero shadow days as an .ics file, built in the tab. Shared
 * by the share bar and the home page's "add to calendar" button so there is
 * one definition of what goes in the file.
 */
export function useCalendarDownload(dictionary: Dictionary): (year: number) => void {
  const { place } = usePlace()

  return useCallback(
    (year: number) => {
      const result = zeroShadowDays(place, year)
      if (result.type !== 'zero-shadow-days') return
      downloadText(
        `hari-tanpa-bayangan-${slug(place.label)}-${year}.ics`,
        buildIcs({
          placeLabel: place.label,
          offsetHours: place.offsetHours,
          days: result.days,
          stamp: icsStamp(new Date()),
          title: dictionary.meta.title,
          windowNote: dictionary.dates.windowNote,
          siteUrl: window.location.href.split('?')[0],
        }),
        'text/calendar',
      )
    },
    [place, dictionary],
  )
}

/** DTSTAMP in iCalendar's basic UTC format. A wall-clock reading, so it lives here. */
function icsStamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  )
}

export function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
