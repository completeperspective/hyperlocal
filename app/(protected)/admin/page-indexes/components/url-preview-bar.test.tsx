import { act, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UrlPreviewBar } from './url-preview-bar'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  server.use(
    http.get('/api/v1/admin/page-indexes/check-path', () =>
      HttpResponse.json({ ok: true }),
    ),
  )
})

afterEach(() => {
  vi.useRealTimers()
})

describe('UrlPreviewBar', () => {
  it('shows empty state when no basePath or slug provided', () => {
    render(<UrlPreviewBar basePath="" slug="" />)
    expect(
      screen.getByText('Enter a base path and slug above'),
    ).toBeInTheDocument()
  })

  it('renders URL segment pills when slug is provided', () => {
    render(<UrlPreviewBar basePath="docs/v2" slug="guide" />)
    expect(screen.getByText('docs')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('guide')).toBeInTheDocument()
    expect(screen.getByText('[page-slug]')).toBeInTheDocument()
  })

  it('shows reserved error synchronously for reserved prefixes', () => {
    const onValidationChange = vi.fn()
    render(
      <UrlPreviewBar
        basePath=""
        slug="admin"
        onValidationChange={onValidationChange}
      />,
    )
    expect(
      screen.getByText(/"admin" is a reserved platform path./),
    ).toBeInTheDocument()
    expect(onValidationChange).toHaveBeenCalledWith(false)
  })

  it('shows valid state after debounce when API returns ok', async () => {
    const onValidationChange = vi.fn()
    render(
      <UrlPreviewBar
        basePath="docs"
        slug="my-guide"
        onValidationChange={onValidationChange}
      />,
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(screen.getByText('Path is available')).toBeInTheDocument()
    })
    expect(onValidationChange).toHaveBeenCalledWith(true)
  })

  it('shows collision error when API returns conflict', async () => {
    server.use(
      http.get('/api/v1/admin/page-indexes/check-path', () =>
        HttpResponse.json({
          ok: false,
          type: 'collision',
          error: 'A page index already exists at "docs/my-guide".',
        }),
      ),
    )

    render(<UrlPreviewBar basePath="docs" slug="my-guide" />)

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    await waitFor(() => {
      expect(
        screen.getByText('A page index already exists at "docs/my-guide".'),
      ).toBeInTheDocument()
    })
  })

  // Edge case: only slug, no basePath
  it('renders segments with no basePath', () => {
    render(<UrlPreviewBar basePath="" slug="blog" />)
    expect(screen.getByText('blog')).toBeInTheDocument()
    expect(screen.getByText('[page-slug]')).toBeInTheDocument()
  })
})
