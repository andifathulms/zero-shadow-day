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
