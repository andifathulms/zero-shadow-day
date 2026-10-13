'use client'

import type { Warning } from 'carousel-core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { INDONESIAN_CITIES } from '@/data/cities/indonesia'
import { usePlace } from '@/components/place/PlaceProvider'
import {
  CAPTION_MAX,
  CARD_KINDS,
  type CardKind,
  TITLE_MAX,
  buildDeck,
  cityForPlace,
} from '@/lib/cards'
import { todayIn } from '@/lib/clock'
import type { CivilDate } from '@/lib/solar/julian'
import { CAROUSEL_PRESS_URL, type Core, loadCore, loadZip } from './core'

/**
 * "Buat kartu TikTok": pick a story, a city and a date; the deck is written by
 * lib/cards from the engine, can be edited by hand, and renders live with
 * carousel-core. This component holds state and wiring only — every number
 * in a deck is computed in lib/cards (CLAUDE.md invariant 14).
 */

const KIND_LABELS: Record<CardKind, { label: string; hint: string }> = {
  'cek-kotamu': { label: 'Cek Kotamu', hint: 'Tanggal, jam, dan jendela satu kota.' },
  'bayangan-minggu-ini': { label: 'Bayangan Minggu Ini', hint: 'Semua kota dalam tujuh hari.' },
  'cluster-hari-ini': { label: 'Klaster Hari Itu', hint: 'Kota-kota yang berbagi hari dengan kotamu.' },
  'kota-terakhir': { label: 'Kota Terakhir', hint: 'Kota terakhir sebelum jeda panjang.' },
  'ukur-bumi': { label: 'Ukur Bumi', hint: 'Tantangan Eratosthenes dari kotamu.' },
  'tengah-hari-bukan-jam-12': { label: 'Tengah Hari Bukan Jam 12', hint: 'Kulminasi di tiap zona waktu.' },
  'mitos-vs-hitungan': { label: 'Mitos vs Hitungan', hint: 'Lima mitos, dijawab angka.' },
}

const RENDER_DELAY_MS = 450

type Status =
  | { type: 'loading' }
  | { type: 'rendering' }
  | { type: 'ready'; blobs: Blob[]; urls: string[]; text: string }
  | { type: 'blocked' }
  | { type: 'failed'; message: string }

function isoDate(date: CivilDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
}

function parseIsoDate(value: string): CivilDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

