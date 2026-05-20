'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { SessionData } from '~/lib/server/keystone/session'
import { logout } from '@/actions/logout'
import { AvatarMenu } from '@/ui/avatar-menu'
import { Button } from '@/ui/button'
import { WalletConnectButton } from '@/ui/wallet-connect-button'
import { cn } from '@/utils/cn'
import { displayEmail } from '@/utils/profile'

// ============================================================================
// Types
// ============================================================================

interface SiteHeaderProps {
  sessionData: SessionData['data'] | null
  siteName?: string
  allowWeb3Auth?: boolean
  /** Global transparency setting from AppSettings. Transparency applies only on hero pages. */
  transparentEnabled?: boolean
  /** Course slugs with heroEnabled=true — matched against /courses/[slug] pathname. */
  heroCourseSlugs?: string[]
  /** Full path prefixes for page indexes with heroEnabled=true — prefix-matched against pathname. */
  heroPageIndexPrefixes?: string[]
  /** Whether the home page (/) has a hero in its root content. */
  homeIsHero?: boolean
  hideSiteName?: boolean
  sidebarBg?: boolean
  hasBilling?: boolean
}

// ============================================================================
// Sub-components
// ============================================================================

// ============================================================================
// Hook
// ============================================================================

function useScrollThreshold(thresholdVh: number): boolean {
  const [scrolledPast, setScrolledPast] = React.useState(false)
  React.useEffect(() => {
    const check = () =>
      setScrolledPast(window.scrollY > window.innerHeight * (thresholdVh / 100))
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [thresholdVh])
  return scrolledPast
}

// ============================================================================
// Component
// ============================================================================

export function SiteHeader({
  sessionData,
  siteName,
  allowWeb3Auth = false,
  transparentEnabled = false,
  heroCourseSlugs = [],
  heroPageIndexPrefixes = [],
  homeIsHero = false,
  hideSiteName = true,
  sidebarBg = false,
  hasBilling = false,
}: SiteHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const scrolledPast = useScrollThreshold(35)

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  const handleBillingClick = () => {
    router.push('/settings#membership')
  }

  // Reason: the root layout is shared across navigations and its server-rendered
  // props grow stale on client-side navigation. Re-derive transparency here using
  // the live client pathname so dashboard→home and home→dashboard both behave correctly.
  const courseIndexSlug = pathname.match(/^\/courses\/([^/]+)\/?$/)?.[1]
  const onHeroPageIndex = heroPageIndexPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
  )
  const effectiveTransparent =
    transparentEnabled &&
    ((pathname === '/' && homeIsHero) ||
      (!!courseIndexSlug && heroCourseSlugs.includes(courseIndexSlug)) ||
      onHeroPageIndex)

  // Reason: fixed removes the header from document flow so hero content bleeds
  // behind it from y=0. sticky is used on non-transparent pages so content
  // naturally starts below the header without needing manual top padding.
  const headerClass = cn(
    'top-0 z-50 w-full h-16',
    effectiveTransparent ? 'fixed' : 'sticky',
    // Reason: transition-[background-color,backdrop-filter,box-shadow,color] excludes
    // border from the animation so the border snaps in rather than fading, preventing flicker.
    effectiveTransparent
      ? scrolledPast
        ? 'bg-background/95 shadow-sm backdrop-blur-sm transition-[background-color,backdrop-filter,box-shadow,color] duration-300'
        : 'bg-transparent text-white transition-[background-color,backdrop-filter,box-shadow,color] duration-300'
      : sidebarBg
        ? 'bg-sidebar/50 backdrop-blur-sm border-b border-sidebar-border'
        : 'bg-background border-b border-border',
  )

  return (
    <header className={headerClass}>
      <nav className="px-4 md:px-6 h-full flex items-center justify-between">
        <Link href="/" className="font-heading text-lg font-semibold">
          {!hideSiteName && (siteName ?? 'Home')}
        </Link>

        <div className="flex items-center gap-3">
          {sessionData ? (
            <AvatarMenu
              isAuthenticated={true}
              user={{
                name: sessionData.name,
                email: displayEmail(sessionData.email) ?? '',
                isAdmin: sessionData.isAdmin,
                imageUrl:
                  sessionData.profile?.image?.source?.publicUrl || undefined,
              }}
              onLogout={handleLogout}
              onProfileClick={() => router.push('/profile')}
              onEditProfileClick={() => router.push('/profile')}
              onSettingsClick={() => router.push('/settings')}
              onBillingClick={hasBilling ? handleBillingClick : undefined}
            />
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`}>
                  Log In
                </Link>
              </Button>
              {allowWeb3Auth && <WalletConnectButton />}
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
