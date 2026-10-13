/**
 * carousel-core's font files, copied into public/ so the static export serves
 * them at <basePath>/carousel-core/fonts/ (carousel-core docs/PORTING.md §4.3).
 *
 * Next bundles the package's JavaScript away from its fonts/ folder, so the
 * renderer is pointed at this copy with configureFonts({ baseUrl }). Self-hosted
 * like every other font here: nothing is fetched from a CDN (CLAUDE.md
 * invariant 13). Regenerated on every dev and build, and git-ignored.
 */
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const pkg = dirname(createRequire(import.meta.url).resolve('carousel-core/package.json'))
const from = join(pkg, 'fonts')
const to = join(process.cwd(), 'public', 'carousel-core', 'fonts')

rmSync(to, { recursive: true, force: true })
cpSync(from, to, { recursive: true })

// Loud rather than silent: a missing manifest means every render would fail
// the font gate in the browser, long after the build reported success.
const manifest = join(to, 'manifest.json')
if (!existsSync(manifest)) {
  console.error(`copy-carousel-fonts: ${manifest} is missing`)
  process.exit(1)
}
const { faces } = JSON.parse(readFileSync(manifest, 'utf8'))
const missing = faces.filter((face) => !existsSync(join(to, face.file)))
if (missing.length > 0) {
  console.error(`copy-carousel-fonts: ${missing.length} face(s) listed but not copied: ${missing.map((f) => f.file).join(', ')}`)
  process.exit(1)
}
console.log(`copy-carousel-fonts: ${faces.length} faces → public/carousel-core/fonts/`)
