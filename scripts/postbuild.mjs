/**
 * GitHub Pages runs Jekyll over the published tree unless told not to, and
 * Jekyll drops directories beginning with an underscore — which is every
 * Next.js asset, all of them under `_next/`. The marker file is the whole fix
 * (PRD §12).
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const out = join(process.cwd(), 'out')
await writeFile(join(out, '.nojekyll'), '')
console.log('postbuild: wrote out/.nojekyll')

/**
 * The App Router has one root layout and therefore one `<html lang>`, but the
 * export is a tree of static files, so each locale's files can carry their own.
 * The locale subtree already declares its language — which is what assistive
 * technology resolves for the content — and this makes the document element
 * agree with it.
 */
async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* htmlFiles(path)
    else if (entry.name.endsWith('.html')) yield path
  }
}

let rewritten = 0
for await (const file of htmlFiles(join(out, 'en'))) {
  const html = await readFile(file, 'utf8')
  const fixed = html.replace(/<html lang="id"/, '<html lang="en"')
  if (fixed !== html) {
    await writeFile(file, fixed)
    rewritten += 1
  }
}

// Loud rather than silent: if the markup ever changes shape, this stops
// claiming to have done something it did not do.
if (rewritten === 0) {
  console.error('postbuild: no English page had its document language rewritten')
  process.exit(1)
}
console.log(`postbuild: set lang="en" on ${rewritten} exported page(s)`)
