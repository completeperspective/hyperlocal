'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  Sun,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { cn } from '@/utils'

// ============================================================================
// Types
// ============================================================================

interface UserInfo {
  name: string
  email: string
  isAdmin: boolean
  imageUrl?: string
}

interface MenuItem {
  label: string
  icon: React.ElementType
  onClick?: () => void
  href?: string
  destructive?: boolean
}

interface AvatarMenuProps {
  user: UserInfo
  onProfileClick?: () => void
  onSettingsClick?: () => void
  onBillingClick?: () => void
  onHelpClick?: () => void
  onLogout?: () => void
  className?: string
}

// ============================================================================
// Hook: useIsMobile
// ============================================================================

const MOBILE_BREAKPOINT = 768

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}

// ============================================================================
// Helper: Get initials from name
// ============================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ============================================================================
// Shared Components
// ============================================================================

interface UserHeaderProps {
  user: UserInfo
  size?: 'sm' | 'lg'
}

function UserHeader({ user, size = 'sm' }: UserHeaderProps) {
  const avatarSize = size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'

  return (
    <div className="flex items-center gap-3">
      <Avatar className={cn(avatarSize, 'ring-2 ring-background')}>
        <AvatarImage src={user.imageUrl} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col text-left">
        <span className="text-sm font-medium leading-tight">{user.name}</span>
        <span className="text-xs text-muted-foreground leading-tight">
          {user.email}
        </span>
      </div>
    </div>
  )
}

interface MenuItemContentProps {
  icon: React.ElementType
  label: string
  destructive?: boolean
  showChevron?: boolean
}

function MenuItemContent({
  icon: Icon,
  label,
  destructive,
  showChevron,
}: MenuItemContentProps) {
  return (
    <>
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          destructive ? 'text-destructive' : 'text-muted-foreground',
        )}
      />
      <span className={cn('flex-1', destructive && 'text-destructive')}>
        {label}
      </span>
      {showChevron && (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </>
  )
}

// ============================================================================
// Desktop: Dropdown Menu
// ============================================================================

interface DesktopMenuProps {
  user: UserInfo
  menuItems: MenuItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DesktopMenu({
  user,
  menuItems,
  open,
  onOpenChange,
}: DesktopMenuProps) {
  const regularItems = menuItems.filter((item) => !item.destructive)
  const destructiveItems = menuItems.filter((item) => item.destructive)

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all"
          aria-label="Open user menu"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.imageUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64"
        align="end"
        sideOffset={8}
        forceMount
      >
        <DropdownMenuLabel className="font-normal p-3">
          <UserHeader user={user} />
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup className="p-1">
          {regularItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onClick={item.onClick}
              className="gap-3 py-2.5 px-3 cursor-pointer"
            >
              <MenuItemContent icon={item.icon} label={item.label} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        {destructiveItems.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-1">
              {destructiveItems.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={item.onClick}
                  className="gap-3 py-2.5 px-3 cursor-pointer focus:bg-destructive/10"
                >
                  <MenuItemContent
                    icon={item.icon}
                    label={item.label}
                    destructive
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Mobile: Drawer Menu
// ============================================================================

interface MobileMenuProps {
  user: UserInfo
  menuItems: MenuItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MobileMenu({ user, menuItems, open, onOpenChange }: MobileMenuProps) {
  const regularItems = menuItems.filter((item) => !item.destructive)
  const destructiveItems = menuItems.filter((item) => item.destructive)

  const handleItemClick = (onClick?: () => void) => {
    onClick?.()
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-11 w-11 rounded-full p-0 active:scale-95 transition-transform"
          aria-label="Open user menu"
        >
          <Avatar className="h-11 w-11">
            <AvatarImage src={user.imageUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85vh] border-border">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="sr-only">User Menu</DrawerTitle>
          <div className="flex items-center justify-center pt-2 pb-4">
            <UserHeader user={user} size="lg" />
          </div>
        </DrawerHeader>

        <div className="px-4 pb-8">
          {/* Regular menu items */}
          <nav className="space-y-1" role="menu">
            {regularItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleItemClick(item.onClick)}
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors hover:bg-muted active:bg-muted/80"
                role="menuitem"
              >
                <MenuItemContent
                  icon={item.icon}
                  label={item.label}
                  showChevron
                />
              </button>
            ))}
          </nav>

          {/* Separator */}
          {destructiveItems.length > 0 && (
            <div className="my-4 h-px bg-border" />
          )}

          {/* Destructive items */}
          <nav className="space-y-1" role="menu">
            {destructiveItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleItemClick(item.onClick)}
                className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors hover:bg-destructive/10 active:bg-destructive/20"
                role="menuitem"
              >
                <MenuItemContent
                  icon={item.icon}
                  label={item.label}
                  destructive
                />
              </button>
            ))}
          </nav>

          {/* Safe area padding for iOS */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ============================================================================
// Main Component: AvatarMenu
// ============================================================================

export function AvatarMenu({
  user,
  onProfileClick,
  onSettingsClick,
  onBillingClick,
  onHelpClick,
  onLogout,
  className,
}: AvatarMenuProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  console.log({ user })
  const menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: Sun, onClick: () => router.push('/dashboard') },
    { label: 'Profile', icon: User, onClick: onProfileClick },
    { label: 'Settings', icon: Settings, onClick: onSettingsClick },
    { label: 'Billing', icon: CreditCard, onClick: onBillingClick },
    { label: 'Help & Support', icon: HelpCircle, onClick: onHelpClick },
    { label: 'Log out', icon: LogOut, onClick: onLogout, destructive: true },
  ]

  if (user.isAdmin) {
    menuItems.splice(0, 0, {
      label: 'Admin',
      icon: Settings,
      onClick: () => {
        router.push('/admin')
      },
    })
  }

  // Prevent hydration mismatch by not rendering until we know the device type
  if (isMobile === undefined) {
    return (
      <div className={cn('h-10 w-10 md:h-11 md:w-11', className)}>
        <Avatar className="h-full w-full animate-pulse">
          <AvatarFallback className="bg-muted" />
        </Avatar>
      </div>
    )
  }

  return (
    <div className={className}>
      {isMobile ? (
        <MobileMenu
          user={user}
          menuItems={menuItems}
          open={open}
          onOpenChange={setOpen}
        />
      ) : (
        <DesktopMenu
          user={user}
          menuItems={menuItems}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </div>
  )
}

export default AvatarMenu
