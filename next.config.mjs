/**
 * Static export for GitHub Pages. No backend, no runtime network.
 * basePath must match the repository name (PRD §12).
 */
const isProd = process.env.NODE_ENV === 'production'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/zero-shadow-day'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isProd ? basePath : '',
  assetPrefix: isProd ? basePath : '',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // The bundled city list (data/cities/indonesia.ts) is imported both by
    // the root locale layout (PlaceProvider needs nearestCity) and directly
    // by several page-level components (PlacePicker, EratosthenesLab,
    // SweepMap) — Next's default client-chunk splitting doesn't merge across
    // that layout/page boundary, so the same ~6KB module was shipped twice.
    // One cache group forces it into a single shared chunk both sides load.
    // Only the client bundle ships to the browser, so only it needs this.
    if (!isServer && config.optimization?.splitChunks) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        cities: {
          test: /[\\/]data[\\/]cities[\\/]/,
          name: 'cities-data',
          chunks: 'all',
          enforce: true,
        },
      }
    }
    return config
  },
}

export default nextConfig
