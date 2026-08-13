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
}

export default nextConfig
