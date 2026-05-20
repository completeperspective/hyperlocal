import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageIndexListItem } from '@/types/page-index'
import { PageIndexTableSection } from './page-index-table-section'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

const mockItems: PageIndexListItem[] = [
  {
    id: '1',
    title: 'Developer Docs',
    slug: 'developer-docs',
    basePath: 'docs',
    status: 'published',
    pageCount: 5,
  },
  {
    id: '2',
    title: 'API Reference',
    slug: 'api-reference',
    basePath: '',
    status: 'draft',
    pageCount: 0,
  },
]

describe('PageIndexTableSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the table with items', () => {
    render(<PageIndexTableSection items={mockItems} />)
    expect(screen.getAllByText('Developer Docs').length).toBeGreaterThan(0)
    expect(screen.getAllByText('API Reference').length).toBeGreaterThan(0)
  })

  it('shows URL paths for each item', () => {
    render(<PageIndexTableSection items={mockItems} />)
    // Developer Docs has basePath "docs"
    expect(screen.getAllByText('/docs/developer-docs').length).toBeGreaterThan(
      0,
    )
    // API Reference has no basePath
    expect(screen.getAllByText('/api-reference').length).toBeGreaterThan(0)
  })

  it('shows empty state when no items', () => {
    render(<PageIndexTableSection items={[]} />)
    expect(screen.getByText('No page indexes yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first index')).toBeInTheDocument()
  })

  it('opens create dialog when New Page Index is clicked', () => {
    render(<PageIndexTableSection items={mockItems} />)
    fireEvent.click(screen.getByRole('button', { name: 'New Page Index' }))
    // Dialog title appears alongside the button — verify at least 2 elements
    expect(screen.getAllByText('New Page Index').length).toBeGreaterThanOrEqual(
      2,
    )
  })

  // Edge case: published status renders default badge variant
  it('renders Published badge for published items', () => {
    render(<PageIndexTableSection items={[mockItems[0]]} />)
    expect(screen.getAllByText('Published').length).toBeGreaterThan(0)
  })

  // Failure case: delete button triggers dialog
  it('opens delete dialog on delete button click', () => {
    render(<PageIndexTableSection items={[mockItems[0]]} />)
    const deleteButtons = screen.getAllByLabelText('Delete Developer Docs')
    fireEvent.click(deleteButtons[0])
    expect(screen.getByText('Delete page index')).toBeInTheDocument()
  })
})
