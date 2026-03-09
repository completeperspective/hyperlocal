import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth'
import { AuthenticatedHeader } from './_templates/authenticated-header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data } = await getSession()
  if (!data) {
    // User is not authenticated
    redirect('/login?returnTo=/dashboard')
  }

  return (
    <>
      <AuthenticatedHeader sessionData={data} />
      {children}
    </>
  )
}
