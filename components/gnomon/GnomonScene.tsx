import type { Instant } from '@/lib/day'
import { formatRatio } from '@/lib/format'
import type { Dictionary } from '@/lib/i18n'

/**
 * The gnomon: a vertical stick, hard tropical light, one crisp shadow edge.
 *
 * The ground plane is drawn in a military axonometric — the *whole plane* is
 * foreshortened by a single constant, verticals keep their scale. That is a
 * viewing transform applied to everything alike, so the length-to-altitude
 * relationship survives it intact (CLAUDE.md invariant 10): the shadow's
 * length on screen is its true ratio to the gnomon, read along the ground.
 *
 * The shadow is the readout. Nothing here computes it; it arrives in `instant`.
 */

const FORESHORTEN = 0.5
/** Screen units per gnomon height. One scale for the stick and the ground alike. */
const SCALE = 68
const GNOMON_HEIGHT = 1
/** Past this many gnomon heights the shadow leaves the plot, near sunrise and sunset. */
const MAX_RATIO = 5

export interface GnomonSceneProps {
  instant: Instant
  dictionary: Dictionary
  /** Rings to mark the ground plane, in gnomon heights. */
  rings?: readonly number[]
}

export function GnomonScene({
  instant,
  dictionary,
  rings = [1, 2, 3, 4, 5],
}: GnomonSceneProps) {
  const width = 760
  const height = 460
  const footX = width / 2
  // High enough that the southern reach of the ground plane, and its label,
  // stay inside the frame.
  const footY = height * 0.55

  const project = (east: number, north: number) => ({
    x: footX + east * SCALE,
    y: footY - north * SCALE * FORESHORTEN,
  })

  const shadow = instant.shadow
  const tip = instant.tip
  const clipped = tip !== null && Math.hypot(tip.east, tip.north) > MAX_RATIO
  const drawnTip =
    tip === null
      ? null
      : clipped
        ? scaleTo(tip, MAX_RATIO)
        : tip

  const stickTop = { x: footX, y: footY - GNOMON_HEIGHT * SCALE }

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full bg-concrete/30"
        role="img"
        aria-label={describe(instant, dictionary)}
      >
        {/* the ground */}
        <rect x={0} y={0} width={width} height={height} className="fill-concrete/40" />

        {/* rings at whole gnomon heights, so the shadow can be read off the
            ground as a multiple of the stick — the length is the data */}
        {rings.map((ring) => (
          <g key={ring}>
            <ellipse
              cx={footX}
              cy={footY}
              rx={ring * SCALE}
              ry={ring * SCALE * FORESHORTEN}
              className="fill-none stroke-shadow/25"
              strokeWidth={1}
              strokeDasharray="2 5"
            />
            <text
              x={footX + ring * SCALE - 4}
              y={footY - 6}
              textAnchor="end"
              className="fill-shadow/40 font-mono text-[10px]"
            >
              {ring}×
            </text>
          </g>
        ))}

        {/* cardinal directions: the shadow's bearing is meant to be read */}
        <line
          x1={footX - MAX_RATIO * SCALE}
          y1={footY}
          x2={footX + MAX_RATIO * SCALE}
          y2={footY}
          className="stroke-shadow/15"
          strokeWidth={1}
        />
        <line
          x1={footX}
          y1={footY - MAX_RATIO * SCALE * FORESHORTEN}
          x2={footX}
          y2={footY + MAX_RATIO * SCALE * FORESHORTEN}
          className="stroke-shadow/15"
          strokeWidth={1}
        />
        <text
          x={footX}
          y={footY - MAX_RATIO * SCALE * FORESHORTEN - 8}
          textAnchor="middle"
          className="fill-shadow/45 font-mono text-[11px]"
        >
          U
        </text>
        <text
          x={footX + MAX_RATIO * SCALE + 10}
          y={footY + 4}
          className="fill-shadow/45 font-mono text-[11px]"
        >
          T
        </text>
        <text
          x={footX}
          y={footY + MAX_RATIO * SCALE * FORESHORTEN + 16}
          textAnchor="middle"
          className="fill-shadow/45 font-mono text-[11px]"
        >
          S
        </text>
        <text
          x={footX - MAX_RATIO * SCALE - 18}
          y={footY + 4}
          className="fill-shadow/45 font-mono text-[11px]"
        >
          B
        </text>

        {/* the shadow — the darkest thing on the page, because it is the data */}
        {shadow.type === 'shadow' && drawnTip ? (
          <ShadowShape foot={{ x: footX, y: footY }} tip={project(drawnTip.east, drawnTip.north)} />
        ) : null}

        {/* the stick */}
        <line
          x1={footX}
          y1={footY}
          x2={stickTop.x}
          y2={stickTop.y}
          className="stroke-shadow"
          strokeWidth={7}
          strokeLinecap="butt"
        />
        <ellipse cx={footX} cy={footY} rx={5} ry={2.8} className="fill-shadow" />

        {/* the zenith case: the shadow has collapsed under the stick */}
        {shadow.type === 'zenith' ? (
          <circle cx={footX} cy={footY} r={7} className="fill-marker" />
        ) : null}

        {clipped ? (
          <text
            x={width - 12}
            y={height - 12}
            textAnchor="end"
            className="fill-shadow/45 font-mono text-[11px]"
          >
            &gt; {MAX_RATIO.toFixed(1)} ×
          </text>
        ) : null}

        {shadow.type === 'no-shadow' ? (
          <text
            x={width - 12}
            y={height - 12}
            textAnchor="end"
            className="fill-shadow/45 font-mono text-[11px]"
          >
            {dictionary.readout.noShadow}
          </text>
        ) : null}
      </svg>
      <figcaption className="sr-only">{describe(instant, dictionary)}</figcaption>
    </figure>
  )
}

/** A shadow with one hard edge: a stick's width at the foot, a point at the tip. */
function ShadowShape({
  foot,
  tip,
}: {
  foot: { x: number; y: number }
  tip: { x: number; y: number }
}) {
  const dx = tip.x - foot.x
  const dy = tip.y - foot.y
  const length = Math.hypot(dx, dy) || 1
  const halfWidth = 4.5
  const nx = (-dy / length) * halfWidth
  const ny = (dx / length) * halfWidth

  return (
    <polygon
      points={`${foot.x + nx},${foot.y + ny} ${foot.x - nx},${foot.y - ny} ${tip.x},${tip.y}`}
      className="fill-shadow"
    />
  )
}

function scaleTo(tip: { east: number; north: number }, maxRatio: number) {
  const length = Math.hypot(tip.east, tip.north)
  return { east: (tip.east / length) * maxRatio, north: (tip.north / length) * maxRatio }
}

function describe(instant: Instant, dictionary: Dictionary): string {
  switch (instant.shadow.type) {
    case 'shadow':
      return `${dictionary.readout.shadowRatio}: ${formatRatio(instant.shadow.lengthRatio)} ${dictionary.readout.perHeight}, ${dictionary.readout.shadowBearing}: ${instant.shadow.bearingDeg.toFixed(1)}°`
    case 'zenith':
      return dictionary.readout.zenith
    case 'no-shadow':
      return dictionary.readout.noShadow
    default: {
      const never: never = instant.shadow
      return never
    }
  }
}
