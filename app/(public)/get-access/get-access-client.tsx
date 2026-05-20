'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/forms/login-form'
import { RegisterAndLoginForm } from '@/components/forms/register-and-login-form'
import { AuthPageShell } from '@/layouts/auth-page-shell'
import type { MembershipTier } from '@/types/membership'
import { Button } from '@/ui/button'
import { CryptoPaymentButton } from '@/ui/crypto-payment-button'
import { MembershipTierCard } from '@/ui/membership-tier-card'
import { WalletConnectButton } from '@/ui/wallet-connect-button'

type Tab = 'signin' | 'signup' | 'wallet'

interface GetAccessClientProps {
  returnTo: string
  tiers: MembershipTier[]
  allowWeb3Auth: boolean
  allowSignup: boolean
  signinMessage?: string
  isAuthenticated: boolean
  // Present when the session user authenticated via a Web3 wallet.
  // Determines whether the crypto payment option is offered.
  walletAddress: string | null
  receiverWalletAddress: string | null
}

export function GetAccessClient({
  returnTo,
  tiers,
  allowWeb3Auth,
  allowSignup,
  signinMessage,
  isAuthenticated,
  walletAddress,
  receiverWalletAddress,
}: GetAccessClientProps) {
  const [tab, setTab] = useState<Tab>('signin')
  const [cryptoTierId, setCryptoTierId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Crypto is only available to web3 users (wallet in session) when a
  // receiver address is configured on the platform.
  const cryptoEnabled = !!walletAddress && !!receiverWalletAddress
  const cryptoTier = cryptoTierId
    ? tiers.find((t) => t.id === cryptoTierId)
    : null

  async function handleSelectStripe(tierId: string) {
    setError(null)
    const res = await fetch('/api/v1/memberships/checkout/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId, returnTo }),
    })
    const data = await res.json()
    if (data.activated) {
      // Free tier — activated immediately, hard-nav for iOS cookie safety.
      window.location.href = returnTo
    } else if (data.url) {
      // Paid tier — redirect to Stripe checkout.
      window.location.href = data.url
    } else {
      setError(data.error ?? data.message ?? 'Something went wrong')
    }
  }

  function handleSelectCrypto(tierId: string) {
    setError(null)
    setCryptoTierId(tierId)
  }

  return (
    <AuthPageShell>
      {isAuthenticated ? (
        <AuthenticatedPlansView
          tiers={tiers}
          cryptoEnabled={cryptoEnabled}
          cryptoTier={cryptoTier || undefined}
          receiverWalletAddress={receiverWalletAddress}
          returnTo={returnTo}
          error={error}
          onSelectStripe={handleSelectStripe}
          onSelectCrypto={handleSelectCrypto}
          onCancelCrypto={() => setCryptoTierId(null)}
          onCryptoSuccess={() => {
            window.location.href = returnTo
          }}
          onCryptoError={(msg) => setError(msg)}
        />
      ) : (
        <UnauthenticatedView
          tab={tab}
          tiers={tiers}
          returnTo={returnTo}
          allowSignup={allowSignup}
          allowWeb3Auth={allowWeb3Auth}
          signinMessage={signinMessage}
          onTabChange={setTab}
        />
      )}
    </AuthPageShell>
  )
}

// ─── Authenticated: plan picker only ─────────────────────────────────────────

interface AuthenticatedPlansViewProps {
  tiers: MembershipTier[]
  cryptoEnabled: boolean
  cryptoTier: MembershipTier | undefined
  receiverWalletAddress: string | null
  returnTo: string
  error: string | null
  onSelectStripe: (tierId: string) => void
  onSelectCrypto: (tierId: string) => void
  onCancelCrypto: () => void
  onCryptoSuccess: () => void
  onCryptoError: (msg: string) => void
}

