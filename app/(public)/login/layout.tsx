import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/server/auth'
import { AppSettings } from '@/server/helpers'

export default async function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticated()
  if (authenticated) {
    // User is authenticated
    redirect('/dashboard')
  }

  return children
}
