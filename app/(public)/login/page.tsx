import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/forms/login-form'
import WalletConnectButton from '@/components/ui/wallet-connect-button'
import { AuthPageShell } from '@/layouts/auth-page-shell'
import { getSession } from '@/server/auth'
import { AppSettings } from '@/server/helpers/AppSettings'
import { getPageMetadata } from '@/server/helpers/get-metadata'
import type { PageProps } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('Sign in')
}

export default async function LoginPage({ searchParams }: PageProps) {
  const _s = await searchParams
  const returnTo = typeof _s?.returnTo === 'string' ? _s.returnTo : '/dashboard'

  const { data: sessionData } = await getSession()
  if (sessionData) {
    redirect(returnTo)
  }

  const appSettings = await AppSettings.instance.settings()

  return (
    <AuthPageShell
      footer={
        <p className="text-xs">
          {appSettings?.isPrivate ? '' : appSettings?.copyright}
        </p>
      }
    >
      <h1 className="text-5xl font-bold">Welcome back!</h1>
      <LoginForm returnTo={returnTo} allowSignup={appSettings?.allowSignup} />
      {appSettings?.allowWeb3Auth && (
        <section className="w-full max-w-sm">
          <div className="my-2 flex items-center gap-2">
            <hr className="flex-1 text-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <hr className="flex-1 text-border" />
          </div>
          <WalletConnectButton
            returnTo={returnTo}
            signinMessage={appSettings.web3SignInMessage ?? undefined}
          />
        </section>
      )}
    </AuthPageShell>
  )
}
