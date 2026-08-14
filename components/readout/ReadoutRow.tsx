/**
 * One line of the printed data column: a label against a tabular mono value,
 * separated by a hairline top rule. Shared by every readout-style panel
 * (Readout, NoonAnywhere, DatesDetail, EratosthenesLab) so the pattern has one
 * definition instead of four identical copies.
 */
export function ReadoutRow({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="rule flex items-baseline justify-between gap-4 py-1.5">
      <dt className="label">{label}</dt>
      <dd className={emphasis ? 'value text-lg' : 'value'}>{value}</dd>
    </div>
  )
}
