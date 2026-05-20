import { fireEvent, render, screen } from '@testing-library/react'
import type { TierRow } from '@/types/membership-tiers-admin'
import { TierTableSection } from './tier-table-section'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

// Stub dialogs to avoid full rendering complexity in table tests
vi.mock('./tier-form-dialog', () => ({
  TierFormDialog: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid="tier-form-dialog" data-mode={mode} /> : null,
}))

vi.mock('./tier-delete-dialog', () => ({
  TierDeleteDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="tier-delete-dialog" /> : null,
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
  stripeProductId: 'prod_abc123456789',
  stripePriceId: 'price_abc',
  memberCount: 5,
  contentAccessPatterns: [],
  ...overrides,
})

describe('TierTableSection', () => {
  it('renders table rows with tier data', () => {
    const tiers = [
      makeTier(),
      makeTier({
        id: 'tier-2',
        name: 'Basic',
        priceInCents: 0,
        paymentType: 'free',
        memberCount: 2,
      }),
    ]
    render(<TierTableSection tiers={tiers} />)
    // Dual-render (card + table) means each name appears twice
    expect(screen.getAllByText('Pro').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Basic').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$9.99').length).toBeGreaterThanOrEqual(1)
    // "Free" appears as both a payment type badge and in the price cell — use getAllByText
    expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(1)
    // truncateStripeId: 'prod_abc123456789'.slice(0,12) = 'prod_abc1234' + '…'
    // Both tiers share the same default stripeProductId in makeTier, so getAllByText
    expect(screen.getAllByText('prod_abc1234…').length).toBeGreaterThanOrEqual(
      1,
    )
  })

  it('renders empty state when tiers is empty', () => {
    render(<TierTableSection tiers={[]} />)
    expect(screen.getByText('No membership tiers yet')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create your first tier' }),
    ).toBeInTheDocument()
  })

  it('opens create dialog when New Tier button is clicked', () => {
    render(<TierTableSection tiers={[makeTier()]} />)
    const newTierBtn = screen.getByRole('button', { name: 'New Tier' })
    fireEvent.click(newTierBtn)
    expect(screen.getByTestId('tier-form-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('tier-form-dialog')).toHaveAttribute(
      'data-mode',
      'create',
    )
  })

  it('opens edit dialog when edit button is clicked', () => {
    render(<TierTableSection tiers={[makeTier()]} />)
    // Dual-render produces one button per render path; click the first
    const editBtn = screen.getAllByRole('button', { name: 'Edit Pro' })[0]
    fireEvent.click(editBtn)
    expect(screen.getByTestId('tier-form-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('tier-form-dialog')).toHaveAttribute(
      'data-mode',
      'edit',
    )
  })

  it('opens delete dialog when delete button is clicked', () => {
    render(<TierTableSection tiers={[makeTier()]} />)
    const deleteBtn = screen.getAllByRole('button', { name: 'Delete Pro' })[0]
    fireEvent.click(deleteBtn)
    expect(screen.getByTestId('tier-delete-dialog')).toBeInTheDocument()
  })
})
