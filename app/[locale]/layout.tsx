import { notFound } from 'next/navigation'
import { PlaceProvider } from '@/components/place/PlaceProvider'
import { Footer } from '@/components/site/Footer'
import { Nav } from '@/components/site/Nav'
import { LOCALES, getDictionary, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const dynamicParams = false

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  const dictionary = getDictionary(params.locale)

  return (
    <PlaceProvider>
      {/* The root <html> can only carry one language, so the subtree declares
          its own. Without this the English pages announce themselves as
          Indonesian and a screen reader reads them in the wrong voice. */}
      <div lang={params.locale} className="flex min-h-screen flex-col">
        <a
          href="#isi"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-shadow focus:bg-bleached focus:px-4 focus:py-2"
        >
          {dictionary.nav.skipToContent}
        </a>
        <Nav locale={params.locale} dictionary={dictionary} />
        <main id="isi" className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
          {children}
        </main>
        <Footer locale={params.locale} dictionary={dictionary} />
      </div>
    </PlaceProvider>
  )
}
