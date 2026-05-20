import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SiteHeader } from './site-header'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
let mockPathname = '/courses/pwa-typescript-graphql-course/01-create-project'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => mockPathname,
}))

vi.mock('@/actions/logout', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@reown/appkit/react', () => ({
  useAppKit: () => ({ open: vi.fn() }),
}))

vi.mock('@/ui/wallet-connect-button', () => ({
  WalletConnectButton: () => (
    <button data-testid="wallet-connect">Connect Wallet</button>
  ),
}))

// jsdom doesn't implement matchMedia — required by AvatarMenu's useIsMobile
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

// Force desktop viewport so AvatarMenu renders DropdownMenu (not mobile Drawer)
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1280,
})

beforeEach(() => {
  mockPathname = '/courses/pwa-typescript-graphql-course/01-create-project'
  vi.clearAllMocks()
  Object.defineProperty(window, 'scrollY', {
    writable: true,
    configurable: true,
    value: 0,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 800,
  })
})

const mockSession = {
  id: '1',
  name: 'Alice Test',
  email: 'alice@test.com',
  isAdmin: false,
  isMember: true,
  profile: {
    nickname: 'alice',
    description: '',
    location: '',
    isPublic: false,
    image: { source: { publicUrl: '' } },
  },
}

describe('SiteHeader', () => {
  it('renders no auth controls when unauthenticated and web3 is off', () => {
    render(<SiteHeader sessionData={null} allowWeb3Auth={false} />)
    // No wallet button, no avatar — unauthenticated with no features enabled
    expect(screen.queryByTestId('wallet-connect')).toBeNull()
    expect(screen.queryByRole('button', { name: /open user menu/i })).toBeNull()
  })

  it('renders user initials without Log In link when authenticated', () => {
    render(<SiteHeader sessionData={mockSession} />)
    // getInitials('Alice Test') = 'AT'
    expect(screen.getByText('AT')).toBeDefined()
    expect(screen.queryByRole('link', { name: /log in/i })).toBeNull()
  })

  it('shows WalletConnectButton when allowWeb3Auth is true and unauthenticated', () => {
    render(<SiteHeader sessionData={null} allowWeb3Auth={true} />)
    expect(screen.getByTestId('wallet-connect')).toBeDefined()
  })

  it('hides WalletConnectButton when allowWeb3Auth is false', () => {
    render(<SiteHeader sessionData={null} allowWeb3Auth={false} />)
    expect(screen.queryByTestId('wallet-connect')).toBeNull()
  })

  it('starts transparent and gains background class after scrolling past 50vh', async () => {
    mockPathname = '/'
    render(
      <SiteHeader
        sessionData={null}
        transparentEnabled={true}
        homeIsHero={true}
      />,
    )
    const header = screen.getByRole('banner')

    expect(header.className).toContain('bg-transparent')
    expect(header.className).not.toContain('bg-background/95')

    // Simulate scroll past 50% of viewport height (> 400px when innerHeight=800)
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 500,
    })
    await act(async () => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(header.className).toContain('bg-background/95')
    expect(header.className).not.toContain('bg-transparent')
  })

  it('renders site name link when hideSiteName is false', () => {
    render(
      <SiteHeader sessionData={null} siteName="MyApp" hideSiteName={false} />,
    )
    expect(screen.getByRole('link', { name: 'MyApp' })).toBeDefined()
  })

  it('Log In link includes encoded returnTo from current pathname', () => {
    render(<SiteHeader sessionData={null} />)
    const loginLink = screen.getByRole('link', { name: /log in/i })
    expect(loginLink.getAttribute('href')).toBe(
      '/login?returnTo=%2Fcourses%2Fpwa-typescript-graphql-course%2F01-create-project',
    )
  })
})
