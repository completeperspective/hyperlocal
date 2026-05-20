import Link from 'next/link'
import type { CourseProgressStats } from '@/types/course'

const STATUS_LABELS: Record<CourseProgressStats['enrollmentStatus'], string> = {
  enrolled: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_CLASSES: Record<CourseProgressStats['enrollmentStatus'], string> =
  {
    enrolled: 'bg-info/10 text-info',
    in_progress: 'bg-info/10 text-info',
    completed: 'bg-positive/10 text-positive',
  }

export function CourseProgressCard({ stats }: { stats: CourseProgressStats }) {
  const {
    courseTitle,
    courseSlug,
    enrollmentStatus,
    totalLessons,
    lessonsCompleted,
    completionPercent,
    lastAccessedAt,
    continueLessonSlug,
  } = stats

  const ctaHref =
    lessonsCompleted === 0
      ? `/courses/${courseSlug}`
      : continueLessonSlug
        ? `/courses/${courseSlug}/${continueLessonSlug}`
        : `/courses/${courseSlug}`

  const ctaLabel = lessonsCompleted === 0 ? 'Start Course' : 'Continue'

  return (
    <div className="rounded-lg border border-border p-6 bg-card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground leading-snug">
          {courseTitle}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[enrollmentStatus]}`}
        >
          {STATUS_LABELS[enrollmentStatus]}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${completionPercent === 100 ? 'bg-positive' : 'bg-primary'}`}
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {lessonsCompleted} / {totalLessons} lessons
        </span>
        <span>{completionPercent}% complete</span>
      </div>

      {lastAccessedAt && (
        <p className="text-xs text-muted-foreground">
          Last accessed{' '}
          {new Date(lastAccessedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}

      <Link
        href={ctaHref}
        className="mt-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
