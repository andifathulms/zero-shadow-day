'use client'

import { useEffect, useState } from 'react'
import { type SharedView, decodeView } from '@/lib/share'

/**
 * The view encoded in the URL, read once after mount.
 *
 * `null` while it has not been read yet and after it has been found absent —
 * callers distinguish the two through the returned `ready` flag, so they do not
 * open on today's date and then jump to the shared one.
 */
export function useSharedView(): { view: SharedView | null; ready: boolean } {
  const [state, setState] = useState<{ view: SharedView | null; ready: boolean }>({
    view: null,
    ready: false,
  })

  useEffect(() => {
    setState({ view: decodeView(window.location.search), ready: true })
  }, [])

  return state
}
