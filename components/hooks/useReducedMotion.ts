'use client'

import { useEffect, useState } from 'react'

/**
 * `prefers-reduced-motion` steps the day by the hour instead of animating it
 * (PRD §9). The sweep is the one orchestrated moment in the app, so this is
 * the one place the preference changes behaviour rather than just duration.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  return reduced
}
