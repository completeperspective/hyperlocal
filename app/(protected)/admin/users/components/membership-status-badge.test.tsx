import { render, screen } from '@testing-library/react'
import { MembershipStatusBadge } from './membership-status-badge'

describe('MembershipStatusBadge', () => {
  it('renders "Active" for active status', () => {
    render(<MembershipStatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders "Pending" for pending status', () => {
    render(<MembershipStatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders "Expired" for expired status', () => {
    render(<MembershipStatusBadge status="expired" />)
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('renders "Failed" for failed status', () => {
    render(<MembershipStatusBadge status="failed" />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('renders "Blocked" for blocked status', () => {
    render(<MembershipStatusBadge status="blocked" />)
    expect(screen.getByText('Blocked')).toBeInTheDocument()
  })

  it('applies text-positive class for active status', () => {
    const { container } = render(<MembershipStatusBadge status="active" />)
    expect(container.firstChild).toHaveClass('text-positive')
  })

  it('applies text-destructive class for blocked status', () => {
    const { container } = render(<MembershipStatusBadge status="blocked" />)
    expect(container.firstChild).toHaveClass('text-destructive')
  })

  it('accepts an additional className', () => {
    const { container } = render(
      <MembershipStatusBadge status="active" className="extra-class" />,
    )
    expect(container.firstChild).toHaveClass('extra-class')
  })
})
