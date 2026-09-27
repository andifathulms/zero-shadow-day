import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'

/**
 * The tools, each shown by a small drawing of what it does rather than a line
 * of text alone. The drawings are pictograms, not data (aria-hidden): the real
 * figures are one click away and computed there.
 */
export function ToolCards({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  const tools = [
    { href: 'bayangan', label: dictionary.nav.gnomon, body: dictionary.home.exploreGnomon, art: <GnomonArt />, size: 'wide' },
    { href: 'eratosthenes', label: dictionary.nav.eratosthenes, body: dictionary.home.exploreEratosthenes, art: <EarthArt />, size: 'wide', dark: true },
    { href: 'kurva#jejak', label: dictionary.nav.curves, body: dictionary.home.exploreCurves, art: <TrailsArt />, size: 'third' },
    { href: 'kurva#analema', label: dictionary.nav.analemma, body: dictionary.nav.analemmaHint, art: <AnalemmaArt />, size: 'third' },
    { href: 'sapuan', label: dictionary.nav.sweep, body: dictionary.home.exploreSweep, art: <MapArt />, size: 'third' },
  ] as const

  return (
    <section aria-labelledby="alat">
      <h2 id="alat" className="text-title">
        {dictionary.home.toolsHeading}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {tools.map((tool) => {
          const dark = 'dark' in tool && tool.dark
          return (
            <li key={tool.href} className={tool.size === 'wide' ? 'lg:col-span-3' : 'lg:col-span-2'}>
              <Link
                href={`/${locale}/${tool.href}`}
                className={`group flex h-full flex-col gap-3 rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-press motion-reduce:hover:translate-y-0 ${
                  dark
                    ? 'border-sky-night bg-sky-night text-chalk'
                    : 'border-shadow/10 bg-chalk hover:border-sky-deep/40'
                }`}
              >
                <span className={`block overflow-hidden rounded-xl ${dark ? 'bg-chalk/5' : 'bg-bleached'}`}>
                  {tool.art}
                </span>
                {dark ? (
                  <span className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-sun">
                    {dictionary.home.forSchools}
                  </span>
                ) : null}
                <span className="flex items-baseline justify-between gap-3 font-display text-xl font-bold tracking-[-0.02em]">
                  {tool.label}
                  <span
                    aria-hidden
                    className={`font-sans text-lg transition duration-300 group-hover:translate-x-1 ${dark ? 'text-sky' : 'text-sky-deep'}`}
                  >
                    →
                  </span>
                </span>
                <span className={`text-sm leading-relaxed ${dark ? 'text-chalk/75' : 'text-shadow-2'}`}>{tool.body}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const art = { viewBox: '0 0 300 120', className: 'block h-auto w-full', 'aria-hidden': true } as const

function GnomonArt() {
  return (
    <svg {...art}>
      <ellipse cx="150" cy="94" rx="120" ry="15" className="fill-concrete" />
      <path d="M40 84 Q150 -8 260 84" fill="none" className="stroke-sun" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
      <circle cx="206" cy="33" r="10" className="fill-sun" />
      <polygon points="150,94 92,106 90,102 150,92" className="fill-shadow" />
      <rect x="148" y="50" width="4" height="44" rx="2" className="fill-chalk stroke-shadow" strokeWidth="1.2" />
    </svg>
  )
}

function EarthArt() {
  return (
    <svg {...art}>
      <path d="M0 120 Q150 30 300 120" className="fill-palm/40 stroke-palm" strokeWidth="1.5" />
      {[30, 85, 140, 195, 250].map((lineX) => (
        <line key={lineX} x1={lineX} y1="0" x2={lineX} y2="62" className="stroke-sun/60" strokeWidth="1.2" strokeDasharray="3 4" />
      ))}
      <line x1="126" y1="76" x2="126" y2="54" className="stroke-chalk" strokeWidth="3" strokeLinecap="round" />
      <line x1="204" y1="86" x2="208" y2="65" className="stroke-chalk" strokeWidth="3" strokeLinecap="round" />
      <line x1="204" y1="86" x2="194" y2="88" className="stroke-sky-night" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function TrailsArt() {
  return (
    <svg {...art}>
      <line x1="20" y1="60" x2="280" y2="60" className="stroke-shadow/50" strokeWidth="1.5" />
      <path d="M40 18 Q150 52 260 18" fill="none" className="stroke-shadow/70" strokeWidth="1.5" />
      <path d="M40 102 Q150 68 260 102" fill="none" className="stroke-shadow/70" strokeWidth="1.5" />
      <rect x="148" y="57" width="4" height="4" className="fill-shadow" />
    </svg>
  )
}

function AnalemmaArt() {
  return (
    <svg {...art}>
      <path
        d="M150 12 C128 14 128 44 150 60 C176 80 178 108 150 108 C122 108 124 80 150 60 C172 44 172 14 150 12 Z"
        fill="none"
        className="stroke-sun-ink"
        strokeWidth="2"
      />
      <circle cx="150" cy="60" r="3" className="fill-shadow" />
    </svg>
  )
}

function MapArt() {
  const dots: Array<[number, number]> = [
    [30, 42], [46, 52], [62, 66], [80, 74], [110, 84], [130, 86], [150, 88], [176, 92], [120, 50], [138, 58],
    [196, 58], [206, 66], [214, 48], [240, 60], [262, 70], [280, 64], [228, 94],
  ]
  return (
    <svg {...art}>
      <rect x="0" y="52" width="300" height="14" className="fill-sun/30" />
      <line x1="0" y1="59" x2="300" y2="59" className="stroke-sun-ink" strokeWidth="1.5" />
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" className="fill-shadow/60" />
      ))}
    </svg>
  )
}
