import { Metadata } from 'next'
import { LoginForm } from '@/components/forms/login-form'
import { AppSettings } from '@/server/helpers/AppSettings'
import { getPageMetadata } from '@/server/helpers/get-metadata'
import type { PageProps } from '@/types'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('Login')
}
export default async function LoginPage({ searchParams }: PageProps) {
  const _s = await searchParams

  const returnTo = _s?.returnTo as string

  const appSettings = await AppSettings.instance.settings()

  return (
    <div className="gap-16 p-4 pb-20 sm:p-20 grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="gap-4 row-start-2 flex flex-col items-center">
        <h1>Welcome back!</h1>
        <LoginForm returnTo={returnTo} showSignup={appSettings?.allowSignup} />
      </main>
      <footer className="gap-6 row-start-3 flex flex-wrap items-center justify-center">
        <p className="text-xs text-gray-400">
          - created with ♥ by complete perspective -
        </p>
      </footer>
    </div>
  )
}
