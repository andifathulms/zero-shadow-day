/**
 * The maker's mark: a quiet credit in the footer, on every page.
 *
 * Deliberately kept apart from the disclaimer and the BMKG attribution beside
 * it — those are a legal and a data notice, this is personal credit, and
 * merging the two would misrepresent both. Separated by grouping and alignment
 * rather than by another rule, so the footer keeps a single seam.
 *
 * Everything personal lives in the two constants below, so updating a handle or
 * adding a platform is a one-line change.
 */

const MAKER = {
  name: 'Andi Fathul Mukminin',
  portfolio: 'https://andifathulms.github.io/en/',
} as const

const LINKS = [
  { label: 'Portfolio', href: MAKER.portfolio, icon: GlobeIcon },
  { label: 'GitHub', href: 'https://github.com/andifathulms', icon: GitHubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/andifathulmukminin/', icon: LinkedInIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/andifathulms/', icon: InstagramIcon },
] as const

export function MakerSignature({ className = '' }: { className?: string }) {
  // Static export, so this is stamped at build time.
  const year = new Date().getFullYear()

  return (
    <div className={`flex flex-col gap-2 sm:items-end ${className}`}>
      <p className="text-xs text-shadow/70">
        Designed &amp; built by{' '}
        <a
          href={MAKER.portfolio}
          target="_blank"
          rel="noopener noreferrer"
          className="text-shadow underline decoration-shadow/30 underline-offset-2 transition hover:text-marker-ink hover:decoration-marker-ink"
        >
          {MAKER.name}
        </a>{' '}
        · <span className="font-mono tabular">© {year}</span>
      </p>

      <ul className="-mx-1.5 flex items-center gap-0.5">
        {LINKS.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="block rounded-md p-1.5 text-shadow/70 transition hover:bg-shadow/5 hover:text-shadow"
            >
              <Icon />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function GlobeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg {...iconProps} fill="currentColor" stroke="none">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg {...iconProps} fill="currentColor" stroke="none">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.71h.05c.53-.95 1.83-1.96 3.76-1.96 4.02 0 4.76 2.5 4.76 5.75V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.19 1.45-2.19 2.96V21h-4V9Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}
