'use client'

import type { CourseProgressStats } from '@/types/course'
import type { UserMembership } from '@/types/membership'
import { CourseProgressCard } from '@/ui/course-progress-card'
import { MembershipManagePanel } from '@/ui/membership-manage-panel'

interface DashboardMembershipSectionProps {
  currentMembership: UserMembership | null
  portalReturned: boolean
}

interface DashboardCourseSectionProps {
  stats: CourseProgressStats[]
}

export function DashboardMembershipSection({
  currentMembership,
  portalReturned,
}: DashboardMembershipSectionProps) {
  return (
    <section className="mx-auto w-full max-w-4xl">
      <MembershipManagePanel
        membership={currentMembership}
        portalReturned={portalReturned}
      />
    </section>
  )
}

export function DashboardCourseSection({ stats }: DashboardCourseSectionProps) {
  if (stats.length === 0) return null
  return (
    <section className="mx-auto mt-8 w-full max-w-4xl">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        My Courses
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <CourseProgressCard key={s.courseSlug} stats={s} />
        ))}
      </div>
    </section>
  )
}
