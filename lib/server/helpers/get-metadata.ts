import { Metadata } from 'next'
import { isAuthenticated } from '@/server/auth'
import { PageData } from '@/types'
import { AppSettings } from './AppSettings'

export async function getPageMetadata(
  page?: Partial<PageData> | string | null,
): Promise<Metadata> {
  const settings = await AppSettings.instance.settings()
  const isAuth = await isAuthenticated()

  const isPrivate = settings?.isPrivate ?? true
  const isLocked = isPrivate && !isAuth

  // Normalize: accept string (legacy/static) or PageData partial
  const pageTitle = typeof page === 'string' ? page : page?.title
  const pageDescription =
    typeof page === 'string' ? undefined : page?.description
  const pageSlug = typeof page === 'string' ? undefined : page?.slug

  // ─── Title ──────────────────────────────────────────────
  const fullTitle = [settings?.siteName, pageTitle].filter(Boolean).join(' | ')
  const title = isLocked ? 'Private' : fullTitle

  // ─── Description ────────────────────────────────────────
  const description = isLocked
    ? 'Please login to access content'
    : (pageDescription ??
      settings?.metaDescription ??
      'Built with Next.js, KeystoneJS, and GraphQL.')

  // ─── OG Image ───────────────────────────────────────────
  const ogImages = settings?.ogImage?.url
    ? [
        {
          url: settings.ogImage.url,
          width: settings.ogImage.width ?? undefined,
          height: settings.ogImage.height ?? undefined,
          alt: settings?.siteName ?? pageTitle,
        },
      ]
    : undefined

  // ─── Canonical ──────────────────────────────────────────
  const baseUrl =
    settings?.baseUrl?.replace(/\/$/, '') ??
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
    'http://localhost:7777'

  const canonicalPath = pageSlug
    ? `/${pageSlug}`
    : pageTitle
      ? `/${pageTitle.toLowerCase().replace(/\s+/g, '-')}`
      : undefined

  const canonical =
    baseUrl && canonicalPath
      ? `${baseUrl}${canonicalPath === '/home' ? '' : canonicalPath}`
      : undefined

  return {
    title,
    description,

    robots: settings?.robots ?? 'noindex, nofollow, noarchive, nosnippet',

    metadataBase: new URL(baseUrl),

    openGraph: isLocked
      ? undefined
      : {
          title,
          description,
          siteName: settings?.siteName ?? undefined,
          url: canonical,
          images: ogImages,
        },

    twitter: isLocked
      ? undefined
      : {
          card: 'summary_large_image',
          title,
          description,
          images: ogImages?.map((i) => i.url),
        },

    alternates: canonical ? { canonical } : undefined,
  }
}
