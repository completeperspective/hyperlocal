import { OnboardingForm } from '@/components/forms/onboarding-form'
import { AuthPageShell } from '@/layouts/auth-page-shell'
import { getSession } from '@/server/auth'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const _s = await searchParams
  const returnTo = typeof _s?.returnTo === 'string' ? _s.returnTo : '/dashboard'

  const { data } = await getSession()

  const isWalletUser =
    !!data?.walletAddress && !!data?.email?.endsWith('@wallet.local')

  return (
    <AuthPageShell>
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          Welcome! Let&apos;s set up your account
        </h1>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          {isWalletUser
            ? 'Add your email and a recovery phrase to secure your account — these are required so you can sign in without your wallet if you ever lose access.'
            : 'Adding your email and a recovery phrase lets you sign in without your wallet if you ever lose access.'}
        </p>
      </div>
      <OnboardingForm
        returnTo={returnTo}
        currentName={data?.name}
        currentEmail={data?.email}
        walletAddress={data?.walletAddress}
        isWalletUser={isWalletUser}
      />
    </AuthPageShell>
  )
}
