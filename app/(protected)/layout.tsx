import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth'
import { AuthenticatedHeader } from './_templates/authenticated-header'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pageHeaders = await headers()
  const pathname = pageHeaders.get('x-current-path') as string
  const { data } = await getSession()
  if (!data) {
    // User is not authenticated
    redirect(`/login?returnTo=${encodeURIComponent(pathname)}`)
  }

  return (
    <>
      <AuthenticatedHeader sessionData={data} />
      {children}
    </>
  )
}
