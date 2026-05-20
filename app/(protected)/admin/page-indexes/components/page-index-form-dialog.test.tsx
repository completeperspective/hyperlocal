import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageIndexListItem } from '@/types/page-index'
import { PageIndexFormDialog } from './page-index-form-dialog'

const noop = vi.fn()

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // Default: path is available
  server.use(
    http.get('/api/v1/admin/page-indexes/check-path', () =>
      HttpResponse.json({ ok: true }),
    ),
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('PageIndexFormDialog', () => {
  it('renders create form when mode is create', () => {
    render(
      <PageIndexFormDialog
        open
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )
    expect(screen.getByText('New Page Index')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Slug')).toBeInTheDocument()
  })

  it('auto-generates slug from title', () => {
    render(
      <PageIndexFormDialog
        open
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'My Developer Docs' },
    })
    expect(screen.getByLabelText<HTMLInputElement>('Slug').value).toBe(
      'my-developer-docs',
    )
  })

  it('pre-fills form in edit mode', () => {
    const item: PageIndexListItem = {
      id: '1',
      title: 'Existing Index',
      slug: 'existing-index',
      basePath: 'docs',
      status: 'published',
      pageCount: 0,
    }
    render(
      <PageIndexFormDialog
        open
        mode="edit"
        item={item}
        onClose={noop}
        onSuccess={noop}
      />,
    )
    expect(screen.getByLabelText<HTMLInputElement>('Title').value).toBe(
      'Existing Index',
    )
    expect(screen.getByLabelText<HTMLInputElement>('Slug').value).toBe(
      'existing-index',
    )
  })

  // Edge case: submit button disabled until path validates
  it('disables submit button while path is not yet valid', () => {
    render(
      <PageIndexFormDialog
        open
        mode="create"
        onClose={noop}
        onSuccess={noop}
      />,
    )
    const submit = screen.getByRole('button', { name: /create index/i })
    expect(submit).toBeDisabled()
  })

  // Failure case: shows error message on API failure
  it('shows error when create API returns failure', async () => {
    const onSuccess = vi.fn()
    server.use(
      http.post('/api/v1/admin/page-indexes', () =>
        HttpResponse.json(
          { message: 'Something went wrong.' },
          { status: 500 },
        ),
      ),
    )

    render(
      <PageIndexFormDialog
        open
        mode="create"
        onClose={noop}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test' },
    })

    // Wait for the debounced check-path call to resolve and mark path valid
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await waitFor(() =>
      expect(screen.getByText('Path is available')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: /create index/i }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
