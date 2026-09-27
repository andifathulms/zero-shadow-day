/**
 * The top of every tool page: where you are, what it shows, and room for a
 * short caveat. One definition, so the pages read as one site.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string
  title: string
  lede?: string
  children?: React.ReactNode
}) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className={`text-title ${eyebrow ? 'mt-2' : ''}`}>{title}</h1>
      {lede ? <p className="mt-4 max-w-prose text-lg leading-relaxed text-shadow-2">{lede}</p> : null}
      {children}
    </header>
  )
}
