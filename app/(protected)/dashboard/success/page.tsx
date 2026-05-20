'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function DashboardSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const returnTo = searchParams.get('returnTo')
  const [status, setStatus] = useState<'verifying' | 'active' | 'timeout'>(
    sessionId ? 'verifying' : 'active',
  )

  useEffect(() => {
    if (!sessionId) return

    async function activate() {
      // First try to activate directly via Stripe API — works even when the
      // webhook hasn't fired yet (e.g. dev without Stripe CLI).
      try {
        const res = await fetch(
          `/api/v1/memberships/checkout/stripe/verify?session_id=${sessionId}`,
        )
        if (res.ok) {
          const data = await res.json()
          if (data.activated) {
            setStatus('active')
            if (returnTo) {
              // Reason: window.location.href forces a full reload so the RSC
              // re-runs getActiveMembership with the now-active membership.
              // router.replace() triggers a client-side nav that may serve a
              // stale RSC cache still showing the membership gate.
              window.location.href = returnTo
            }
            return
          }
        }
      } catch {
        // fall through to polling
      }

      // Fallback: poll until webhook activates the membership (max 30s).
      let attempts = 0
      const maxAttempts = 15

      const poll = async () => {
        try {
          const res = await fetch('/api/v1/memberships')
          const data = await res.json()
          if (data.currentMembership?.status === 'active') {
            setStatus('active')
            if (returnTo) {
              window.location.href = returnTo
            }
            return
          }
        } catch {
          // continue polling on network errors
        }

        attempts++
        if (attempts >= maxAttempts) {
          setStatus('timeout')
          return
        }
        setTimeout(poll, 2000)
      }

      poll()
    }

    activate()
  }, [returnTo, sessionId])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      {status === 'verifying' && (
        <>
          <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </>
      )}
      {status === 'active' && (
        <>
          <div className="text-positive text-5xl">&#10003;</div>
          <h1 className="text-2xl font-bold">Membership activated!</h1>
          {returnTo ? (
            <p className="text-muted-foreground">
              Taking you to your content...
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">Welcome aboard.</p>
              <Link href="/dashboard" className="text-primary underline">
                Go to Dashboard
              </Link>
            </>
          )}
        </>
      )}
      {status === 'timeout' && (
        <>
          <h1 className="text-2xl font-bold">Payment received</h1>
          <p className="text-muted-foreground">
            Your membership is being processed. Check back in a moment.
          </p>
          <Link href="/dashboard" className="text-primary underline">
            Go to Dashboard
          </Link>
        </>
      )}
    </div>
  )
}
