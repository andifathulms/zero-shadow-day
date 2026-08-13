'use client'

import { useEffect, useState } from 'react'
import { usePlace } from '@/components/place/PlaceProvider'
import { currentYearIn } from '@/lib/clock'
import { noonOfYear } from '@/lib/day'
import { buildIcs, buildNoonCsv, downloadText } from '@/lib/export'
import type { Dictionary } from '@/lib/i18n'
import { encodeView } from '@/lib/share'
import type { CivilDate } from '@/lib/solar/julian'
import { zeroShadowDays } from '@/lib/zsd'

/**
 * Share and export. Everything is generated here in the tab: the link is the
 * view encoded as query parameters, and the files are blobs built from values
 * already computed. Nothing is uploaded, and there is no endpoint to upload to.
 */
export function ShareBar({
  dictionary,
  date,
  localHours,
  year,
}: {
  dictionary: Dictionary
  /** Include the shown date in the link, when there is one. */
  date?: CivilDate
  localHours?: number
  year?: number
}) {
  const { place } = usePlace()
  const [copied, setCopied] = useState(false)
  // When the caller has no date of its own, the exports cover the current year
  // at the place's own clock. Resolved after mount, like every other wall-clock
  // reading in the app.
  const [fallbackYear, setFallbackYear] = useState<number | null>(null)
  useEffect(() => setFallbackYear(currentYearIn(place.offsetHours)), [place.offsetHours])
  const exportYear = year ?? date?.year ?? fallbackYear ?? undefined

  const copyLink = async () => {
    const query = encodeView({
      latDeg: place.latDeg,
      lonDeg: place.lonDeg,
      offsetHours: place.offsetHours,
      label: place.label,
      date,
      localHours,
    })
    const url = `${window.location.origin}${window.location.pathname}?${query}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission refused: put it in the address bar instead, which
      // the reader can copy by hand.
      window.history.replaceState(null, '', `?${query}`)
    }
  }

  const downloadCalendar = () => {
    const target = exportYear
    if (target === undefined) return
    const result = zeroShadowDays(place, target)
    if (result.type !== 'zero-shadow-days') return
    downloadText(
      `hari-tanpa-bayangan-${slug(place.label)}-${target}.ics`,
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
  }

  const downloadCsv = () => {
    const target = exportYear
    if (target === undefined) return
    downloadText(
      `kulminasi-${slug(place.label)}-${target}.csv`,
      buildNoonCsv(noonOfYear(place, target), place.label),
      'text/csv',
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={copyLink} className={buttonClass}>
        {copied ? dictionary.share.copied : dictionary.share.copyLink}
      </button>
      <button type="button" onClick={downloadCalendar} className={buttonClass}>
        {dictionary.share.calendar}
      </button>
      <button type="button" onClick={downloadCsv} className={buttonClass}>
        {dictionary.share.spreadsheet}
      </button>
      <p className="text-xs text-shadow/70">{dictionary.share.note}</p>
    </div>
  )
}

const buttonClass =
  'rounded-full border border-shadow/40 px-4 py-2 text-sm transition hover:bg-shadow hover:text-chalk'

/** DTSTAMP in iCalendar's basic UTC format. A wall-clock reading, so it lives here. */
function icsStamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  )
}

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
