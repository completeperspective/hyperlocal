import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CourseListItem } from '@/types/course'
import { CourseTableSection } from './course-table-section'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const mockItems: CourseListItem[] = [
  {
    id: '1',
    title: 'Intro to TypeScript',
    slug: 'intro-to-typescript',
    status: 'published',
    heroEnabled: true,
    chapterCount: 4,
  },
  {
    id: '2',
    title: 'Advanced React',
    slug: 'advanced-react',
    status: 'draft',
    heroEnabled: false,
    chapterCount: 0,
  },
]

describe('CourseTableSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders rows from props', () => {
    render(<CourseTableSection items={mockItems} />)
    expect(screen.getAllByText('Intro to TypeScript').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Advanced React').length).toBeGreaterThan(0)
  })

  it('renders Hero On/Off badge correctly', () => {
    render(<CourseTableSection items={mockItems} />)
    // heroEnabled: true → "On" badge
    expect(screen.getAllByText(/On/).length).toBeGreaterThan(0)
    // heroEnabled: false → "Off" badge
    expect(screen.getAllByText(/Off/).length).toBeGreaterThan(0)
  })

  it('shows chapter count', () => {
    render(<CourseTableSection items={mockItems} />)
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })

  it('shows empty state when no items', () => {
    render(<CourseTableSection items={[]} />)
    expect(
      screen.getByText('No courses yet. Create your first course.'),
    ).toBeInTheDocument()
  })

  it('opens create dialog when New Course is clicked', () => {
    render(<CourseTableSection items={mockItems} />)
    fireEvent.click(screen.getByRole('button', { name: 'New Course' }))
    expect(screen.getByText('Create a new course.')).toBeInTheDocument()
  })

  // Edge: delete button opens delete dialog
  it('opens delete dialog on delete button click', () => {
    render(<CourseTableSection items={[mockItems[0]]} />)
    const deleteBtn = screen.getAllByLabelText('Delete Intro to TypeScript')
    fireEvent.click(deleteBtn[0])
    expect(screen.getAllByText('Delete course').length).toBeGreaterThan(0)
  })
})
