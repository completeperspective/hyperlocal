import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MembershipTier } from '@/types/membership'
import { MembershipTierCard } from './membership-tier-card'

const freeTier: MembershipTier = {
  id: '1',
  name: 'Free',
  description: 'Basic access',
  priceInCents: 0,
  paymentType: 'free',
  stripeProductId: null,
  stripePriceId: null,
  isActive: true,
  contentAccessPatterns: [],
}

const paidTier: MembershipTier = {
  id: '2',
  name: 'Pro',
  description: 'Full access',
  priceInCents: 999,
  paymentType: 'one_time',
  stripeProductId: 'prod_test',
  stripePriceId: 'price_test',
  isActive: true,
  contentAccessPatterns: [],
}

describe('MembershipTierCard', () => {
  it('renders tier name and description', () => {
    render(
      <MembershipTierCard
        tier={freeTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
      />,
    )
    // Reason: "Free" appears as both the tier name (h3) and the price display (p),
    // so query by role + name to get the heading specifically.
    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument()
    expect(screen.getByText('Basic access')).toBeInTheDocument()
  })

  it('shows Active badge when isCurrentTier', () => {
    render(
      <MembershipTierCard
        tier={freeTier}
        isCurrentTier={true}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
      />,
    )
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows free CTA for $0 tier', () => {
    render(
      <MembershipTierCard
        tier={freeTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
      />,
    )
    expect(screen.getByText('Get Started (Free)')).toBeInTheDocument()
  })

  it('does not show Pay with Crypto when cryptoEnabled=false', () => {
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
      />,
    )
    expect(screen.queryByText('Pay with Crypto')).not.toBeInTheDocument()
  })

  it('shows Pay with Crypto when cryptoEnabled=true', () => {
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={true}
      />,
    )
    expect(screen.getByText('Pay with Crypto')).toBeInTheDocument()
  })

  it('hides CTAs when showCta is false', () => {
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={true}
        showCta={false}
      />,
    )
    expect(screen.queryByText('Pay with Card')).not.toBeInTheDocument()
    expect(screen.queryByText('Pay with Crypto')).not.toBeInTheDocument()
  })

  it('calls onSelectStripe with tier id on card click', async () => {
    const user = userEvent.setup()
    const onSelectStripe = vi.fn()
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={onSelectStripe}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
      />,
    )
    await user.click(screen.getByText('Pay with Card'))
    expect(onSelectStripe).toHaveBeenCalledWith('2')
  })
})

describe("MembershipTierCard — What's included section", () => {
  it('renders "What\'s included" section with translated labels when contentAccessPatterns is provided', () => {
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
        contentAccessPatterns={['/courses/**', '/pages/about']}
      />,
    )
    expect(screen.getByText("What's included")).toBeInTheDocument()
    expect(screen.getByText('All courses')).toBeInTheDocument()
    // /pages/about falls back to raw pattern (no translator match)
    expect(screen.getByText('/pages/about')).toBeInTheDocument()
  })

  it('does not render the section when contentAccessPatterns is empty', () => {
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
        contentAccessPatterns={[]}
      />,
    )
    expect(screen.queryByText("What's included")).not.toBeInTheDocument()
  })

  it('does not render the section when contentAccessPatterns is undefined', () => {
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
      />,
    )
    expect(screen.queryByText("What's included")).not.toBeInTheDocument()
  })

  it('renders "+ N more" expander button when there are more than 4 patterns', () => {
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
        contentAccessPatterns={[
          '/courses/**',
          '/pages/about',
          '/pages/contact',
          '/pages/faq',
          '/pages/pricing',
        ]}
      />,
    )
    expect(screen.getByText('+ 1 more')).toBeInTheDocument()
  })

  it('reveals all patterns when expander is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MembershipTierCard
        tier={paidTier}
        isCurrentTier={false}
        onSelectStripe={vi.fn()}
        onSelectCrypto={vi.fn()}
        cryptoEnabled={false}
        contentAccessPatterns={[
          '/courses/**',
          '/pages/about',
          '/pages/contact',
          '/pages/faq',
          '/pages/pricing',
        ]}
      />,
    )

    // 5th pattern should not be visible initially
    expect(screen.queryByText('/pages/pricing')).not.toBeInTheDocument()

    await user.click(screen.getByText('+ 1 more'))

    // Now all patterns should be visible
    expect(screen.getByText('/pages/pricing')).toBeInTheDocument()
    // Expander should no longer be shown
    expect(screen.queryByText('+ 1 more')).not.toBeInTheDocument()
  })
})
