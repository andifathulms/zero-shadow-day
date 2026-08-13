'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/components/hooks/useReducedMotion'

/**
 * Lifts a block into place as it comes into view, once.
 *
 * Under `prefers-reduced-motion` it renders its children and gets out of the
 * way. With scripting disabled the pending state is overridden by a `noscript`
 * rule in the root layout, so an animation helper can never be the reason
 * someone cannot read the page.
 */
export function Reveal({
  children,
  delayMs = 0,
  className = '',
  as: Element = 'div',
}: {
  children: React.ReactNode
  delayMs?: number
  className?: string
  /** The element to render as, so a list item stays a list item. */
  as?: 'div' | 'li' | 'section'
}) {
  const reducedMotion = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || reducedMotion || shown) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [reducedMotion, shown])

  if (reducedMotion) return <Element className={className}>{children}</Element>

  return (
    <Element
      // The element varies, so the ref is typed at the widest of them.
      ref={ref as React.RefObject<HTMLDivElement & HTMLLIElement>}
      className={`${className} ${shown ? 'animate-rise' : 'reveal-pending opacity-0'}`}
      style={shown ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </Element>
  )
}
