import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountForm } from './account-form'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

describe('AccountForm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls fetch with form values on submit and shows success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(
      <AccountForm
        initialValues={{ name: 'Adam', email: 'a@b.com', mobile: null }}
      />,
    )

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'New Name' },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: /save/i }).closest('form')!,
    )

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Changes saved.'),
    )
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/account/me',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('shows email-exists error on 409 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        message: 'An account with that email already exists.',
      }),
    })

    render(
      <AccountForm
        initialValues={{ name: null, email: 'taken@b.com', mobile: null }}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save/i }).closest('form')!,
    )

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'An account with that email already exists.',
      ),
    )
  })

  it('submits even when no field values have changed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    render(
      <AccountForm
        initialValues={{ name: 'Adam', email: 'a@b.com', mobile: null }}
      />,
    )

    fireEvent.submit(
      screen.getByRole('button', { name: /save/i }).closest('form')!,
    )

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })
})
