import type { Config } from 'tailwindcss'

/**
 * Semantic tokens only (PRD §9). Never raw hex in components.
 * Hard tropical light on concrete: the shadow is the darkest thing on the page
 * because it is the data.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bleached: '#EDE9DF',
        concrete: '#CFC9BC',
        shadow: '#2E2A24',
        sun: '#C98A21',
        marker: '#B4432F',
        sky: '#DCE3E4',
        // Darker companions to the two accents, for the cases where the PRD
        // palette cannot carry a contrast ratio: ochre at #C98A21 is 2.4:1 on
        // bleached ground, so a line drawn in it fails WCAG 1.4.11 (3:1 for a
        // graphic that carries meaning) and small ochre text fails 1.4.3.
        // Same family, same role — used for data lines and small text only,
        // while the originals keep the washes, fills and display sizes.
        'sun-ink': '#8A5E12',
        'marker-ink': '#A33C2A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
