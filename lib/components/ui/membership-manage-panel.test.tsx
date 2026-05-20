import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MembershipTier, UserMembership } from '@/types/membership'
import { MembershipManagePanel } from './membership-manage-panel'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

Object.defineProperty(window, 'location', {
  value: { href: '', reload: vi.fn() },
  writable: true,
})

function makeTier(overrides: Partial<MembershipTier> = {}): MembershipTier {
  return {
    id: 'tier-1',
    name: 'Pro',
    description: null,
    priceInCents: 999,
    paymentType: 'subscription',
    stripeProductId: null,
    stripePriceId: null,
    isActive: true,
    contentAccessPatterns: [],
    ...overrides,
  }
}

function makeMembership(
  overrides: Partial<UserMembership> = {},
): UserMembership {
  return {
    id: 'mem-1',
    status: 'active',
    paymentMethod: 'stripe',
    activatedAt: '2024-01-01T00:00:00.000Z',
    expiresAt: null,
    tier: makeTier(),
    ...overrides,
  }
}

describe('MembershipManagePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    window.location.href = ''
    ;(window.location.reload as ReturnType<typeof vi.fn>).mockClear()
  })

  it('shows "No membership yet" and browse link when membership is null', () => {
    render(<MembershipManagePanel membership={null} />)
    expect(screen.getByText('No membership yet')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /browse memberships/i }),
    ).toHaveAttribute('href', '/get-access')
  })

  it('shows "Manage Billing" for active stripe subscription, no cancel button', () => {
    const membership = makeMembership({
      status: 'active',
      paymentMethod: 'stripe',
      tier: makeTier({ paymentType: 'subscription' }),
    })
    render(<MembershipManagePanel membership={membership} />)
    expect(
      screen.getByRole('button', { name: /manage billing/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /cancel membership/i }),
    ).not.toBeInTheDocument()
  })

  it('shows "Cancel Membership" for active free tier', () => {
    const membership = makeMembership({
      status: 'active',
      paymentMethod: 'free',
      tier: makeTier({ paymentType: 'free' }),
    })
    render(<MembershipManagePanel membership={membership} />)
    expect(
      screen.getByRole('button', { name: /cancel membership/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /manage billing/i }),
    ).not.toBeInTheDocument()
  })

  it('shows "Cancel Membership" for active crypto membership', () => {
    const membership = makeMembership({
      status: 'active',
      paymentMethod: 'crypto',
      tier: makeTier({ paymentType: 'one_time' }),
    })
    render(<MembershipManagePanel membership={membership} />)
    expect(
      screen.getByRole('button', { name: /cancel membership/i }),
    ).toBeInTheDocument()
  })

  it('shows pending state with no CTA when status is pending', () => {
    const membership = makeMembership({ status: 'pending' })
    render(<MembershipManagePanel membership={membership} />)
    expect(screen.getByText('Processing Membership')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /manage billing/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /cancel/i }),
    ).not.toBeInTheDocument()
  })

  it('shows expired state with browse link, no cancel button', () => {
    const membership = makeMembership({ status: 'expired' })
    render(<MembershipManagePanel membership={membership} />)
    expect(screen.getByText('Membership Expired')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /browse memberships/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /cancel/i }),
    ).not.toBeInTheDocument()
  })

  it('shows failed state with browse link, no cancel button', () => {
    const membership = makeMembership({ status: 'failed' })
    render(<MembershipManagePanel membership={membership} />)
    expect(screen.getByText('Payment Failed')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /browse memberships/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /cancel/i }),
    ).not.toBeInTheDocument()
  })

  it('shows blocked state with contact support text, no CTA', () => {
    const membership = makeMembership({ status: 'blocked' })
    render(<MembershipManagePanel membership={membership} />)
    expect(screen.getByText('Account Restricted')).toBeInTheDocument()
    expect(screen.getByText(/contact support/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /manage billing/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /cancel/i }),
    ).not.toBeInTheDocument()
  })

  it('shows "(Tier no longer available)" when tier is null but status is active', () => {
    const membership = makeMembership({ tier: null })
    render(<MembershipManagePanel membership={membership} />)
    expect(screen.getByText('(Tier no longer available)')).toBeInTheDocument()
  })

  it('shows inline error for 404 response when Manage Billing is clicked', async () => {
    const user = userEvent.setup()
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    const membership = makeMembership({
      status: 'active',
      paymentMethod: 'stripe',
      tier: makeTier({ paymentType: 'subscription' }),
    })
    render(<MembershipManagePanel membership={membership} />)

    await user.click(screen.getByRole('button', { name: /manage billing/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No active subscription found.',
      ),
    )
  })

  it('shows info notice when portalReturned=true and dismisses on click', async () => {
    const user = userEvent.setup()
    const membership = makeMembership()
    render(<MembershipManagePanel membership={membership} portalReturned />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(
      screen.getByText(/subscription settings have been updated/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows up to 4 access patterns and "+ N more" button to expand', async () => {
    const user = userEvent.setup()
    const patterns = [
      '/courses/a/**',
      '/courses/b/**',
      '/courses/c/**',
      '/courses/d/**',
      '/courses/e/**',
      '/courses/f/**',
    ]
    const membership = makeMembership({
      tier: makeTier({ contentAccessPatterns: patterns }),
    })
    render(<MembershipManagePanel membership={membership} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(screen.getByText(/\+ 2 more/i)).toBeInTheDocument()

    await user.click(screen.getByText(/\+ 2 more/i))
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.queryByText(/more/i)).not.toBeInTheDocument()
  })

  it('opens cancel dialog when Cancel Membership is clicked for free tier', async () => {
    const user = userEvent.setup()
    const membership = makeMembership({
      status: 'active',
      paymentMethod: 'free',
      tier: makeTier({ paymentType: 'free', name: 'Starter' }),
    })
    render(<MembershipManagePanel membership={membership} />)

    await user.click(screen.getByRole('button', { name: /cancel membership/i }))
    expect(
      screen.getByText(/are you sure you want to cancel/i),
    ).toBeInTheDocument()
  })
})
