import { notFound } from 'next/navigation'
import { PlaceProvider } from '@/components/place/PlaceProvider'
import { PlaceSheet } from '@/components/place/PlaceSheet'
import { Footer } from '@/components/site/Footer'
import { Nav } from '@/components/site/Nav'
import { TabBar } from '@/components/site/TabBar'
import { getDictionary, isLocale, localeStaticParams } from '@/lib/i18n'

export function generateStaticParams() {
  return localeStaticParams()
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
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-sky-deep focus:bg-chalk focus:px-4 focus:py-2"
        >
          {dictionary.nav.skipToContent}
        </a>
        <Nav locale={params.locale} dictionary={dictionary} />
        <main id="isi" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-8 sm:px-5 sm:pt-10">
          {children}
        </main>
        <Footer locale={params.locale} dictionary={dictionary} />
        {/* Room under the footer for the phone tab bar, so nothing hides behind it. */}
        <div className="h-20 md:hidden" aria-hidden />
        <TabBar locale={params.locale} dictionary={dictionary} />
        <PlaceSheet locale={params.locale} dictionary={dictionary} />
      </div>
    </PlaceProvider>
  )
}
