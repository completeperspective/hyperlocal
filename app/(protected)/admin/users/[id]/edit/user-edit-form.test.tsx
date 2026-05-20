import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserDetail } from '@/types/users-admin'
import { UserEditForm } from './user-edit-form'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

const mockUser: UserDetail = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  mobile: null,
  isAdmin: false,
  walletAddress: null,
  profile: {
    nickname: 'tester',
    location: null,
    description: null,
    isPublic: false,
    contactPreference: null,
    imageUrl: null,
  },
  membership: null,
  learnerProfile: null,
}

describe('UserEditForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('happy path — account: submits PATCH with name, email, mobile', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updated: true }),
    })

    render(<UserEditForm user={mockUser} />)

    const emailInput = screen.getByLabelText(/^email$/i)
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })

    const accountForm = emailInput.closest('form')!
    fireEvent.submit(accountForm)

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/admin/users/${mockUser.id}`,
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"email":"new@example.com"'),
        }),
      ),
    )
  })

  it('happy path — password: submits PATCH with newPassword', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ updated: true }),
    })

    render(<UserEditForm user={mockUser} />)

    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword123')
    await user.type(
      screen.getByLabelText(/confirm password/i),
      'newpassword123',
    )
    await user.click(screen.getByRole('button', { name: /set password/i }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/admin/users/${mockUser.id}`,
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"newPassword":"newpassword123"'),
        }),
      ),
    )
  })

  it('failure — profile save: shows error alert when PATCH returns 500', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    })

    render(<UserEditForm user={mockUser} />)

    const nicknameInput = screen.getByLabelText(/nickname/i)
    fireEvent.change(nicknameInput, { target: { value: 'updated' } })

    const profileForm = nicknameInput.closest('form')!
    fireEvent.submit(profileForm)

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(
        alerts.some((el) => el.textContent?.includes('Internal server error')),
      ).toBe(true)
    })
  })
})
