'use client'

import { useRouter } from 'next/navigation'
import { SessionData } from '@/server/keystone/session'
import AvatarMenu from '@/ui/avatar-menu'

export const AuthenticatedHeader = ({
  sessionData,
}: {
  sessionData: SessionData['data']
}) => {
  const router = useRouter()
  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    router.refresh()
  }

  return (
    <header className="relative h-[65px] w-full px-6 flex items-center justify-end">
      <AvatarMenu
        user={{
          name: sessionData?.name || '',
          email: sessionData?.email || '',
          isAdmin: sessionData?.isAdmin || false,
          imageUrl: sessionData?.profile?.image?.source?.publicUrl || '',
        }}
        onLogout={handleLogout}
        onProfileClick={() => router.push('/profile')}
      />
    </header>
  )
}
