import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditProfileForm } from './edit-profile-form'

// useRouter mock
const mockRefresh = vi.fn()
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

describe('EditProfileForm', () => {
  it('renders all three fields', () => {
    render(<EditProfileForm />)
    expect(screen.getByLabelText(/nickname/i)).toBeDefined()
    expect(screen.getByLabelText(/bio/i)).toBeDefined()
    expect(screen.getByLabelText(/location/i)).toBeDefined()
  })

  it('submits PATCH request with correct body', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(
      <EditProfileForm
        initialValues={{
          nickname: 'swift-fox',
          description: 'hi',
          location: 'Earth',
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/account/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            nickname: 'swift-fox',
            description: 'hi',
            location: 'Earth',
          }),
        }),
      )
    })
  })

  it('shows success state on 200 response', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(<EditProfileForm />)
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(screen.getByText(/profile updated/i)).toBeDefined()
    })
  })

  it('shows error state on non-200 response', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Server error' }),
    })

    render(<EditProfileForm />)
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeDefined()
    })
  })
})
