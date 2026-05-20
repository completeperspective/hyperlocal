import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { ContentPanel } from './content-panel'

const ENDPOINT = '/api/v1/admin/page-indexes/abc123'

beforeEach(() => {
  server.use(http.patch(ENDPOINT, () => HttpResponse.json({ updated: true })))
})

describe('ContentPanel', () => {
  it('renders in markdown mode by default when no initial content', () => {
    render(<ContentPanel endpoint={ENDPOINT} />)
    expect(screen.getByText('Markdown')).toBeInTheDocument()
    expect(screen.getByText(/Paste Markdown/)).toBeInTheDocument()
  })

  it('detects HTML mode when initialTrustedHtml starts with <', () => {
    render(
      <ContentPanel endpoint={ENDPOINT} initialTrustedHtml="<p>Hello</p>" />,
    )
    expect(screen.getByText(/Paste raw HTML5/)).toBeInTheDocument()
  })

  it('detects markdown mode when initialTrustedHtml does not start with <', () => {
    render(<ContentPanel endpoint={ENDPOINT} initialTrustedHtml="# Title" />)
    expect(screen.getByText(/Paste Markdown/)).toBeInTheDocument()
  })

  it('switches to HTML mode when HTML button is clicked', () => {
    render(<ContentPanel endpoint={ENDPOINT} />)
    fireEvent.click(screen.getByRole('button', { name: 'HTML' }))
    expect(screen.getByText(/Paste raw HTML5/)).toBeInTheDocument()
  })

  it('switches back to Markdown mode when Markdown button is clicked', () => {
    render(<ContentPanel endpoint={ENDPOINT} initialTrustedHtml="<p>hi</p>" />)
    fireEvent.click(screen.getByRole('button', { name: 'Markdown' }))
    expect(screen.getByText(/Paste Markdown/)).toBeInTheDocument()
  })

  it('populates CSS textarea from initialCustomCss', () => {
    render(
      <ContentPanel
        endpoint={ENDPOINT}
        initialCustomCss=".foo { color: red; }"
      />,
    )
    const cssArea = screen.getByLabelText('Custom CSS') as HTMLTextAreaElement
    expect(cssArea.value).toBe('.foo { color: red; }')
  })

  // Edge case: empty content saves null
  it('calls PATCH with updated: true on success', async () => {
    render(<ContentPanel endpoint={ENDPOINT} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save Content' }))
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument())
  })

  // Failure case: shows error on API failure
  it('shows error message when API returns an error', async () => {
    server.use(
      http.patch(ENDPOINT, () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 }),
      ),
    )
    render(<ContentPanel endpoint={ENDPOINT} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save Content' }))
    await waitFor(() =>
      expect(screen.getByText('Server error')).toBeInTheDocument(),
    )
  })
})
