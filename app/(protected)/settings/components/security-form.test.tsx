import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SecurityForm } from './security-form'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

describe('SecurityForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('submits and shows success when all fields valid', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(<SecurityForm />)

    await user.type(screen.getByLabelText(/current password/i), 'oldpass1')
    await user.type(screen.getByLabelText(/^new password/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirm/i), 'newpass123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Password updated.'),
    )
  })

  it('disables submit when new password is too short', async () => {
    const user = userEvent.setup()

    render(<SecurityForm />)

    await user.type(screen.getByLabelText(/current password/i), 'oldpass1')
    await user.type(screen.getByLabelText(/^new password/i), 'short')
    await user.type(screen.getByLabelText(/confirm/i), 'short')

    expect(
      screen.getByRole('button', { name: /update password/i }),
    ).toBeDisabled()
  })

  it('shows mismatch error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<SecurityForm />)

    await user.type(screen.getByLabelText(/^new password/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirm/i), 'different1')

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Passwords do not match',
      ),
    )
  })

  it('shows error on wrong current password (401)', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Current password is incorrect' }),
    })

    render(<SecurityForm />)

    await user.type(screen.getByLabelText(/current password/i), 'wrongpass')
    await user.type(screen.getByLabelText(/^new password/i), 'newpass123')
    await user.type(screen.getByLabelText(/confirm/i), 'newpass123')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Current password is incorrect',
      ),
    )
  })
})
