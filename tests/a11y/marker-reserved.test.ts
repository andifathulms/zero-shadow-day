import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Vermilion marks the zero shadow day and nothing else (CLAUDE.md invariant
 * 12). A hover, focus or slider accent in vermilion would teach the reader
 * that it means "interactive", and the one thing it does mean would be lost.
 *
 * This reads the source rather than the rendered page: the rule is about what
 * the classes say, and a class that only appears on hover never shows up in a
 * static render.
 */

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sources(path)
    return path.endsWith('.tsx') || path.endsWith('.css') ? [path] : []
  })
}

const FORBIDDEN = /\b(?:[a-z-]+:)*(?:hover|focus|focus-visible|active|group-hover):[a-z-]*marker\b|\baccent-marker\b|outline-marker\b/

describe('vermilion is reserved for the zero shadow day', () => {
  const files = [...sources('app'), ...sources('components')]

  it('finds the sources it is meant to check', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it('is never a hover, focus or control accent', () => {
    const offenders = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ file, line: index + 1, text: line.trim() }))
        .filter(({ text }) => FORBIDDEN.test(text)),
    )
    expect(offenders).toEqual([])
  })

  it('would catch the patterns it is written against', () => {
    expect(FORBIDDEN.test('hover:text-marker-ink')).toBe(true)
    expect(FORBIDDEN.test('group-hover:text-marker')).toBe(true)
    expect(FORBIDDEN.test('accent-marker')).toBe(true)
    expect(FORBIDDEN.test('text-marker-ink')).toBe(false)
    expect(FORBIDDEN.test('hover:text-sky-deep')).toBe(false)
  })
})