function AuthenticatedPlansView({
  tiers,
  cryptoEnabled,
  cryptoTier,
  receiverWalletAddress,
  error,
  onSelectStripe,
  onSelectCrypto,
  onCancelCrypto,
  onCryptoSuccess,
  onCryptoError,
}: AuthenticatedPlansViewProps) {
  return (
    <>
      <div className="text-center">
        <h1>Choose a Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select a membership to continue
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive w-full rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {tiers.length > 0 && (
        <div className="w-full grid gap-4 grid-cols-1">
          {tiers.map((tier) => (
            <MembershipTierCard
              key={tier.id}
              tier={tier}
              isCurrentTier={false}
              onSelectStripe={onSelectStripe}
              onSelectCrypto={onSelectCrypto}
              cryptoEnabled={cryptoEnabled}
              contentAccessPatterns={tier.contentAccessPatterns}
            />
          ))}
        </div>
      )}

      {cryptoTier && receiverWalletAddress && (
        <div className="border-border w-full rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold">
            Pay with Crypto — {cryptoTier.name}
          </h3>
          <CryptoPaymentButton
            tierId={cryptoTier.id}
            priceInCents={cryptoTier.priceInCents}
            receiverAddress={receiverWalletAddress}
            onSuccess={onCryptoSuccess}
            onError={onCryptoError}
          />
          <button
            onClick={onCancelCrypto}
            className="text-muted-foreground mt-3 text-sm underline"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  )
}

// ─── Unauthenticated: auth tabs + informational plan list ─────────────────────

interface UnauthenticatedViewProps {
  tab: Tab
  tiers: MembershipTier[]
  returnTo: string
  allowSignup: boolean
  allowWeb3Auth: boolean
  signinMessage?: string
  onTabChange: (tab: Tab) => void
}

function UnauthenticatedView({
  tab,
  tiers,
  returnTo,
  allowSignup,
  allowWeb3Auth,
  signinMessage,
  onTabChange,
}: UnauthenticatedViewProps) {
  return (
    <>
      <div className="text-center">
        <h1>Get Access</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sign in or create an account to continue
        </p>
      </div>

      <div className="flex gap-2 w-full">
        <Button
          variant={tab === 'signin' ? 'default' : 'outline'}
          onClick={() => onTabChange('signin')}
          className="flex-1"
          size="sm"
        >
          Sign In
        </Button>
        {allowSignup && (
          <Button
            variant={tab === 'signup' ? 'default' : 'outline'}
            onClick={() => onTabChange('signup')}
            className="flex-1"
            size="sm"
          >
            Create Account
          </Button>
        )}
        {allowWeb3Auth && (
          <Button
            variant={tab === 'wallet' ? 'default' : 'outline'}
            onClick={() => onTabChange('wallet')}
            className="flex-1"
            size="sm"
          >
            Wallet
          </Button>
        )}
      </div>

      <div className="w-full">
        {tab === 'signin' && (
          <LoginForm returnTo={returnTo} allowSignup={false} />
        )}
        {tab === 'signup' && allowSignup && (
          <RegisterAndLoginForm returnTo={returnTo} />
        )}
        {tab === 'wallet' && allowWeb3Auth && (
          <WalletConnectButton
            returnTo={returnTo}
            signinMessage={signinMessage}
          />
        )}
      </div>

      {tiers.length > 0 && (
        <div className="w-full mt-4">
          <h2 className="text-base font-semibold mb-2">Available Plans</h2>

          <div className="grid gap-4 grid-cols-1">
            {tiers.map((tier) => (
              <MembershipTierCard
                key={tier.id}
                tier={tier}
                isCurrentTier={false}
                onSelectStripe={() => {}}
                onSelectCrypto={() => {}}
                cryptoEnabled={false}
                showCta={false}
                contentAccessPatterns={tier.contentAccessPatterns}
              />
            ))}
          </div>
          <p className="text-muted-foreground my-4 text-center text-sm">
            No payment required to sign up.
          </p>
        </div>
      )}
    </>
  )
}
