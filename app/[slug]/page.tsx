import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { isAuthenticated as auth } from '@/server/auth'
import { AppSettings, getPageData, getPageMetadata } from '@/server/helpers'
import { DynamicPage } from '@/server/pages/dynamic-page'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const _p = await params
  // load page data
  const page = await getPageData(_p?.slug as string)
  // get page metadata
  return await getPageMetadata(page)
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const _p = await params

  // check if site is private, and if user is authenticated
  const appSettings = await AppSettings.instance.settings()
  const isAuthenticated = await auth()

  if (appSettings.isPrivate && !isAuthenticated) {
    // throw 404
    return notFound()
  }

  // Also returns 404 if page not found
  const pageData = await getPageData(_p.slug)

  if (pageData?.status === 'membership' && !isAuthenticated) {
    const isHomePage = appSettings.homePage?.slug === _p.slug

    return redirect(`/login?returnTo=${isHomePage ? '/' : `%2F${_p.slug}`}`)
  }

  if (appSettings.homePage?.slug === pageData?.slug) {
    return redirect('/')
  }

  return (
    <main className="flex min-h-[calc(100vh-65px)] w-full flex-col p-8 sm:py-32 sm:px-16 bg-transparent">
      <DynamicPage pageData={pageData} />
    </main>
  )
}
