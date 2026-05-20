import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CancelMembershipDialog } from './cancel-membership-dialog'

describe('CancelMembershipDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    tierName: 'Pro',
    onConfirm: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    defaultProps.onOpenChange = vi.fn()
    defaultProps.onConfirm = vi.fn().mockResolvedValue(undefined)
  })

  it('renders dialog content when open=true', () => {
    render(<CancelMembershipDialog {...defaultProps} />)
    expect(
      screen.getByRole('heading', { name: /cancel membership/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Pro/)).toBeInTheDocument()
  })

  it('does not render dialog content when open=false', () => {
    render(<CancelMembershipDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Cancel membership')).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when "Keep membership" is clicked', async () => {
    const user = userEvent.setup()
    render(<CancelMembershipDialog {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /keep membership/i }))
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onConfirm and shows loading state when confirm is clicked', async () => {
    const user = userEvent.setup()
    let resolveConfirm!: () => void
    const onConfirm = vi.fn().mockReturnValue(
      new Promise<void>((res) => {
        resolveConfirm = res
      }),
    )
    render(<CancelMembershipDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(
      screen.getByRole('button', { name: /^cancel membership$/i }),
    )
    expect(screen.getByText('Cancelling…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelling/i })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(onConfirm).toHaveBeenCalled()

    resolveConfirm()
  })

  it('shows inline error when onConfirm rejects', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockRejectedValue(new Error('Server error'))
    render(<CancelMembershipDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(
      screen.getByRole('button', { name: /^cancel membership$/i }),
    )

    await waitFor(() =>
      expect(screen.getByText('Server error')).toBeInTheDocument(),
    )
  })

  it('re-enables buttons after failure', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockRejectedValue(new Error('fail'))
    render(<CancelMembershipDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(
      screen.getByRole('button', { name: /^cancel membership$/i }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /cancel membership/i }),
      ).not.toBeDisabled(),
    )
  })
})
