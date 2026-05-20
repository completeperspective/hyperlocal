import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CourseChapter, CoursePage } from '@/types/course'
import { CourseTOC } from './course-toc'

const makeChapter = (
  id: string,
  title: string,
  pages: CoursePage[],
): CourseChapter => ({
  id,
  title,
  sortOrder: 1,
  pages,
})

const makePage = (id: string, title: string, slug: string): CoursePage => ({
  id,
  title,
  slug,
  status: 'published',
})

const chapter1 = makeChapter('ch1', 'Project Foundation', [
  makePage('p1', 'Create Project', '01-create-project'),
  makePage('p2', 'Project Tooling', '02-project-tooling'),
])

const chapter2 = makeChapter('ch2', 'Backend & Data Layer', [
  makePage('p3', 'Keystone Auth', '03-keystone-auth'),
])

const directPages: CoursePage[] = [
  makePage('dp1', 'Bonus Content', 'bonus-content'),
]

describe('CourseTOC', () => {
  it('renders chapters with titles, badges, and page links', () => {
    render(
      <CourseTOC
        title="My Course"
        chapters={[chapter1, chapter2]}
        pages={[]}
        courseSlug="test-course"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'My Course' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /Project Foundation/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /Backend & Data Layer/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Chapter 1')).toBeInTheDocument()
    expect(screen.getByText('Chapter 2')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Create Project' }),
    ).toHaveAttribute('href', '/courses/test-course/01-create-project')
    expect(
      screen.getByRole('link', { name: 'Project Tooling' }),
    ).toHaveAttribute('href', '/courses/test-course/02-project-tooling')
    expect(screen.getByRole('link', { name: 'Keystone Auth' })).toHaveAttribute(
      'href',
      '/courses/test-course/03-keystone-auth',
    )
  })

  it('renders direct pages as a list with correct hrefs when no chapters', () => {
    render(
      <CourseTOC
        title="Flat Course"
        chapters={[]}
        pages={directPages}
        courseSlug="test-course"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Flat Course' }),
    ).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Bonus Content' })
    expect(link).toHaveAttribute('href', '/courses/test-course/bonus-content')

    expect(
      screen.queryByRole('heading', { name: 'Additional Pages' }),
    ).not.toBeInTheDocument()
  })

  it('shows "Additional Pages" heading when chapters and direct pages coexist', () => {
    render(
      <CourseTOC
        title="Mixed Course"
        chapters={[chapter1]}
        pages={directPages}
        courseSlug="test-course"
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Additional Pages' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Bonus Content' }),
    ).toBeInTheDocument()
  })

  it('does not show "Additional Pages" heading when only chapters exist (no direct pages)', () => {
    render(
      <CourseTOC
        title="Chapters Only"
        chapters={[chapter1]}
        pages={[]}
        courseSlug="test-course"
      />,
    )

    expect(
      screen.queryByRole('heading', { name: 'Additional Pages' }),
    ).not.toBeInTheDocument()
  })

  it('renders dynamic subtitle with correct lesson and chapter counts', () => {
    render(
      <CourseTOC
        title="My Course"
        chapters={[chapter1, chapter2]}
        pages={[]}
        courseSlug="test-course"
      />,
    )

    // chapter1 has 2 pages, chapter2 has 1 page → 3 lessons, 2 chapters
    expect(screen.getByText(/Table of Contents/)).toBeInTheDocument()
    expect(screen.getByText(/3 Lessons/)).toBeInTheDocument()
    expect(screen.getByText(/2 Chapters/)).toBeInTheDocument()
  })

  it('does not render subtitle when course has no chapters or pages', () => {
    render(
      <CourseTOC
        title="Empty Course"
        chapters={[]}
        pages={[]}
        courseSlug="test-course"
      />,
    )

    expect(screen.queryByText(/Table of Contents/)).not.toBeInTheDocument()
  })

  it('renders the title but no table or list content when both are empty', () => {
    render(
      <CourseTOC
        title="Empty Course"
        chapters={[]}
        pages={[]}
        courseSlug="test-course"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Empty Course' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders zero-padded lesson numbers in chapter tables', () => {
    render(
      <CourseTOC
        title="Numbered Lessons"
        chapters={[chapter1]}
        pages={[]}
        courseSlug="test-course"
      />,
    )

    const rows = screen.getAllByRole('row')
    const bodyRows = rows.slice(1)
    expect(within(bodyRows[0]).getByText('01')).toBeInTheDocument()
    expect(within(bodyRows[1]).getByText('02')).toBeInTheDocument()
  })

  it('shows checkmark for completed page when progressMap provided', () => {
    const progressMap = {
      '01-create-project': {
        id: 'prog1',
        userId: 'u1',
        courseId: 'c1',
        pageId: 'p1',
        viewCount: 1,
        firstViewedAt: null,
        lastViewedAt: null,
        completedAt: '2026-05-01T00:00:00.000Z',
      },
    }
    render(
      <CourseTOC
        title="Progress Course"
        chapters={[chapter1]}
        pages={[]}
        courseSlug="test-course"
        progressMap={progressMap}
      />,
    )

    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('shows no checkmarks when progressMap not provided', () => {
    render(
      <CourseTOC
        title="No Progress"
        chapters={[chapter1]}
        pages={[]}
        courseSlug="test-course"
      />,
    )

    const svgs = document.querySelectorAll('svg')
    expect(svgs.length).toBe(0)
  })

  const lockedChapter = makeChapter('ch-locked', 'Locked Chapter', [
    {
      id: 'lp1',
      title: 'Members Only Lesson',
      slug: 'members-only',
      status: 'membership',
    },
    makePage('lp2', 'Public Lesson', 'public-lesson'),
  ])

  it('shows lock icon for non-published chapter page when unauthenticated', () => {
    render(
      <CourseTOC
        title="Gated Course"
        chapters={[lockedChapter]}
        pages={[]}
        courseSlug="gated"
        isAuthenticated={false}
      />,
    )

    const locks = screen.getAllByLabelText('Locked')
    expect(locks).toHaveLength(1)
  })

  it('shows no lock icon when user has an active membership', () => {
    render(
      <CourseTOC
        title="Gated Course"
        chapters={[lockedChapter]}
        pages={[]}
        courseSlug="gated"
        isAuthenticated={true}
        hasActiveMembership={true}
      />,
    )

    expect(screen.queryByLabelText('Locked')).not.toBeInTheDocument()
  })

  it('shows lock icon when hasActiveMembership is not provided (defaults to locked)', () => {
    render(
      <CourseTOC
        title="Gated Course"
        chapters={[lockedChapter]}
        pages={[]}
        courseSlug="gated"
      />,
    )

    const locks = screen.getAllByLabelText('Locked')
    expect(locks).toHaveLength(1)
  })
})
