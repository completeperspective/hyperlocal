'use client'

import { useRouter } from 'next/navigation'
import { logout } from '@/actions/logout'
import { Button } from '@/ui/button'

export const AuthenticatedHeader = () => {
  const router = useRouter()
  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  return (
    <header className="relative">
      <Button
        onClick={handleLogout}
        variant="secondary"
        className="!w-auto right-4 top-4 absolute"
      >
        Log Out
      </Button>
    </header>
  )
}
