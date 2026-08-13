/**
 * "Tegak" — the brand mark: a gnomon pole standing under the sun with no
 * shadow at its base, inside empty sundial rings. The rings are the
 * shadow-length markers, empty because at this instant there is nothing to
 * mark.
 *
 * Drawn rather than served as an image so it inherits the ink colour of
 * whatever it sits on, costs no request, and can follow the brand kit's own
 * rule about detail at small sizes:
 *
 *   at 56px and below the outer ring drops
 *   at 32px only the pole and sun remain
 *
 * The disc takes sky rather than gold on a light ground, which is what the
 * brand kit's own light tile does — gold on paper is far too faint to read.
 */
export function Mark({
  size = 34,
  className = '',
  title,
}: {
  size?: number
  className?: string
  /** Give a title only when the mark stands alone; beside the wordmark it is decorative. */
  title?: string
}) {
  const showOuterRing = size > 56
  const showInnerRing = size > 32

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {showOuterRing ? (
        <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      ) : null}
      {showInnerRing ? (
        <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      ) : null}
      <line
        x1="50"
        y1="66"
        x2="50"
        y2="32"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="22" r="7" className="fill-sky-deep" />
    </svg>
  )
}
