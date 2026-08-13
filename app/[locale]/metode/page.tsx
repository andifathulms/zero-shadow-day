import { type Locale, getDictionary } from '@/lib/i18n'

/**
 * Method disclosure (PRD §5.8): which algorithm, its stated accuracy, how the
 * window is defined, what is neglected, and why "zero" has a width. Linked
 * from the gnomon and the footer, not buried.
 */
export default function MethodPage({ params }: { params: { locale: Locale } }) {
  const dictionary = getDictionary(params.locale)

  const sections = [
    { heading: dictionary.method.algorithm, body: dictionary.method.algorithmBody },
    { heading: dictionary.method.whyNotSimple, body: dictionary.method.whyNotSimpleBody },
    { heading: dictionary.method.window, body: dictionary.method.windowBody },
    { heading: dictionary.method.discrete, body: dictionary.method.discreteBody },
    { heading: dictionary.method.neglected, body: dictionary.method.neglectedBody },
    { heading: dictionary.method.privacy, body: dictionary.method.privacyBody },
    { heading: dictionary.method.source, body: dictionary.method.sourceBody },
  ]

  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="font-display text-4xl">{dictionary.method.heading}</h1>
      </header>

      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="font-display text-2xl">{section.heading}</h2>
          <p className="mt-2 max-w-prose leading-relaxed text-shadow/85">{section.body}</p>
        </section>
      ))}

      <section className="border border-shadow/20 bg-concrete/20 p-5">
        <h2 className="label">Verification</h2>
        <ul className="mt-3 space-y-1.5 font-mono tabular text-sm">
          <li>declination @ equinox · |δ| &lt; 0.01°</li>
          <li>declination @ solstice · |δ| = ε ± 0.001°</li>
          <li>equation of time · 4 extrema, 4 zero crossings</li>
          <li>zero shadow day · published dates ± 1 d</li>
          <li>tropic edge · converged, single date</li>
          <li>outside tropics · structured no-result, both hemispheres</li>
          <li>Eratosthenes · round trip recovers the generating radius</li>
        </ul>
        <p className="mt-4 max-w-prose text-xs leading-relaxed text-shadow/60">
          {dictionary.method.disclaimer}
        </p>
      </section>
    </div>
  )
}
