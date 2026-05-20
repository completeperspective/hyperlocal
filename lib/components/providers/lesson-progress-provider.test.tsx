import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../../../__tests__/mocks/server'
import {
  LessonProgressProvider,
  useLessonProgress,
} from './lesson-progress-provider'

function TestConsumer() {
  const { isComplete, isPending, error, toggle } = useLessonProgress()
  return (
    <div>
      <span data-testid="status">{isComplete ? 'complete' : 'incomplete'}</span>
      <span data-testid="pending">{isPending ? 'pending' : 'idle'}</span>
      {error && <span data-testid="error">{error}</span>}
      <button onClick={toggle}>Toggle</button>
    </div>
  )
}

function PageSlugConsumer() {
  const { pageSlug } = useLessonProgress()
  return <span data-testid="slug">{pageSlug}</span>
}

function renderWithProvider(initialCompletedAt: string | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <LessonProgressProvider
        courseSlug="my-course"
        pageSlug="lesson-1"
        initialCompletedAt={initialCompletedAt}
      >
        <TestConsumer />
      </LessonProgressProvider>
    </QueryClientProvider>,
  )
}

describe('LessonProgressProvider', () => {
  it('initialises as incomplete when initialCompletedAt is null', () => {
    renderWithProvider(null)
    expect(screen.getByTestId('status')).toHaveTextContent('incomplete')
  })

  it('initialises as complete when initialCompletedAt has a value', () => {
    renderWithProvider('2026-05-01T00:00:00.000Z')
    expect(screen.getByTestId('status')).toHaveTextContent('complete')
  })

  it('optimistically marks complete on toggle and confirms from server', async () => {
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.json({ completedAt: '2026-05-05T12:00:00.000Z' }),
      ),
    )
    renderWithProvider(null)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('status')).toHaveTextContent('complete')
    await waitFor(() =>
      expect(screen.getByTestId('pending')).toHaveTextContent('idle'),
    )
    expect(screen.getByTestId('status')).toHaveTextContent('complete')
  })

  it('optimistically marks incomplete on toggle and confirms from server', async () => {
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.json({ completedAt: null }),
      ),
    )
    renderWithProvider('2026-05-01T00:00:00.000Z')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('status')).toHaveTextContent('incomplete')
    await waitFor(() =>
      expect(screen.getByTestId('pending')).toHaveTextContent('idle'),
    )
    expect(screen.getByTestId('status')).toHaveTextContent('incomplete')
  })

  it('rolls back to previous state when the API returns a 500', async () => {
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    )
    renderWithProvider(null)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('status')).toHaveTextContent('complete')
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('incomplete')
      expect(screen.getByTestId('error')).toHaveTextContent('Server error')
    })
  })

  it('rolls back on network failure', async () => {
    server.use(
      http.patch('/api/v1/courses/my-course/lessons/lesson-1/complete', () =>
        HttpResponse.error(),
      ),
    )
    renderWithProvider(null)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('incomplete')
      expect(screen.getByTestId('error')).toBeInTheDocument()
    })
  })

  it('returns safe inert defaults when used outside the provider', () => {
    render(<TestConsumer />)
    expect(screen.getByTestId('status')).toHaveTextContent('incomplete')
    expect(screen.getByTestId('pending')).toHaveTextContent('idle')
    expect(screen.queryByTestId('error')).not.toBeInTheDocument()
  })

  it('exposes the correct pageSlug via context', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <LessonProgressProvider
          courseSlug="c"
          pageSlug="the-slug"
          initialCompletedAt={null}
        >
          <PageSlugConsumer />
        </LessonProgressProvider>
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('slug')).toHaveTextContent('the-slug')
  })
})
