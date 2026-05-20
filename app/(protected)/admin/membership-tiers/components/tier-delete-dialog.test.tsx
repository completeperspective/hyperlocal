import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { TierRow } from '@/types/membership-tiers-admin'
import { TierDeleteDialog } from './tier-delete-dialog'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const makeTier = (overrides: Partial<TierRow> = {}): TierRow => ({
  id: 'tier-1',
  name: 'Pro',
  description: 'Pro plan',
  priceInCents: 999,
  currency: 'usd',
  paymentType: 'subscription',
  recurringInterval: 'month',
  isActive: true,
  stripeProductId: null,
  stripePriceId: null,
  memberCount: 0,
  contentAccessPatterns: [],
  ...overrides,
})

const noop = () => {}

describe('TierDeleteDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls DELETE and triggers onSuccess on 204 response', async () => {
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 204,
      json: async () => ({}),
    } as Response)

    render(
      <TierDeleteDialog
        open={true}
        tier={makeTier()}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete tier' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/admin/membership-tiers/tier-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('shows warning and no confirm button when memberCount > 0', () => {
    render(
      <TierDeleteDialog
        open={true}
        tier={makeTier({ memberCount: 3 })}
        onClose={noop}
        onSuccess={noop}
      />,
    )

    // The text is split across elements by <strong>3</strong>; match on the <p> description element
    expect(
      screen.getByText((_, element) => {
        if (element?.tagName !== 'P') return false
        const text = element.textContent ?? ''
        return (
          text.includes('3') &&
          text.includes('active member(s) and cannot be deleted')
        )
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Delete tier' }),
    ).not.toBeInTheDocument()
    // Radix Dialog also renders an sr-only X "Close" button; use getAllByRole and check count
    expect(
      screen.getAllByRole('button', { name: 'Close' }).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('shows Stripe error message on 502 response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 502,
      json: async () => ({
        message: 'Stripe cleanup failed. Tier not deleted.',
      }),
    } as Response)

    render(
      <TierDeleteDialog
        open={true}
        tier={makeTier()}
        onClose={noop}
        onSuccess={noop}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete tier' }))

    await waitFor(() => {
      expect(
        screen.getByText('Stripe cleanup failed. Tier not deleted.'),
      ).toBeInTheDocument()
    })
  })

  // Content rules warning
  it('shows content rules count in description when tier has patterns', () => {
    render(
      <TierDeleteDialog
        open={true}
        tier={makeTier({
          contentAccessPatterns: ['/courses/**', '/pages/about'],
        })}
        onClose={noop}
        onSuccess={noop}
      />,
    )
    expect(screen.getByText(/2 content access rules/i)).toBeInTheDocument()
  })

  it('uses singular "rule" when there is exactly 1 content pattern', () => {
    render(
      <TierDeleteDialog
        open={true}
        tier={makeTier({ contentAccessPatterns: ['/courses/**'] })}
        onClose={noop}
        onSuccess={noop}
      />,
    )
    // Should say "1 content access rule" (not "rules")
    expect(screen.getByText(/1 content access rule[^s]/i)).toBeInTheDocument()
  })

  it('does not show content rules message when patterns array is empty', () => {
    render(
      <TierDeleteDialog
        open={true}
        tier={makeTier()}
        onClose={noop}
        onSuccess={noop}
      />,
    )
    expect(screen.queryByText(/content access rule/i)).not.toBeInTheDocument()
  })
})
