import { Lobster, Open_Sans } from 'next/font/google'
import Script from 'next/script'
import { AppSettings } from '~/lib/server/helpers/AppSettings'
import { GlobalLayout } from '@/layouts/global-layout'
import './styles/globals.scss'

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-open-sans',
})

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-lobster',
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Prefetch app settings
  const appSettings = await AppSettings.instance.settings()

  return (
    <html lang="en">
      <body className={`${openSans.variable} ${lobster.variable} antialiased`}>
        <GlobalLayout theme={appSettings?.theme}>{children}</GlobalLayout>
      </body>
      {appSettings?.gaTrackingId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${appSettings.gaTrackingId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${appSettings.gaTrackingId}');
          `}</Script>
        </>
      )}
    </html>
  )
}
