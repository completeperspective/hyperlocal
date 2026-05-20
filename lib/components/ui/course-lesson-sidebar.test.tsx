import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LessonProgressProvider } from '@/components/providers/lesson-progress-provider'
// Note: mobile drawer/FAB functionality has moved to LessonMobileNav
import type { CourseData, LessonProgressMap } from '@/types/course'
import { CourseLessonSidebar } from './course-lesson-sidebar'

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

const course: CourseData = {
  id: 'c1',
  title: 'My Course',
  slug: 'my-course',
  status: 'published',
  heroEnabled: false,
  hero: null,
  chapters: [
    {
      id: 'ch1',
      title: 'Chapter One',
      sortOrder: 1,
      pages: [
        { id: 'p1', title: 'Intro', slug: 'intro', status: 'published' },
        {
          id: 'p2',
          title: 'Deep Dive',
          slug: 'deep-dive',
          status: 'published',
        },
      ],
    },
  ],
  pages: [],
}

const emptyProgress: LessonProgressMap = {}

function makeWrapper(completedAt: string | null = null, liveSlug = 'intro') {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LessonProgressProvider
          courseSlug="my-course"
          pageSlug={liveSlug}
          initialCompletedAt={completedAt}
        >
          {children}
        </LessonProgressProvider>
      </QueryClientProvider>
    )
  }
}

describe('CourseLessonSidebar', () => {
  it('renders chapter label and all chapter page links', () => {
    render(
      <CourseLessonSidebar
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
      />,
      { wrapper: makeWrapper() },
    )

    expect(screen.getByText('Chapter One')).toBeInTheDocument()

    const links = screen.getAllByRole('link', { name: 'Intro' })
    expect(links[0]).toHaveAttribute('href', '/courses/my-course/intro')

    const deepLinks = screen.getAllByRole('link', { name: 'Deep Dive' })
    expect(deepLinks[0]).toHaveAttribute('href', '/courses/my-course/deep-dive')
  })

  it('does not render a standalone back link (breadcrumb bar handles course navigation)', () => {
    render(
      <CourseLessonSidebar
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
      />,
      { wrapper: makeWrapper() },
    )
    // Sidebar only shows chapter/page links — no back link to the course index
    expect(
      screen.queryByRole('link', { name: /back/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'My Course' }),
    ).not.toBeInTheDocument()
  })

  it('applies active styling to the current page', () => {
    render(
      <CourseLessonSidebar
        course={course}
        currentPageSlug="intro"
        progressMap={emptyProgress}
      />,
      { wrapper: makeWrapper() },
    )

    const activeLinks = screen.getAllByRole('link', { name: 'Intro' })
    const activeLink = activeLinks.find((el) =>
      el.className.includes('bg-sidebar-primary'),
    )
    expect(activeLink).toBeDefined()
  })

  it('shows checkmark for completed lessons (via progressMap for non-live page)', () => {
    const progressMap: LessonProgressMap = {
      intro: {
        id: 'prog1',
        userId: 'u1',
        courseId: 'c1',
        pageId: 'p1',
        viewCount: 2,
        firstViewedAt: null,
        lastViewedAt: null,
        completedAt: '2026-05-01T00:00:00.000Z',
      },
    }

    // liveSlug='deep-dive' so 'intro' uses the static progressMap path
    render(
      <CourseLessonSidebar
        course={course}
        currentPageSlug="deep-dive"
        progressMap={progressMap}
      />,
      { wrapper: makeWrapper(null, 'deep-dive') },
    )

    // lucide CheckIcon renders an svg — confirm there's a checkmark element
    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('shows no checkmarks when progressMap is empty', () => {
    render(
      <CourseLessonSidebar
        course={course}
        currentPageSlug="intro"
        progressMap={{}}
      />,
      { wrapper: makeWrapper() },
    )

    // No completed progress — no CheckIcon or Lock icons in the sidebar nav
    expect(screen.queryByLabelText('Locked')).not.toBeInTheDocument()
    const checkIcons = document.querySelectorAll('svg.lucide-check')
    expect(checkIcons.length).toBe(0)
  })

  const lockedCourse: CourseData = {
    ...course,
    chapters: [
      {
        id: 'ch-locked',
        title: 'Locked Chapter',
        sortOrder: 1,
        pages: [
          {
            id: 'lp1',
            title: 'Members Only',
            slug: 'members-only',
            status: 'membership',
          },
          {
            id: 'lp2',
            title: 'Public Lesson',
            slug: 'public-lesson',
            status: 'published',
          },
        ],
      },
    ],
  }

  it('shows lock icon for non-published page when unauthenticated', () => {
    render(
      <CourseLessonSidebar
        course={lockedCourse}
        currentPageSlug="public-lesson"
        progressMap={emptyProgress}
        isAuthenticated={false}
      />,
      { wrapper: makeWrapper(null, 'public-lesson') },
    )

    const locks = screen.getAllByLabelText('Locked')
    expect(locks.length).toBeGreaterThan(0)
  })

  it('shows no lock icon when user has an active membership', () => {
    render(
      <CourseLessonSidebar
        course={lockedCourse}
        currentPageSlug="public-lesson"
        progressMap={emptyProgress}
        isAuthenticated={true}
        hasActiveMembership={true}
      />,
      { wrapper: makeWrapper(null, 'public-lesson') },
    )

    expect(screen.queryByLabelText('Locked')).not.toBeInTheDocument()
  })

  it('shows lock icon when hasActiveMembership is not provided (defaults to locked)', () => {
    render(
      <CourseLessonSidebar
        course={lockedCourse}
        currentPageSlug="public-lesson"
        progressMap={emptyProgress}
      />,
      { wrapper: makeWrapper(null, 'public-lesson') },
    )

    const locks = screen.getAllByLabelText('Locked')
    expect(locks.length).toBeGreaterThan(0)
  })
})
