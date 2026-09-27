import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only. Never raw hex in components.
 *
 * "Tropical noon" (2026 redesign), superseding PRD §9's warm paper at the
 * owner's direction: white light, cool blue-black shadow, and the equatorial
 * sky as the single interactive colour. That frees the two accents to carry
 * meaning only.
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
        // Ground: tropical noon light is white, not golden. A cool, sun-bleached
        // white with the faintest lean towards the sky that lights it.
        bleached: '#F3F5F4',
        concrete: '#E3E8E8',
        /** Surfaces that sit above the ground plane. */
        chalk: '#FFFFFF',

        // The subject. Nothing on the page is darker. Blue-black, because a
        // shadow under an open tropical sky is lit by that sky.
        shadow: '#0E1318',
        /** Secondary text: a solid tone rather than an opacity mix, so the
         *  contrast asserted in tests/a11y is exact on every surface. */
        'shadow-2': '#4B5661',

        // The sun's own path, and its readable companion.
        sun: '#FFB020',
        'sun-ink': '#8A5300',

        // The zero shadow day, and nothing else — not hover, not focus.
        marker: '#E0402C',
        'marker-ink': '#B3261E',

        // Sky. `sky` is the wash; `sky-deep` is the equatorial noon sky and the
        // one colour for anything that can be pressed, dragged or focused.
        sky: '#DCEBF5',
        'sky-deep': '#0A5CA8',
        'sky-night': '#07101D',

        // Vegetation green: the Indonesia band and secondary accents.
        palm: '#12744F',
      },
      fontFamily: {
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // A display scale with tight leading, so the big type sets as a block.
        hero: ['clamp(3rem, 8vw, 5.75rem)', { lineHeight: '0.92', letterSpacing: '-0.045em' }],
        title: ['clamp(2rem, 4.2vw, 3rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        lede: ['clamp(1.125rem, 2vw, 1.5rem)', { lineHeight: '1.5' }],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(14, 19, 24, 0.05), 0 18px 36px -20px rgba(14, 19, 24, 0.32)',
        sink: 'inset 0 1px 3px rgba(14, 19, 24, 0.12)',
        press: '0 14px 28px -18px rgba(10, 92, 168, 0.6)',
      },
      backgroundImage: {
        'tropical-noon': 'linear-gradient(180deg, #0A5CA8 0%, #5FA8DA 55%, #DCEBF5 100%)',
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
