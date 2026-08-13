import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildManifest } from '@/lib/brand/manifest'

/**
 * The site is served from a repository path, so every path in the manifest has
 * to carry it. A manifest whose icons 404 fails quietly — the install prompt
 * simply never appears — so it is asserted rather than eyeballed.
 */
describe('the web app manifest', () => {
  const manifest = buildManifest('/zero-shadow-day')

  it('puts every path under the basePath', () => {
    const paths = [manifest.start_url, manifest.scope, ...manifest.icons.map((icon) => icon.src)]
    for (const path of paths) {
      expect(path.startsWith('/zero-shadow-day/'), path).toBe(true)
    }
  })

  it('works unprefixed too, for a site at a domain root', () => {
    const root = buildManifest('')
    expect(root.start_url).toBe('/id/')
    expect(root.scope).toBe('/')
    for (const icon of root.icons) expect(icon.src.startsWith('/brand/')).toBe(true)
  })

  it('opens on the Indonesian site, inside its own scope', () => {
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true)
    expect(manifest.lang).toBe('id')
  })

  it('ships the sizes Android asks for, including a maskable one', () => {
    const sizes = manifest.icons.map((icon) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    // Without a maskable icon Android crops the tile and cuts the mark.
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
  })

  it('every icon it names is actually committed', () => {
    // exports/ is gitignored, so a missing copy here would only surface as a
    // 404 on a real device.
    for (const icon of manifest.icons) {
      const file = new URL(
        `../../public${icon.src.replace('/zero-shadow-day', '')}`,
        import.meta.url,
      ).pathname
      expect(existsSync(file), icon.src).toBe(true)
    }
  })

  it('the icon and social files the metadata conventions rely on exist', () => {
    for (const file of ['icon.svg', 'apple-icon.png', 'opengraph-image.png']) {
      expect(existsSync(new URL(`../../app/${file}`, import.meta.url).pathname), file).toBe(true)
    }
  })

  it('the splash matches the ink tile the icons are cut from', () => {
    expect(manifest.background_color).toBe('#1C1A15')
  })
})
