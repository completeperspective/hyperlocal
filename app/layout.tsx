import { Lobster, Open_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import Script from 'next/script'
import { AppProviders } from '@/components/providers/app-providers'
import { GlobalLayout } from '@/layouts/global-layout'
import { getSession } from '@/server/auth'
import { AppSettings } from '@/server/helpers/AppSettings'
import { keystoneContext } from '@/server/keystone/context'
import { MaintenancePage } from './maintenance-mode'
import './styles/globals.scss'
import { SiteHeader } from '@/layouts/site-header'

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

  const headersObj = await headers()
  const cookies = headersObj.get('cookie')
  const pathname = headersObj.get('x-current-path') ?? '/'

  // Maintenance mode — renders for all routes except /admin so admins can disable it.
  if (appSettings?.maintenanceMode && !pathname.startsWith('/admin')) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${openSans.variable} ${lobster.variable} antialiased`}
        >
          <GlobalLayout theme={appSettings.theme}>
            <MaintenancePage
              message={appSettings.maintenanceMessage ?? "We'll be back soon!"}
            />
          </GlobalLayout>
        </body>
      </html>
    )
  }

  const { data } = await getSession()

  // Reason: sidebarBg should only apply to lesson pages (/courses/[slug]/[page-slug])
  // where a sidebar is actually rendered, not the course index (/courses/[slug]).
  const isCoursePage = /^\/courses\/[^/]+\/[^/]+/.test(pathname)

  let hasBilling = false
  if (data?.id) {
    try {
      const billingCount = await keystoneContext
        .sudo()
        .db.UserMembership.count({
          where: {
            user: { id: { equals: data.id } },
            status: { in: ['active', 'pending'] },
            paymentMethod: { equals: 'stripe' },
          },
        })
      hasBilling = billingCount > 0
    } catch {
      // non-fatal — billing menu item simply won't appear
    }
  }

  // Fetch hero-enabled slugs so SiteHeader can derive transparency client-side
  // on every navigation without stale props from the shared root layout.
  const heroCourseSlugs: string[] = []
  const heroPageIndexPrefixes: string[] = []
  if (appSettings?.transparentHeader ?? true) {
    try {
      const [heroCourses, heroPageIndexes] = await Promise.all([
        (
          keystoneContext.sudo() as unknown as {
            query: {
              Course: {
                findMany: (args: unknown) => Promise<{ slug: string }[]>
              }
            }
          }
        ).query.Course.findMany({
          where: { heroEnabled: { equals: true } },
          query: 'slug',
        }),
        (
          keystoneContext.sudo() as unknown as {
            query: {
              PageIndex: {
                findMany: (
                  args: unknown,
                ) => Promise<{ slug: string; basePath: string | null }[]>
              }
            }
          }
        ).query.PageIndex.findMany({
          where: { heroEnabled: { equals: true } },
          query: 'slug basePath',
        }),
      ])
      heroCourseSlugs.push(
        ...(heroCourses as { slug: string }[]).map((c) => c.slug),
      )
      heroPageIndexPrefixes.push(
        ...(heroPageIndexes as { slug: string; basePath: string | null }[]).map(
          (pi) => (pi.basePath ? `/${pi.basePath}/${pi.slug}` : `/${pi.slug}`),
        ),
      )
    } catch {
      // non-fatal — fall back to no transparency
    }
  }

  // Home page is transparent only when the root content itself has a hero.
  const homeIsHero = !!(
    appSettings?.rootCourse?.heroEnabled ||
    appSettings?.rootPageIndex?.heroEnabled
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} ${lobster.variable} antialiased`}>
        <GlobalLayout theme={appSettings?.theme}>
          <AppProviders
            cookies={cookies}
            allowWeb3Auth={appSettings?.allowWeb3Auth ?? false}
          >
            <SiteHeader
              sessionData={data ?? null}
              siteName={appSettings?.siteName}
              allowWeb3Auth={appSettings?.allowWeb3Auth ?? false}
              transparentEnabled={appSettings?.transparentHeader ?? true}
              heroCourseSlugs={heroCourseSlugs}
              heroPageIndexPrefixes={heroPageIndexPrefixes}
              homeIsHero={homeIsHero}
              sidebarBg={isCoursePage}
              hasBilling={hasBilling}
            />
            {children}
          </AppProviders>
        </GlobalLayout>
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

export const dynamic = 'force-dynamic'
