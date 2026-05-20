import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteAccountSection } from './delete-account-dialog'

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('opens dialog and calls DELETE with password on confirm', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    // Reason: spy on window.location.href assignment to prevent jsdom navigation errors
    const locationSpy = vi
      .spyOn(window, 'location', 'get')
      .mockReturnValue({ href: '' } as Location)

    render(<DeleteAccountSection />)

    await user.click(screen.getByRole('button', { name: /delete my account/i }))
    await user.type(screen.getByLabelText(/current password/i), 'mypassword')
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/account/me',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ password: 'mypassword' }),
        }),
      ),
    )

    locationSpy.mockRestore()
  })

  it('disables Delete Account button when password is empty', async () => {
    const user = userEvent.setup()

    render(<DeleteAccountSection />)

    await user.click(screen.getByRole('button', { name: /delete my account/i }))

    expect(
      screen.getByRole('button', { name: /^delete account$/i }),
    ).toBeDisabled()
  })

  it('shows error when server returns 401', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Incorrect password' }),
    })

    render(<DeleteAccountSection />)

    await user.click(screen.getByRole('button', { name: /delete my account/i }))
    await user.type(screen.getByLabelText(/current password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /^delete account$/i }))

    await waitFor(() =>
      expect(screen.getByText('Incorrect password')).toBeDefined(),
    )
  })
})
