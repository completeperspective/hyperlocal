import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type {
  CourseData,
  LessonProgressMap,
  PageActionConfig,
} from '@/types/course'
import { LessonMobileNav } from './lesson-mobile-nav'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/ui/drawer', () => ({
  Drawer: ({
    children,
    open,
  }: {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => (
    <div data-testid="drawer" data-open={String(open)}>
      {children}
    </div>
  ),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drawer-content">{children}</div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}))

vi.mock('@/ui/course-lesson-sidebar', () => ({
  SidebarContent: () => <nav data-testid="sidebar-content">Sidebar</nav>,
}))

vi.mock('@/components/providers/lesson-progress-provider', () => ({
  useLessonProgress: () => ({
    isComplete: false,
    isPending: false,
    error: null,
    toggle: vi.fn(),
    pageSlug: 'intro',
  }),
}))

const course: CourseData = {
  id: 'c1',
  title: 'Test Course',
  slug: 'test-course',
  status: 'published',
  heroEnabled: false,
  hero: null,
  chapters: [],
  pages: [],
}

const emptyProgress: LessonProgressMap = {}

describe('LessonMobileNav', () => {
  it('renders the Contents button always', () => {
    render(
      <LessonMobileNav
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Open course navigation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Contents')).toBeInTheDocument()
  })

  it('renders Mark as Complete button when authenticated and mark-as-read action configured', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'mark-as-read',
        show: 'authenticated',
      },
    ]
    render(
      <LessonMobileNav
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
        isAuthenticated={true}
        actions={actions}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Mark as Complete' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Mark as Complete')).toBeInTheDocument()
  })

  it('hides Mark as Complete button when not authenticated', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'mark-as-read',
        show: 'authenticated',
      },
    ]
    render(
      <LessonMobileNav
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
        isAuthenticated={false}
        actions={actions}
      />,
    )
    expect(screen.queryByText('Mark as Complete')).not.toBeInTheDocument()
  })

  it('renders Downloads button when attachments present', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'download-attachments',
        attachments: [
          { id: 'a1', filename: 'doc.pdf', label: 'Doc' },
          { id: 'a2', filename: 'doc2.pdf', label: 'Doc 2' },
        ],
        show: 'public',
      },
    ]
    render(
      <LessonMobileNav
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
        actions={actions}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Download attachments' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Downloads')).toBeInTheDocument()
  })

  it('does not render Downloads button when attachments array is empty', () => {
    const actions: PageActionConfig[] = [
      {
        type: 'download-attachments',
        attachments: [],
        show: 'public',
      },
    ]
    render(
      <LessonMobileNav
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
        actions={actions}
      />,
    )
    expect(screen.queryByText('Downloads')).not.toBeInTheDocument()
    expect(screen.queryByText('Download')).not.toBeInTheDocument()
  })

  it('opens the sidebar drawer when Contents button is clicked', () => {
    render(
      <LessonMobileNav
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
      />,
    )
    const contentsBtn = screen.getByRole('button', {
      name: 'Open course navigation',
    })
    fireEvent.click(contentsBtn)
    const drawer = screen.getByTestId('drawer')
    expect(drawer).toHaveAttribute('data-open', 'true')
  })

  it('renders the bottom bar in translate-y-0 (visible) on initial render', () => {
    render(
      <LessonMobileNav
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
      />,
    )
    // The bottom bar div should contain translate-y-0 (visible on initial render)
    const bar = screen
      .getByRole('button', { name: 'Open course navigation' })
      .closest('div[class*="fixed"]')
    expect(bar?.className).toContain('translate-y-0')
  })
})
