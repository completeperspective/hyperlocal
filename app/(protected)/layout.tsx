import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/server/auth'
import { AuthenticatedHeader } from './_templates/authenticated-header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    // User is not authenticated
    redirect('/login?returnTo=/dashboard')
  }

  return (
    <>
      <AuthenticatedHeader />
      {children}
    </>
  )
}
