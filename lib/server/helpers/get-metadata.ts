import { Metadata } from 'next'
import { isAuthenticated } from '@/server/auth'
import { AppSettings } from './AppSettings'

export async function getMetadata(page: string): Promise<Metadata> {
  const settings = await AppSettings.instance.settings()
  const isAuth = await isAuthenticated()

  const isPrivate = settings?.isPrivate ?? true
  const isLocked = isPrivate && !isAuth

  // ─── Title ──────────────────────────────────────────────
  const pageTitle = [settings?.siteName, page].filter(Boolean).join(' | ')
  const title = isLocked ? 'Private' : pageTitle

  // ─── Description ────────────────────────────────────────
  const description = isLocked
    ? 'Please login to access content'
    : (settings?.metaDescription ??
      'Built with Next.js, KeystoneJS, and GraphQL.')

  // ─── OG Image ───────────────────────────────────────────
  const ogImages = settings?.ogImage?.url
    ? [
        {
          url: settings.ogImage.url,
          width: settings.ogImage.width ?? undefined,
          height: settings.ogImage.height ?? undefined,
          alt: settings.siteName ?? page,
        },
      ]
    : undefined

  // ─── Canonical ──────────────────────────────────────────
  const canonical = settings?.baseUrl
    ? `${settings.baseUrl.replace(/\/$/, '')}/${page.toLowerCase().replace(/\s+/g, '-')}`
    : undefined

  return {
    title,
    description,

    robots: settings?.robots ?? 'noindex, nofollow, noarchive, nosnippet',

    metadataBase: new URL(
      settings?.baseUrl ??
        process.env.NEXT_PUBLIC_BASE_URL ??
        'http://localhost:7777',
    ),

    // Open Graph
    openGraph: isLocked
      ? undefined
      : {
          title,
          description,
          siteName: settings?.siteName ?? undefined,
          url: canonical,
          images: ogImages,
        },

    // Twitter/X card
    twitter: isLocked
      ? undefined
      : {
          card: 'summary_large_image',
          title,
          description,
          images: ogImages?.map((i) => i.url),
        },

    // Canonical URL
    alternates: canonical ? { canonical } : undefined,

    // Verification / analytics placeholder
    // (gaTrackingId belongs in layout.tsx, not metadata)
  }
}
