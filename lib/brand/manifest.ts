/**
 * The web app manifest, as data.
 *
 * Not `app/manifest.ts`: Next generates that route's `<link>` without the
 * basePath and ignores `metadata.manifest` while it exists, so on a site served
 * from a repository path the link 404s and installing to a home screen fails
 * silently. Built here instead and written out by `scripts/postbuild.mjs`,
 * where the basePath is known — which also makes the paths testable.
 */

export interface WebManifest {
  readonly name: string
  readonly short_name: string
  readonly description: string
  readonly start_url: string
  readonly scope: string
  readonly display: string
  readonly background_color: string
  readonly theme_color: string
  readonly lang: string
  readonly categories: readonly string[]
  readonly icons: ReadonlyArray<{
    readonly src: string
    readonly sizes: string
    readonly type: string
    readonly purpose: string
  }>
}

/** `basePath` is the repository path the site is served from, or '' at the root. */
export function buildManifest(basePath: string): WebManifest {
  const at = (path: string): string => `${basePath}${path}`

  return {
    name: 'Zero Shadow Day — Hari Tanpa Bayangan',
    short_name: 'Zero Shadow Day',
    description:
      'Dua kali setahun matahari berdiri tepat di atas kepala dan benda tegak berhenti berbayang. Dihitung dari lintang, bujur, dan tanggal.',
    // Straight into the Indonesian site, which is the default everywhere else.
    start_url: at('/id/'),
    scope: at('/'),
    // A single tool with its own navigation: browser chrome adds nothing once
    // it is on a home screen.
    display: 'standalone',
    // The ink tile the icons are cut from, so the splash matches them.
    background_color: '#1C1A15',
    theme_color: '#FBF4E4',
    lang: 'id',
    categories: ['education', 'utilities'],
    icons: [
      { src: at('/brand/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: at('/brand/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android crops icons to its own shape; the maskable variant keeps the
      // mark inside the safe area so the pole does not lose its head.
      {
        src: at('/brand/icon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
