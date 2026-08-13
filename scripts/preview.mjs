/**
 * Serve ./out under the production basePath, so links and assets are verified
 * exactly as GitHub Pages will serve them (PRD §12). No dependencies.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

const PORT = Number(process.env.PORT ?? 4173)
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/zero-shadow-day'
const ROOT = join(process.cwd(), 'out')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

async function resolveFile(pathname) {
  const candidates = [pathname, join(pathname, 'index.html'), `${pathname}.html`]
  for (const candidate of candidates) {
    const full = join(ROOT, normalize(candidate))
    if (!full.startsWith(ROOT)) continue
    try {
      const info = await stat(full)
      if (info.isFile()) return full
    } catch {
      // try the next candidate
    }
  }
  return null
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  if (url.pathname === '/') {
    res.writeHead(302, { location: `${BASE_PATH}/` })
    res.end()
    return
  }
  if (!url.pathname.startsWith(BASE_PATH)) {
    res.writeHead(404, { 'content-type': TYPES['.txt'] })
    res.end(`Not found. The site is served under ${BASE_PATH}/`)
    return
  }
  const file = await resolveFile(url.pathname.slice(BASE_PATH.length) || '/')
  if (!file) {
    res.writeHead(404, { 'content-type': TYPES['.txt'] })
    res.end('Not found')
    return
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  res.end(await readFile(file))
})

server.listen(PORT, () => {
  console.log(`preview: http://localhost:${PORT}${BASE_PATH}/`)
})
