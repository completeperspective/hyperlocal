import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserDeleteDialog } from './user-delete-dialog'

describe('UserDeleteDialog', () => {
  const baseProps = {
    userId: 'user-1',
    userEmail: 'test@example.com',
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the user email in the description', () => {
    render(<UserDeleteDialog {...baseProps} />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('renders the dialog title', () => {
    render(<UserDeleteDialog {...baseProps} />)
    expect(screen.getByText('Delete user account')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<UserDeleteDialog {...baseProps} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when Delete account is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<UserDeleteDialog {...baseProps} onConfirm={onConfirm} />)
    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('shows inline error when onConfirm rejects', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn().mockRejectedValue(new Error('Server error'))
    render(<UserDeleteDialog {...baseProps} onConfirm={onConfirm} />)
    await user.click(screen.getByRole('button', { name: 'Delete account' }))
    expect(await screen.findByText('Server error')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<UserDeleteDialog {...baseProps} open={false} />)
    expect(screen.queryByText('Delete user account')).not.toBeInTheDocument()
  })
})
