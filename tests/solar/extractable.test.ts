import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * "`lib/solar` is extractable as a standalone package with no framework
 * imports" is a stated success criterion (PRD §11) and the first invariant,
 * because Falak depends on lifting this directory out unchanged.
 *
 * A criterion with no test is a hope, so this asserts it mechanically.
 */

const solarDir = new URL('../../lib/solar/', import.meta.url).pathname
const shadowDir = new URL('../../lib/shadow/', import.meta.url).pathname

function sourcesIn(dir: string): Array<{ name: string; source: string }> {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => ({ name, source: readFileSync(join(dir, name), 'utf8') }))
}

const solarSources = sourcesIn(solarDir)
const shadowSources = sourcesIn(shadowDir)

describe('lib/solar is liftable into a package without edits', () => {
  it('has files to check', () => {
    expect(solarSources.length).toBeGreaterThanOrEqual(5)
  })

  it('imports nothing but its own siblings', () => {
    for (const { name, source } of solarSources) {
      const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1]!)
      for (const specifier of imports) {
        expect(specifier.startsWith('./'), `${name} imports ${specifier}`).toBe(true)
      }
    }
  })

  it('pulls in no framework, no DOM and no network', () => {
    const forbidden = [
      /from\s+'react/,
      /from\s+'next/,
      /\bdocument\./,
      /\bwindow\./,
      /\bfetch\(/,
      /\blocalStorage\b/,
      /@\/lib/,
    ]
    for (const { name, source } of solarSources) {
      for (const pattern of forbidden) {
        expect(pattern.test(source), `${name} matches ${pattern}`).toBe(false)
      }
    }
  })

  it('holds no clock: no Date in the numerical core', () => {
    for (const { name, source } of solarSources) {
      expect(/new Date\b/.test(source), name).toBe(false)
      expect(/Date\.now\b/.test(source), name).toBe(false)
      expect(/Intl\./.test(source), name).toBe(false)
    }
  })

  it('keeps no module-level mutable state', () => {
    for (const { name, source } of solarSources) {
      // Top-level `let` or `var` — indentation zero — would make results
      // depend on call order.
      expect(/^(let|var)\s/m.test(source), name).toBe(false)
    }
  })

  it('uses no non-null assertions, per the conventions', () => {
    for (const { name, source } of [...solarSources, ...shadowSources]) {
      const withoutStrings = source.replace(/'[^']*'/g, "''")
      expect(/\w!\./.test(withoutStrings), name).toBe(false)
      expect(/\w!\)/.test(withoutStrings), name).toBe(false)
    }
  })
})

describe('lib/shadow is independent of lib/solar', () => {
  it('imports nothing from the solar engine, not even its trigonometry', () => {
    for (const { name, source } of shadowSources) {
      const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1]!)
      for (const specifier of imports) {
        // Prose may mention lib/solar — the point is that nothing imports it.
        expect(specifier.includes('solar'), `${name} imports ${specifier}`).toBe(false)
        expect(specifier.startsWith('./'), `${name} imports ${specifier}`).toBe(true)
      }
    }
  })
})
