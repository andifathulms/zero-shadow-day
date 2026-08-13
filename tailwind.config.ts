import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only. Never raw hex in components.
 *
 * This supersedes the flat palette of PRD §9 at the owner's direction: the
 * material is still hard tropical light, but the sky is allowed to be a sky.
 * The two rules that carried meaning are kept, because they are what let the
 * page be read rather than merely looked at:
 *
 *   the shadow is the darkest thing on the page, because it is the data
 *   vermilion marks the zero shadow day and nothing else
 *
 * Contrast ratios for every pairing used are asserted in tests/a11y.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ground: warm, sun-bleached paper.
        bleached: '#FBF4E4',
        concrete: '#E8DCC4',
        /** Surfaces that sit above the ground plane. */
        chalk: '#FFFDF7',

        // The subject. Nothing on the page is darker.
        shadow: '#14110E',

        // The sun's own path, and its readable companion.
        sun: '#FFB627',
        'sun-ink': '#8A5300',

        // The zero shadow day, and nothing else.
        marker: '#E2483D',
        'marker-ink': '#A3271E',

        // Sky, for gradients and cool surfaces.
        sky: '#BAE2F3',
        'sky-deep': '#1668AA',
        'sky-night': '#0A1020',

        // Vegetation green, for the horizon band and secondary accents.
        palm: '#1F7A5A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // A display scale with tight leading, so the big type sets as a block.
        hero: ['clamp(2.75rem, 9vw, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        title: ['clamp(2rem, 4.5vw, 3.25rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        lede: ['clamp(1.125rem, 2vw, 1.5rem)', { lineHeight: '1.5' }],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(20, 17, 14, 0.06), 0 12px 32px -12px rgba(20, 17, 14, 0.28)',
        sink: 'inset 0 1px 3px rgba(20, 17, 14, 0.12)',
      },
      backgroundImage: {
        'tropical-noon': 'linear-gradient(180deg, #1668AA 0%, #6FB6DC 55%, #BAE2F3 100%)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        rise: 'rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}

export default config
