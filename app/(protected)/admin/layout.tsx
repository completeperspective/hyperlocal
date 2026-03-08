import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.data) {
    // User is not authenticated
    redirect('/login?returnTo=/admin')
  } else if (!session.data.isAdmin) {
    // User is authenticated but not an admin
    redirect('/dashboard')
  }
  return children
}
