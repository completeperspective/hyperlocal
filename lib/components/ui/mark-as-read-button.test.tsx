import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { LessonProgressProvider } from '@/components/providers/lesson-progress-provider'
import { server } from '../../../__tests__/mocks/server'
import { MarkAsReadButton } from './mark-as-read-button'

function makeWrapper(initialCompletedAt: string | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LessonProgressProvider
          courseSlug="my-course"
          pageSlug="lesson-1"
          initialCompletedAt={initialCompletedAt}
        >
          {children}
        </LessonProgressProvider>
      </QueryClientProvider>
    )
  }
}

describe('MarkAsReadButton', () => {
  it('renders "Mark as Complete" when not complete', () => {
    render(<MarkAsReadButton />, { wrapper: makeWrapper() })
    expect(
      screen.getByRole('button', { name: 'Mark as Complete' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument()
  })

  it('renders "Completed — Mark as Incomplete" when already complete', () => {
    render(<MarkAsReadButton />, {
      wrapper: makeWrapper('2026-05-01T00:00:00.000Z'),
    })
    expect(
      screen.getByRole('button', { name: /Completed — Mark as Incomplete/ }),
    ).toBeInTheDocument()
  })

  it('toggles to completed state on click', async () => {
    const completedAt = '2026-05-05T12:00:00.000Z'
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.json({ completedAt }),
      ),
    )

    render(<MarkAsReadButton />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Complete' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Completed — Mark as Incomplete/ }),
      ).toBeInTheDocument()
    })
  })

  it('shows error message when API returns 500', async () => {
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.json({ message: 'Internal error' }, { status: 500 }),
      ),
    )

    render(<MarkAsReadButton />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Complete' }))

    await waitFor(() => {
      expect(screen.getByText('Internal error')).toBeInTheDocument()
    })
  })

  it('reverts to "Mark as Complete" when API returns completedAt: null', async () => {
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.json({ completedAt: null }),
      ),
    )

    render(<MarkAsReadButton />, {
      wrapper: makeWrapper('2026-05-01T00:00:00.000Z'),
    })
    fireEvent.click(
      screen.getByRole('button', { name: /Completed — Mark as Incomplete/ }),
    )

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Mark as Complete' }),
      ).toBeInTheDocument()
    })
  })
})

describe('MarkAsReadButton — compact mode', () => {
  it('renders an icon button with correct aria-label when not complete', () => {
    render(<MarkAsReadButton compact />, { wrapper: makeWrapper() })
    const btn = screen.getByRole('button', { name: 'Mark as Complete' })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('rounded-full')
  })

  it('shows "Mark as Incomplete" aria-label when already complete', () => {
    render(<MarkAsReadButton compact />, {
      wrapper: makeWrapper('2026-05-01T00:00:00.000Z'),
    })
    expect(
      screen.getByRole('button', { name: 'Mark as Incomplete' }),
    ).toBeInTheDocument()
  })

  it('calls the complete API and updates state when clicked', async () => {
    const completedAt = '2026-05-05T12:00:00.000Z'
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.json({ completedAt }),
      ),
    )
    render(<MarkAsReadButton compact />, { wrapper: makeWrapper() })
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Complete' }))
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Mark as Incomplete' }),
      ).toBeInTheDocument()
    })
  })

  it('renders without error when buttonVariant="default"', () => {
    render(<MarkAsReadButton compact buttonVariant="default" />, {
      wrapper: makeWrapper(),
    })
    expect(
      screen.getByRole('button', { name: 'Mark as Complete' }),
    ).toBeInTheDocument()
  })
})
