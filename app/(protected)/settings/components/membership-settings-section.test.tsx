import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MembershipSettingsSection } from './membership-settings-section'

vi.mock('@/ui/membership-manage-panel', () => ({
  MembershipManagePanel: ({
    membership,
    compact,
  }: {
    membership: unknown
    compact?: boolean
  }) => (
    <div data-testid="membership-manage-panel" data-compact={String(compact)}>
      {membership ? 'has-membership' : 'no-membership'}
    </div>
  ),
}))

describe('MembershipSettingsSection', () => {
  it('renders the section with "Membership" heading', () => {
    render(<MembershipSettingsSection membership={null} />)
    expect(
      screen.getByRole('heading', { name: /membership/i, level: 2 }),
    ).toBeInTheDocument()
  })

  it('renders MembershipManagePanel with compact=true', () => {
    render(<MembershipSettingsSection membership={null} />)
    const panel = screen.getByTestId('membership-manage-panel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('data-compact', 'true')
  })

  it('passes membership prop to MembershipManagePanel', () => {
    const membership = {
      id: '1',
      status: 'active',
      paymentMethod: 'free',
      tier: null,
      activatedAt: null,
      expiresAt: null,
    }
    render(<MembershipSettingsSection membership={membership as never} />)
    expect(screen.getByTestId('membership-manage-panel')).toHaveTextContent(
      'has-membership',
    )
  })

  it('has id="membership" for anchor navigation', () => {
    const { container } = render(
      <MembershipSettingsSection membership={null} />,
    )
    expect(container.querySelector('#membership')).toBeInTheDocument()
  })
})
