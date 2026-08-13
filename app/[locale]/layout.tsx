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
      <div className="flex min-h-screen flex-col">
        <Nav locale={params.locale} dictionary={dictionary} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
        <Footer locale={params.locale} dictionary={dictionary} />
      </div>
    </PlaceProvider>
  )
}
