'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { XIcon } from 'lucide-react'

const DISMISSED_KEY = 'profile-banner-dismissed'

export function ProfileCompletionBanner({ nickname }: { nickname?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (nickname) return
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed) setVisible(true)
  }, [nickname])

  if (!visible) return null

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      role="alert"
      className="bg-info text-info-foreground mb-4 flex items-center justify-between rounded-md px-4 py-3 text-sm"
    >
      <span>
        Your profile is incomplete.{' '}
        <Link href="/profile" className="font-semibold underline">
          Set up your profile
        </Link>{' '}
        to personalize your account.
      </span>
      <button
        aria-label="Dismiss"
        onClick={handleDismiss}
        className="ml-4 shrink-0 opacity-70 hover:opacity-100"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
