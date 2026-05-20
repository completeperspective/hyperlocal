'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, Check, CreditCard } from 'lucide-react'
import type { UserMembership } from '@/types/membership'
import { Button } from '@/ui/button'
import { CancelMembershipDialog } from '@/ui/cancel-membership-dialog'
import { MembershipStatusBadge } from '@/ui/membership-status-badge'
import { Separator } from '@/ui/separator'
import { Skeleton } from '@/ui/skeleton'
import { cn } from '@/utils'
import { translatePattern } from '@/utils/content-access'

interface MembershipManagePanelProps {
  membership: UserMembership | null
  compact?: boolean
  portalReturned?: boolean
}

function PaymentMethodBadge({
  paymentMethod,
}: {
  paymentMethod: UserMembership['paymentMethod']
}) {
  if (!paymentMethod) return null
  const config = {
    free: {
      label: 'Free',
      classes: 'bg-muted text-muted-foreground border-border',
    },
    stripe: {
      label: 'Card',
      classes: 'bg-background text-foreground border-border',
    },
    crypto: { label: 'Crypto', classes: 'bg-info/15 text-info border-info/20' },
  }[paymentMethod]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.classes,
      )}
    >
      {config.label}
    </span>
  )
}

function MembershipEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <CreditCard className="size-10 text-muted-foreground" />
      <div>
        <p className="font-semibold text-foreground">No membership yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          You don&apos;t have a membership yet.
        </p>
      </div>
      <Button asChild>
        <Link href="/get-access">Browse memberships</Link>
      </Button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-60" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export function MembershipManagePanel({
  membership,
  compact = false,
  portalReturned = false,
}: MembershipManagePanelProps) {
  const router = useRouter()
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [showNotice, setShowNotice] = useState(portalReturned)
  const [showAllPatterns, setShowAllPatterns] = useState(false)

  useEffect(() => {
    if (!portalReturned) return
    router.replace('/dashboard', { scroll: false })
    const timer = setTimeout(() => setShowNotice(false), 8000)
    return () => clearTimeout(timer)
  }, [portalReturned, router])

  if (membership === null) {
    return <MembershipEmptyState />
  }

  const { status, tier, paymentMethod, activatedAt, expiresAt } = membership

  if (status === 'blocked') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">Account Restricted</p>
            <p className="text-sm mt-0.5 opacity-80">
              Your membership has been restricted. Please contact support to
              resolve this.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-6">
        <div className="flex items-center gap-3 text-warning">
          <div
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-label="Loading"
          />
          <div>
            <p className="font-semibold">Processing Membership</p>
            <p className="text-sm mt-0.5 opacity-80">
              Your payment for{' '}
              <strong>{tier?.name ?? 'this membership'}</strong> is being
              confirmed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">Payment Failed</p>
            <p className="text-sm mt-0.5 opacity-80">
              Your last payment could not be processed.{' '}
              <Link href="/get-access" className="underline">
                Browse memberships
              </Link>{' '}
              to try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-6">
        <div className="flex items-center gap-3 text-warning">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">Membership Expired</p>
            <p className="text-sm mt-0.5 opacity-80">
              Your{tier?.name ? ` ${tier.name}` : ''} membership has expired.{' '}
              <Link href="/get-access" className="underline">
                Browse memberships
              </Link>{' '}
              to renew.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Active state
  async function handleManageBilling() {
    setInlineError(null)
    setIsLoadingPortal(true)
    try {
      const res = await fetch('/api/v1/account/billing-portal', {
        method: 'POST',
      })
      if (!res.ok) {
        if (res.status === 404) setInlineError('No active subscription found.')
        else if (res.status === 422)
          setInlineError(
            'Your payment was processed before the billing portal was available. Please contact support.',
          )
        else setInlineError('Could not reach billing portal. Please try again.')
        return
      }
      const { url } = (await res.json()) as { url: string }
      // Reason: window.location.href (not router.push) avoids iOS WebKit cookie timing issues
      window.location.href = url
    } catch {
      setInlineError('Could not reach billing portal. Please try again.')
    } finally {
      setIsLoadingPortal(false)
    }
  }

  async function handleCancelConfirm() {
    const res = await fetch('/api/v1/memberships/cancel', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId: membership!.id }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      throw new Error(
        body.message ?? 'Could not cancel membership. Please try again.',
      )
    }
    setCancelDialogOpen(false)
    // Reason: reload re-fetches server-side membership data without prop-drilling a refresh callback
    window.location.reload()
  }

  const isStripeSubscription =
    tier?.paymentType === 'subscription' && paymentMethod === 'stripe'
  const patterns = tier?.contentAccessPatterns ?? []
  const visiblePatterns = showAllPatterns ? patterns : patterns.slice(0, 4)
  const hiddenCount = patterns.length - 4

  const expiryLabel =
    tier?.paymentType === 'subscription'
      ? 'Renews'
      : tier?.paymentType === 'one_time' || tier?.paymentType === undefined
        ? 'Access until'
        : tier?.paymentType === 'free'
          ? null
          : 'Access until'

  return (
    <>
      {showNotice && (
        <div
          role="status"
          className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-sm text-info"
        >
          <p>
            Your subscription settings have been updated. Changes from the
            billing portal may take a moment to reflect here.
          </p>
          <button
            onClick={() => setShowNotice(false)}
            className="shrink-0 text-info/70 hover:text-info"
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-6">
        <div
          className={cn(
            compact ? 'space-y-4' : 'grid grid-cols-1 gap-6 lg:grid-cols-3',
          )}
        >
          <div className={cn(compact ? '' : 'lg:col-span-2', 'space-y-4')}>
            <div className="flex flex-wrap items-center gap-2">
              {tier ? (
                <span className="text-lg font-semibold text-foreground">
                  {tier.name}
                </span>
              ) : (
                <span className="text-lg font-semibold text-muted-foreground">
                  (Tier no longer available)
                </span>
              )}
              <MembershipStatusBadge status={status} />
              <PaymentMethodBadge paymentMethod={paymentMethod} />
            </div>

            {activatedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" />
                <span>
                  Member since {new Date(activatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {expiryLabel && expiresAt && tier?.paymentType !== 'free' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4 shrink-0" />
                <span>
                  {expiryLabel} {new Date(expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {patterns.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    What&apos;s included
                  </p>
                  <ul className="space-y-1">
                    {visiblePatterns.map((pat) => (
                      <li key={pat} className="flex items-center gap-2 text-sm">
                        <Check className="size-4 shrink-0 text-positive" />
                        {translatePattern(pat)}
                      </li>
                    ))}
                  </ul>
                  {hiddenCount > 0 && !showAllPatterns && (
                    <button
                      onClick={() => setShowAllPatterns(true)}
                      className="text-xs text-primary underline"
                    >
                      + {hiddenCount} more
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <div
            className={cn(
              compact ? '' : 'lg:col-span-1',
              'flex flex-col justify-start gap-3',
            )}
          >
            {isStripeSubscription ? (
              <Button
                onClick={handleManageBilling}
                disabled={isLoadingPortal}
                aria-busy={isLoadingPortal}
                className="w-full sm:w-auto"
              >
                {isLoadingPortal ? 'Opening billing portal…' : 'Manage Billing'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                Cancel Membership
              </Button>
            )}
            {inlineError && (
              <p className="text-sm text-destructive" role="alert">
                {inlineError}
              </p>
            )}
          </div>
        </div>
      </div>

      <CancelMembershipDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        tierName={tier?.name ?? ''}
        onConfirm={handleCancelConfirm}
      />
    </>
  )
}

export { LoadingSkeleton as MembershipLoadingSkeleton }
