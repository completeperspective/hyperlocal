import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/server/auth'
import { AppSettings } from '@/server/helpers'

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const appSettings = await AppSettings.instance.settings()

  if (appSettings?.allowSignup) {
    const authenticated = await isAuthenticated()
    if (authenticated) {
      // User is authenticated
      redirect('/dashboard')
    }

    return children
  }

  // Signups are disabled, redirect to login
  redirect('/login')
}
