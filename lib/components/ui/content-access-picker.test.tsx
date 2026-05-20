import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { ContentAccessPicker } from './content-access-picker'
import type { ContentCatalog } from './content-access-picker'

const catalog: ContentCatalog = {
  courses: [
    { id: 'c1', slug: 'intro-to-web3', title: 'Intro to Web3' },
    { id: 'c2', slug: 'advanced-dev', title: 'Advanced Dev' },
  ],
  pages: [],
  pageIndexes: [
    {
      id: 'p1',
      slug: 'developer-docs',
      basePath: 'docs',
      title: 'Developer Docs',
    },
    { id: 'p2', slug: 'blog', basePath: '', title: 'Blog' },
  ],
}

function checkbox(name: string | RegExp) {
  return screen.getByRole('checkbox', { name })
}

describe('ContentAccessPicker', () => {
  it('renders catalog items when catalog prop is provided', () => {
    render(
      <ContentAccessPicker
        patterns={[]}
        onChange={vi.fn()}
        catalog={catalog}
      />,
    )
    expect(checkbox('All content')).toBeInTheDocument()
    expect(checkbox('All courses')).toBeInTheDocument()
    expect(checkbox('Intro to Web3')).toBeInTheDocument()
    expect(checkbox('Developer Docs')).toBeInTheDocument()
    expect(checkbox('Blog')).toBeInTheDocument()
  })

  it('checks "All content" when /** pattern is present', () => {
    render(
      <ContentAccessPicker
        patterns={['/**']}
        onChange={vi.fn()}
        catalog={catalog}
      />,
    )
    expect(checkbox('All content')).toBeChecked()
  })

  it('calls onChange with /** when All content is clicked', () => {
    const onChange = vi.fn()
    render(
      <ContentAccessPicker
        patterns={[]}
        onChange={onChange}
        catalog={catalog}
      />,
    )
    fireEvent.click(checkbox('All content'))
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['/**']))
  })

  it('adds specific course pattern when course checkbox clicked', () => {
    const onChange = vi.fn()
    render(
      <ContentAccessPicker
        patterns={[]}
        onChange={onChange}
        catalog={catalog}
      />,
    )
    fireEvent.click(checkbox('Intro to Web3'))
    expect(onChange).toHaveBeenCalledWith(['/courses/intro-to-web3/**'])
  })

  it('removes course pattern when already-checked course is unchecked', () => {
    const onChange = vi.fn()
    render(
      <ContentAccessPicker
        patterns={['/courses/intro-to-web3/**']}
        onChange={onChange}
        catalog={catalog}
      />,
    )
    fireEvent.click(checkbox('Intro to Web3'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('collapses individual courses into /courses/** when All courses clicked', () => {
    const onChange = vi.fn()
    render(
      <ContentAccessPicker
        patterns={['/courses/intro-to-web3/**']}
        onChange={onChange}
        catalog={catalog}
      />,
    )
    fireEvent.click(checkbox('All courses'))
    const result: string[] = onChange.mock.calls[0][0]
    expect(result).toContain('/courses/**')
    expect(result).not.toContain('/courses/intro-to-web3/**')
  })

  it('adds page index pattern with basePath', () => {
    const onChange = vi.fn()
    render(
      <ContentAccessPicker
        patterns={[]}
        onChange={onChange}
        catalog={catalog}
      />,
    )
    fireEvent.click(checkbox('Developer Docs'))
    expect(onChange).toHaveBeenCalledWith(['/docs/developer-docs/**'])
  })

  it('adds page index pattern without basePath', () => {
    const onChange = vi.fn()
    render(
      <ContentAccessPicker
        patterns={[]}
        onChange={onChange}
        catalog={catalog}
      />,
    )
    fireEvent.click(checkbox('Blog'))
    expect(onChange).toHaveBeenCalledWith(['/blog/**'])
  })

  // Edge case: fetches catalog from API when no catalog prop
  it('fetches catalog from API when catalog prop is not provided', async () => {
    server.use(
      http.get('/api/v1/admin/content-catalog', () =>
        HttpResponse.json({
          courses: [
            { id: 'c3', slug: 'fetched-course', title: 'Fetched Course' },
          ],
          pages: [],
          pageIndexes: [],
        }),
      ),
    )
    render(<ContentAccessPicker patterns={[]} onChange={vi.fn()} />)
    await waitFor(() => {
      expect(checkbox('Fetched Course')).toBeInTheDocument()
    })
  })

  // Failure case: shows no-patterns message when patterns is empty
  it('shows no-patterns message when patterns array is empty', () => {
    render(
      <ContentAccessPicker
        patterns={[]}
        onChange={vi.fn()}
        catalog={catalog}
      />,
    )
    expect(
      screen.getByText(/no patterns — all membership content is accessible/i),
    ).toBeInTheDocument()
  })

  it('shows active patterns count in collapsible toggle', () => {
    render(
      <ContentAccessPicker
        patterns={['/courses/**', '/docs/developer-docs/**']}
        onChange={vi.fn()}
        catalog={catalog}
      />,
    )
    expect(screen.getByText('2 active patterns')).toBeInTheDocument()
  })
})
