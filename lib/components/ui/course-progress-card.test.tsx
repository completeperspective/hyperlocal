import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CourseProgressStats } from '@/types/course'
import { CourseProgressCard } from './course-progress-card'

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

const base: CourseProgressStats = {
  courseId: 'c1',
  courseTitle: 'Learn TypeScript',
  courseSlug: 'learn-typescript',
  courseStatus: 'published',
  totalLessons: 10,
  lessonsViewed: 5,
  lessonsCompleted: 3,
  completionPercent: 30,
  lastAccessedAt: null,
  enrollmentStatus: 'in_progress',
  continueLessonSlug: 'lesson-4',
}

describe('CourseProgressCard', () => {
  it('renders in-progress card with correct stats and Continue CTA', () => {
    render(<CourseProgressCard stats={base} />)

    expect(screen.getByText('Learn TypeScript')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('3 / 10 lessons')).toBeInTheDocument()
    expect(screen.getByText('30% complete')).toBeInTheDocument()

    const cta = screen.getByRole('link', { name: 'Continue' })
    expect(cta).toHaveAttribute('href', '/courses/learn-typescript/lesson-4')
  })

  it('shows "Not Started" badge and "Start Course" CTA when no lessons completed', () => {
    render(
      <CourseProgressCard
        stats={{ ...base, lessonsCompleted: 0, enrollmentStatus: 'enrolled' }}
      />,
    )

    expect(screen.getByText('Not Started')).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: 'Start Course' })
    expect(cta).toHaveAttribute('href', '/courses/learn-typescript')
  })

  it('shows "Completed" badge when completionPercent is 100', () => {
    render(
      <CourseProgressCard
        stats={{
          ...base,
          lessonsCompleted: 10,
          completionPercent: 100,
          enrollmentStatus: 'completed',
        }}
      />,
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('falls back to course root href when continueLessonSlug is null', () => {
    render(<CourseProgressCard stats={{ ...base, continueLessonSlug: null }} />)

    const cta = screen.getByRole('link', { name: 'Continue' })
    expect(cta).toHaveAttribute('href', '/courses/learn-typescript')
  })

  it('renders last accessed date when provided', () => {
    render(
      <CourseProgressCard
        stats={{ ...base, lastAccessedAt: '2026-05-01T00:00:00.000Z' }}
      />,
    )

    expect(screen.getByText(/Last accessed/)).toBeInTheDocument()
  })

  it('omits last accessed section when null', () => {
    render(<CourseProgressCard stats={{ ...base, lastAccessedAt: null }} />)

    expect(screen.queryByText(/Last accessed/)).not.toBeInTheDocument()
  })
})
