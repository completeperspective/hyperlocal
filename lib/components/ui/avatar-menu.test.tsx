import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarMenu } from './avatar-menu'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}))

// jsdom doesn't implement matchMedia — required by useIsMobile
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Force desktop viewport so DropdownMenu renders (not mobile Drawer)
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1280,
})

beforeEach(() => {
  vi.clearAllMocks()
})

const authenticatedUser = {
  name: 'Bob Smith',
  email: 'bob@example.com',
  isAdmin: false,
}

describe('AvatarMenu', () => {
  it('renders HI avatar fallback when unauthenticated', () => {
    render(<AvatarMenu isAuthenticated={false} />)
    expect(screen.getByText('HI')).toBeDefined()
  })

  it('shows Log In and Connect Wallet menu items after opening when unauthenticated', async () => {
    const user = userEvent.setup()
    render(<AvatarMenu isAuthenticated={false} onConnectWallet={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /open user menu/i }))
    expect(screen.getByText('Log In')).toBeDefined()
    expect(screen.getByText('Connect Wallet')).toBeDefined()
  })

  it('does not crash when onConnectWallet is omitted (unauthenticated)', async () => {
    const user = userEvent.setup()
    expect(() => render(<AvatarMenu isAuthenticated={false} />)).not.toThrow()
    await user.click(screen.getByRole('button', { name: /open user menu/i }))
    // Connect Wallet item still renders even without a callback
    expect(screen.getByText('Connect Wallet')).toBeDefined()
  })

  it('shows user name and email in menu header when authenticated', async () => {
    const user = userEvent.setup()
    render(
      <AvatarMenu
        isAuthenticated={true}
        user={authenticatedUser}
        onLogout={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /open user menu/i }))
    // UserHeader in DropdownMenuLabel shows name and email
    expect(screen.getByText('Bob Smith')).toBeDefined()
    expect(screen.getByText('bob@example.com')).toBeDefined()
  })
})
