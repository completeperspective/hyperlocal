'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircleIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/ui/alert'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

type ContactPreference = 'email' | 'sms' | 'both' | 'none'

interface OnboardingFormProps {
  returnTo: string
  currentName?: string
  currentEmail?: string
  walletAddress?: string
  isWalletUser?: boolean
}

export function OnboardingForm({
  returnTo,
  currentName,
  currentEmail,
  walletAddress,
  isWalletUser = false,
}: OnboardingFormProps) {
  const router = useRouter()
  const [name, setName] = useState(currentName ?? '')
  const [email, setEmail] = useState(
    currentEmail?.endsWith('@wallet.local') ? '' : (currentEmail ?? ''),
  )
  const [recoveryPhrase, setRecoveryPhrase] = useState('')
  const [mobile, setMobile] = useState('')
  const [contactPreference, setContactPreference] =
    useState<ContactPreference>('email')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (isWalletUser) {
      if (!email.trim()) {
        setError('Email is required to secure your wallet account.')
        return
      }
      if (!recoveryPhrase.trim()) {
        setError(
          'A recovery phrase is required so you can access your account if you lose your wallet.',
        )
        return
      }
    }

    setIsLoading(true)

    try {
      // Update User-level fields (name, email, recoveryPhrase, mobile)
      const userBody: Record<string, string> = {}
      if (name) userBody.name = name
      if (email) userBody.email = email
      if (recoveryPhrase) userBody.recoveryPhrase = recoveryPhrase
      if (mobile) userBody.mobile = mobile

      const meRes = await fetch('/api/v1/account/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userBody),
      })

      if (!meRes.ok) {
        const data = await meRes.json().catch(() => ({}))
        setError(data.message ?? 'Failed to update account')
        return
      }

      // Update Profile-level fields (contactPreference)
      await fetch('/api/v1/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactPreference }),
      })

      router.push(returnTo)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="w-full">
      <div className="mb-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="onboard-name">Display name</Label>
          <Input
            id="onboard-name"
            placeholder={walletAddress ?? 'Your name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="onboard-email">
            Email
            {!isWalletUser && (
              <span className="text-muted-foreground text-xs"> (optional)</span>
            )}
          </Label>
          <Input
            id="onboard-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            required={isWalletUser}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {isWalletUser
              ? 'Required to recover your account if you lose access to your wallet.'
              : 'Add your email to recover your account if you lose access to your wallet.'}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="onboard-phrase">
            Recovery phrase
            {!isWalletUser && (
              <span className="text-muted-foreground text-xs"> (optional)</span>
            )}
          </Label>
          <Input
            id="onboard-phrase"
            type="password"
            placeholder="Choose a recovery phrase"
            value={recoveryPhrase}
            required={isWalletUser}
            onChange={(e) => setRecoveryPhrase(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Your recovery phrase lets you sign in without your wallet.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="onboard-mobile">
            Mobile number{' '}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="onboard-mobile"
            type="tel"
            placeholder="+1 555 000 0000"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Enables SMS login and notifications from admins.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="onboard-contact-pref">Notification preference</Label>
          <select
            id="onboard-contact-pref"
            value={contactPreference}
            onChange={(e) =>
              setContactPreference(e.target.value as ContactPreference)
            }
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Both</option>
            <option value="none">None</option>
          </select>
          <p className="text-muted-foreground text-xs">
            How you&apos;d like to receive notifications from admins.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </Button>
          {!isWalletUser && (
            <Link
              href={returnTo}
              className="text-center text-sm text-muted-foreground hover:underline"
            >
              Skip for now
            </Link>
          )}
        </div>
      </form>
    </section>
  )
}
