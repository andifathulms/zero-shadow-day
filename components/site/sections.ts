import type { Dictionary } from '@/lib/i18n'

/**
 * The site's four destinations, named by what a reader wants rather than how
 * the page is built: when is my day, show me it happening, go deeper, teach it.
 * The deeper visualisations are grouped under Jelajahi. Routes are unchanged,
 * so every shared link keeps working.
 */
export type SectionKey = 'dates' | 'gnomon' | 'explore' | 'eratosthenes'

export interface ExploreItem {
  readonly href: string
  readonly label: string
  readonly hint: string
  /** The route this item lives on, for the active state. */
  readonly slug: string
}

export function exploreItems(dictionary: Dictionary): readonly ExploreItem[] {
  return [
    { href: 'kurva#jejak', slug: 'kurva', label: dictionary.nav.curves, hint: dictionary.home.exploreCurves },
    { href: 'kurva#analema', slug: 'kurva', label: dictionary.nav.analemma, hint: dictionary.nav.analemmaHint },
    { href: 'sapuan', slug: 'sapuan', label: dictionary.nav.sweep, hint: dictionary.home.exploreSweep },
  ]
}

/** Which of the four sections a path belongs to, for highlighting. */
export function sectionOf(pathname: string): SectionKey | null {
  const slug = pathname.split('/').filter(Boolean)[1] ?? ''
  switch (slug) {
    case 'tanggal':
      return 'dates'
    case 'bayangan':
      return 'gnomon'
    case 'kurva':
    case 'sapuan':
      return 'explore'
    case 'eratosthenes':
      return 'eratosthenes'
    default:
      return null
  }
}

/** The same page in the other language, so switching never loses your place. */
export function otherLocalePath(pathname: string, other: string): string {
  const parts = pathname.split('/').filter(Boolean)
  parts[0] = other
  return `/${parts.join('/')}`
}
