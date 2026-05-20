import { fireEvent, render, screen } from '@testing-library/react'
import { server } from '~/__tests__/mocks/server'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PageListItem } from '@/types/page'
import { PageTableSection } from './page-table-section'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}))

const mockItems: PageListItem[] = [
  {
    id: '1',
    title: 'About Us',
    slug: 'about-us',
    status: 'published',
    publishedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    status: 'draft',
    publishedAt: null,
  },
]

describe('PageTableSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.use(
      http.post('/api/v1/admin/pages', () =>
        HttpResponse.json({ id: '3', title: 'New Page', slug: 'new-page' }),
      ),
      http.delete('/api/v1/admin/pages/:id', () =>
        HttpResponse.json({ ok: true }),
      ),
    )
  })

  it('renders table rows from props showing title and slug', () => {
    render(<PageTableSection items={mockItems} />)
    expect(screen.getAllByText('About Us').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Privacy Policy').length).toBeGreaterThan(0)
    expect(screen.getAllByText('about-us').length).toBeGreaterThan(0)
    expect(screen.getAllByText('privacy-policy').length).toBeGreaterThan(0)
  })

  it('edit icon links to the detail page', () => {
    render(<PageTableSection items={[mockItems[0]]} />)
    const editButtons = screen.getAllByLabelText('Edit About Us')
    expect(editButtons.length).toBeGreaterThan(0)
    const titleLinks = screen.getAllByRole('link', { name: 'About Us' })
    expect(titleLinks[0]).toHaveAttribute('href', '/admin/content/pages/1')
  })

  it('delete icon opens the delete dialog', () => {
    render(<PageTableSection items={[mockItems[0]]} />)
    const deleteButtons = screen.getAllByLabelText('Delete About Us')
    fireEvent.click(deleteButtons[0])
    // Both the dialog title and confirm button contain "Delete page"
    expect(screen.getAllByText('Delete page').length).toBeGreaterThan(0)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('"New Page" button opens the create dialog', () => {
    render(<PageTableSection items={mockItems} />)
    fireEvent.click(screen.getByRole('button', { name: 'New Page' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByText('New Page', { selector: '[role="dialog"] *' }),
    ).toBeInTheDocument()
  })

  it('renders empty state when items is empty', () => {
    render(<PageTableSection items={[]} />)
    expect(
      screen.getByText('No pages yet. Create your first page.'),
    ).toBeInTheDocument()
  })
})
