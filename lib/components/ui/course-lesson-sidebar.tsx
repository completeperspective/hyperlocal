'use client'

import Link from 'next/link'
import { CheckIcon, Lock } from 'lucide-react'
import { useLessonProgress } from '@/components/providers/lesson-progress-provider'
import type { CourseData, LessonProgressMap } from '@/types/course'

interface CourseLessonSidebarProps {
  course: CourseData
  currentPageSlug: string
  progressMap: LessonProgressMap
  isAuthenticated?: boolean
  hasActiveMembership?: boolean
}

export function SidebarContent({
  course,
  currentPageSlug,
  progressMap,
  hasActiveMembership = false,
}: CourseLessonSidebarProps) {
  const { isComplete: liveIsComplete, pageSlug: livePageSlug } =
    useLessonProgress()

  function linkClass(isActive: boolean): string {
    const base =
      'flex items-center justify-between rounded-md px-2 py-1.5 text-sm no-underline transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sidebar-ring'
    if (isActive) {
      return `${base} bg-sidebar-primary text-sidebar-primary-foreground font-semibold`
    }
    return `${base} text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`
  }

  function resolveIsComplete(slug: string): boolean {
    // Reason: use live context state for the active page so a toggle immediately
    // reflects in the sidebar without a page refresh; fall back to the static
    // server-fetched progressMap for all other lessons.
    if (slug === livePageSlug) return liveIsComplete
    return progressMap[slug]?.completedAt != null
  }

  return (
    <nav className="flex flex-col gap-1 p-4">
      {course.chapters?.map((chapter) => (
        <div key={chapter.id} className="mb-4">
          <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50">
            {chapter.title}
          </p>
          <ul className="space-y-0.5 pl-4">
            {chapter.pages.map((page) => {
              const isActive = page.slug === currentPageSlug
              const isComplete = resolveIsComplete(page.slug)
              const isLocked =
                page.status !== 'published' && !hasActiveMembership
              return (
                <li key={page.id}>
                  <Link
                    href={`/courses/${course.slug}/${page.slug}`}
                    className={linkClass(isActive)}
                  >
                    <span>{page.title}</span>
                    {isLocked ? (
                      <Lock
                        aria-label="Locked"
                        className="size-4 shrink-0 text-warning"
                      />
                    ) : (
                      isComplete && (
                        <CheckIcon
                          className={`size-4 shrink-0 ${isActive ? 'text-sidebar-primary-foreground' : 'text-positive'}`}
                        />
                      )
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {course.pages?.length > 0 && (
        <div className="mb-4">
          {(course.chapters?.length ?? 0) > 0 && (
            <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50">
              Additional Pages
            </p>
          )}
          <ul className="space-y-0.5">
            {course.pages.map((page) => {
              const isActive = page.slug === currentPageSlug
              const isComplete = resolveIsComplete(page.slug)
              const isLocked =
                page.status !== 'published' && !hasActiveMembership
              return (
                <li key={page.id}>
                  <Link
                    href={`/courses/${course.slug}/${page.slug}`}
                    className={linkClass(isActive)}
                  >
                    <span>{page.title}</span>
                    {isLocked ? (
                      <Lock
                        aria-label="Locked"
                        className="size-4 shrink-0 text-warning"
                      />
                    ) : (
                      isComplete && (
                        <CheckIcon
                          className={`size-4 shrink-0 ${isActive ? 'text-sidebar-primary-foreground' : 'text-positive'}`}
                        />
                      )
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </nav>
  )
}

export function CourseLessonSidebar(props: CourseLessonSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto border-r border-sidebar-border bg-sidebar shrink-0">
      <SidebarContent {...props} />
    </aside>
  )
}
