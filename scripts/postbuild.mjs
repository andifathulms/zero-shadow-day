/**
 * GitHub Pages runs Jekyll over the published tree unless told not to, and
 * Jekyll drops directories beginning with an underscore — which is every
 * Next.js asset, all of them under `_next/`. The marker file is the whole fix
 * (PRD §12).
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const out = join(process.cwd(), 'out')
await writeFile(join(out, '.nojekyll'), '')
console.log('postbuild: wrote out/.nojekyll')