export function KartuStudio() {
  const { place } = usePlace()
  const placeCity = useMemo(() => cityForPlace(place), [place])

  const [kind, setKind] = useState<CardKind>('cek-kotamu')
  const [cityName, setCityName] = useState<string | null>(null)
  const [dateText, setDateText] = useState<string | null>(null)

  // The clock is read in the browser, never at build time: the export would
  // otherwise freeze "hari ini" at the day the site was built.
  const cityNameOrPlace = cityName ?? placeCity.name
  const city = INDONESIAN_CITIES.find((c) => c.name === cityNameOrPlace) ?? placeCity
  useEffect(() => {
    if (dateText === null) setDateText(isoDate(todayIn(city.offsetHours)))
  }, [dateText, city.offsetHours])
  const today = dateText ? parseIsoDate(dateText) : null

  const generated = useMemo(
    () => (today ? buildDeck({ kind, city, today }) : null),
    // today is rebuilt each render from dateText; key on the text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, city, dateText],
  )

  const [text, setText] = useState('')
  useEffect(() => {
    if (generated) setText(generated.text)
  }, [generated])
  const edited = generated !== null && text !== generated.text

  // ── carousel-core ──────────────────────────────────────────────────────────
  const [core, setCore] = useState<Core | null>(null)
  const [coreError, setCoreError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    loadCore().then(
      (loaded) => {
        if (live) setCore(loaded)
        // Fetch JSZip now, while online, so a ZIP still works after the
        // connection drops: nothing else on this page needs the network.
        void loadZip()
      },
      (error: unknown) => {
        if (!live) return
        const issues = (error as { issues?: string[] }).issues
        setCoreError(
          issues ? `Varian kartu ditolak:\n- ${issues.join('\n- ')}` : error instanceof Error ? error.message : String(error),
        )
      },
    )
    return () => {
      live = false
    }
  }, [])

  const parseWarnings: Warning[] = useMemo(() => (core ? core.parseDeck(text).warnings : []), [core, text])

  const [status, setStatus] = useState<Status>({ type: 'loading' })
  const [renderWarnings, setRenderWarnings] = useState<Warning[]>([])
  const [selected, setSelected] = useState(0)
  const urlsRef = useRef<string[]>([])

  useEffect(() => {
    if (!core || text === '') return
    let live = true
    setStatus((current) => (current.type === 'ready' ? current : { type: 'rendering' }))
    const timer = window.setTimeout(async () => {
      try {
        const blobs = await core.renderDeck(text, {
          onWarnings: (warnings) => live && setRenderWarnings(warnings),
        })
        if (!live) return
        const urls = blobs.map((blob) => URL.createObjectURL(blob))
        for (const url of urlsRef.current) URL.revokeObjectURL(url)
        urlsRef.current = urls
        setStatus({ type: 'ready', blobs, urls, text })
        setSelected((index) => Math.min(index, blobs.length - 1))
      } catch (error) {
        if (!live) return
        if (error instanceof core.BlockingWarningsError) {
          setRenderWarnings(error.warnings)
          setStatus({ type: 'blocked' })
        } else {
          // A font that failed to load names its URL; show it, never export.
          setStatus({ type: 'failed', message: error instanceof Error ? error.message : String(error) })
        }
      }
    }, RENDER_DELAY_MS)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [core, text])

  useEffect(
    () => () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url)
    },
    [],
  )

  // Parse warnings and layout warnings, once each.
  const warnings = useMemo(() => {
    const seen = new Set<string>()
    return [...parseWarnings, ...renderWarnings].filter((w) => {
      const key = `${w.code}|${w.line}|${w.message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [parseWarnings, renderWarnings])

  // ── Actions ────────────────────────────────────────────────────────────────
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const jumpToLine = useCallback((line: number) => {
    const area = textareaRef.current
    if (!area) return
    const lines = area.value.split('\n')
    const start = lines.slice(0, line).reduce((sum, l) => sum + l.length + 1, 0)
    const end = start + (lines[line]?.length ?? 0)
    area.focus()
    area.setSelectionRange(start, end)
    const lineHeight = Number.parseFloat(getComputedStyle(area).lineHeight) || 20
    area.scrollTop = Math.max(0, line * lineHeight - area.clientHeight / 3)
  }, [])

  const [copied, setCopied] = useState<string | null>(null)
  const copy = useCallback(async (what: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(what)
      window.setTimeout(() => setCopied((current) => (current === what ? null : current)), 1600)
    } catch {
      setCopied(null)
    }
  }, [])

  const [zipping, setZipping] = useState(false)
  const current = status.type === 'ready' && status.text === text ? status : null
  const downloadZip = useCallback(async () => {
    if (!current || !generated) return
    setZipping(true)
    try {
      const { exportZip, downloadBlob } = await loadZip()
      downloadBlob(await exportZip(current.blobs, generated.name), `${generated.name}.zip`)
    } finally {
      setZipping(false)
    }
  }, [current, generated])

  const pressLink = useMemo(
    () => (core && text ? core.encodeDeckLink(text, CAROUSEL_PRESS_URL) : null),
    [core, text],
  )

  const shown = status.type === 'ready' ? status : null
  const big = shown?.urls[selected] ?? null

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)_20rem]">
      {/* ── Left: what to make ─────────────────────────────────────────── */}
      <section className="space-y-5" aria-label="Pilihan kartu">
        <fieldset className="space-y-2">
          <legend className="label mb-2">Cerita</legend>
          {CARD_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className="block w-full rounded-xl border border-shadow/15 bg-chalk px-3 py-2 text-left text-sm transition hover:border-sky-deep/50 aria-pressed:border-sky-deep aria-pressed:bg-sky-deep aria-pressed:text-chalk"
            >
              <span className="block font-semibold">{KIND_LABELS[k].label}</span>
              <span className="block text-xs opacity-80">{KIND_LABELS[k].hint}</span>
            </button>
          ))}
        </fieldset>

        <label className="block space-y-1.5">
          <span className="label">Kota</span>
          <select
            className="field w-full"
            value={city.name}
            onChange={(event) => setCityName(event.target.value)}
          >
            {INDONESIAN_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} · {c.zone}
              </option>
            ))}
          </select>
          {place.fromDevice ? (
            <span className="block text-xs text-shadow-2">
              Lokasimu diwakili kota terdekat. Koordinat tidak pernah masuk ke kartu.
            </span>
          ) : null}
        </label>

        <label className="block space-y-1.5">
          <span className="label">Tanggal (hari ini)</span>
          <input
            type="date"
            className="field w-full tabular"
            value={dateText ?? ''}
            onChange={(event) => event.target.value && setDateText(event.target.value)}
          />
        </label>
      </section>

      {/* ── Middle: the deck ───────────────────────────────────────────── */}
      <section className="min-w-0 space-y-3" aria-label="Teks deck">
        <div className="flex items-center justify-between gap-3">
          <span className="label">Teks deck</span>
          {edited ? (
            <button type="button" className="link text-xs" onClick={() => generated && setText(generated.text)}>
              Kembalikan ke hasil hitungan
            </button>
          ) : null}
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          rows={26}
          aria-label="Teks deck, bisa diedit"
          className="field block w-full resize-y font-mono text-[0.8rem] leading-5"
        />
        {edited ? (
          <p className="text-xs text-shadow-2">
            Diedit manual. Angka yang kamu ketik sendiri tidak lagi dijamin oleh mesin hitung.
          </p>
        ) : null}

        <div className="panel space-y-2 !p-4" aria-live="polite">
          <p className="label">Peringatan</p>
          {coreError ? <p className="whitespace-pre-wrap text-sm text-shadow">{coreError}</p> : null}
          {status.type === 'failed' ? (
            <p className="whitespace-pre-wrap text-sm text-shadow">Gagal merender: {status.message}</p>
          ) : null}
          {warnings.length === 0 && !coreError && status.type !== 'failed' ? (
            <p className="text-sm text-shadow-2">{core ? 'Tidak ada peringatan.' : 'Memuat carousel-core…'}</p>
          ) : null}
          <ul className="space-y-1.5">
            {warnings.map((w) => (
              <li key={`${w.code}-${w.line}-${w.message}`} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="font-mono text-xs text-shadow-2">
                    {core?.isBlocking(w) ? 'blokir' : 'info'} · baris {w.line + 1} · {w.code}
                  </span>
                  <span className="block">{w.message}</span>
                </span>
                <button type="button" className="btn !px-3 !py-1 text-xs" onClick={() => jumpToLine(w.line)}>
                  Perbaiki
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Right: preview and export ──────────────────────────────────── */}
      <section className="space-y-4" aria-label="Pratinjau dan unduh">
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-shadow/10 bg-concrete">
          {big ? (
            // eslint-disable-next-line @next/next/no-img-element -- a blob: URL, not an optimisable asset
            <img
              src={big}
              alt={`Slide ${selected + 1} dari ${shown?.urls.length ?? 0}`}
              className={`h-full w-full object-contain transition-opacity ${status.type === 'ready' && !current ? 'opacity-60' : ''}`}
            />
          ) : (
            <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-shadow-2">
              {status.type === 'blocked'
                ? 'Ada peringatan yang memblokir. Perbaiki dulu.'
                : status.type === 'failed' || coreError
                  ? 'Pratinjau tidak tersedia.'
                  : 'Merender…'}
            </p>
          )}
        </div>

        {shown ? (
          <ol className="flex gap-2 overflow-x-auto pb-1" aria-label="Filmstrip">
            {shown.urls.map((url, index) => (
              <li key={url} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={index === selected}
                  aria-label={`Slide ${index + 1}`}
                  onClick={() => setSelected(index)}
                  className="block w-12 overflow-hidden rounded-md border-2 border-transparent aria-pressed:border-sky-deep"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL */}
                  <img src={url} alt="" className="aspect-[9/16] w-full object-cover" />
                </button>
              </li>
            ))}
          </ol>
        ) : null}

        <div className="grid gap-2">
          <button
            type="button"
            className="btn-primary disabled:opacity-50"
            disabled={!current || zipping}
            onClick={downloadZip}
          >
            {zipping ? 'Menyiapkan ZIP…' : current ? `Unduh ZIP · ${current.blobs.length} PNG` : 'Unduh ZIP'}
          </button>
          <button type="button" className="btn" disabled={!text} onClick={() => copy('deck', text)}>
            {copied === 'deck' ? 'Tersalin' : 'Salin deck'}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!generated}
            onClick={() => generated && copy('caption', `${generated.title}\n\n${generated.caption}`)}
          >
            {copied === 'caption' ? 'Tersalin' : 'Salin caption'}
          </button>
          {pressLink ? (
            <a className="link text-center text-sm" href={pressLink} target="_blank" rel="noreferrer">
              Buka di Carousel Press
            </a>
          ) : null}
        </div>

        {generated ? (
          <div className="panel space-y-2 !p-4 text-sm">
            <p className="label">
              Judul · <span className="tabular">{generated.title.length}/{TITLE_MAX}</span>
            </p>
            <p>{generated.title}</p>
            <p className="label pt-2">
              Caption · <span className="tabular">{generated.caption.length}/{CAPTION_MAX}</span>
            </p>
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-shadow-2">{generated.caption}</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}
