import { redirect } from 'next/navigation'
import { getSession } from '@/server/auth'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.data) {
    redirect('/login?returnTo=/admin')
  } else if (!session.data.isAdmin) {
    redirect('/dashboard')
  }
  return children
}
