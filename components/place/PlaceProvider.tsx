'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_CITY, type City, indonesianOffsetForLongitude, nearestCity } from '@/data/cities/indonesia'
import { decodeView } from '@/lib/share'
import type { Place } from '@/lib/zsd'

/**
 * The chosen place, held in the browser and nowhere else.
 *
 * Persisted to localStorage so a return visit keeps it. No coordinate is ever
 * sent anywhere: there is no endpoint to send it to (CLAUDE.md invariant 9).
 */

export interface NamedPlace extends Place {
  /** A label for display. Derived from the bundled city list, never from a request. */
  readonly label: string
  /** True when the coordinates came from the device rather than the list. */
  readonly fromDevice: boolean
}

const STORAGE_KEY = 'zsd.place.v1'

const initial: NamedPlace = {
  ...DEFAULT_CITY,
  label: DEFAULT_CITY.name,
  fromDevice: false,
}

interface PlaceContextValue {
  place: NamedPlace
  setCity: (city: City) => void
  setCoordinates: (latDeg: number, lonDeg: number, offsetHours?: number) => void
  setFromDevice: (latDeg: number, lonDeg: number) => void
}

const PlaceContext = createContext<PlaceContextValue | null>(null)

export function PlaceProvider({ children }: { children: React.ReactNode }) {
  const [place, setPlace] = useState<NamedPlace>(initial)

  useEffect(() => {
    // A shared link wins over the remembered place: the reader followed it to
    // see that place, not their own.
    const shared = decodeView(window.location.search)
    if (shared) {
      setPlace({
        latDeg: shared.latDeg,
        lonDeg: shared.lonDeg,
        offsetHours: shared.offsetHours,
        label: shared.label ?? nearestCity(shared.latDeg, shared.lonDeg).city.name,
        fromDevice: false,
      })
      return
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) setPlace(JSON.parse(stored) as NamedPlace)
    } catch {
      // A malformed or unavailable store just means the default place.
    }
  }, [])

  const remember = useCallback((next: NamedPlace) => {
    setPlace(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Private browsing: the choice simply does not persist.
    }
  }, [])

  const setCity = useCallback(
    (city: City) => remember({ ...city, label: city.name, fromDevice: false }),
    [remember],
  )

  const setCoordinates = useCallback(
    (latDeg: number, lonDeg: number, offsetHours?: number) =>
      remember({
        latDeg,
        lonDeg,
        offsetHours: offsetHours ?? indonesianOffsetForLongitude(lonDeg),
        label: `${latDeg.toFixed(3)}, ${lonDeg.toFixed(3)}`,
        fromDevice: false,
      }),
    [remember],
  )

  const setFromDevice = useCallback(
    (latDeg: number, lonDeg: number) => {
      const near = nearestCity(latDeg, lonDeg)
      remember({
        latDeg,
        lonDeg,
        offsetHours: indonesianOffsetForLongitude(lonDeg),
        label: near.km < 40 ? near.city.name : `${latDeg.toFixed(3)}, ${lonDeg.toFixed(3)}`,
        fromDevice: true,
      })
    },
    [remember],
  )

  const value = useMemo(
    () => ({ place, setCity, setCoordinates, setFromDevice }),
    [place, setCity, setCoordinates, setFromDevice],
  )

  return <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>
}

export function usePlace(): PlaceContextValue {
  const context = useContext(PlaceContext)
  if (!context) throw new Error('usePlace must be used inside PlaceProvider')
  return context
}
