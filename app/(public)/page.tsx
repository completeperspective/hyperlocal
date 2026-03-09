import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LandingPage } from '~/lib/server/pages/landing-page'
import { isAuthenticated } from '@/server/auth'
import { AppSettings, getPageData, getPageMetadata } from '@/server/helpers'
import { DynamicPage } from '@/server/pages/dynamic-page'

export async function generateMetadata(): Promise<Metadata> {
  // get page slug from setting `homePage`
  const settings = await AppSettings.instance.settings()

  try {
    // load page data
    const page = await getPageData(settings?.homePage.slug as string)

    // get page metadata
    return await getPageMetadata(page || 'Home')
  } catch {
    return await getPageMetadata('Home')
  }
}

export default async function PublicLanding() {
  const appSettings = await AppSettings.instance.settings()
  const isAuth = await isAuthenticated()

  if (appSettings?.isPrivate && !isAuth) {
    // redirect to login page
    redirect('/login')
  }

  let pageData = null
  if (appSettings?.homePage) {
    try {
      pageData = await getPageData(appSettings?.homePage.slug)

      if (pageData?.status === 'membership' && !isAuth) {
        const isHomePage = appSettings?.homePage.slug === pageData.slug
        const redirectUrl = isHomePage
          ? '/login'
          : `/login?returnTo=${pageData.slug}`
        return redirect(redirectUrl)
      }
    } catch {
      // landing page is not accessible
      return <LandingPage />
    }
  }

  // if page data exists, render dynamic page, otherwise render static home page
  if (pageData) {
    return <DynamicPage pageData={pageData} />
  } else {
    return <LandingPage />
  }
}

export const dynamic = 'force-dynamic'
