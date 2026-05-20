import * as React from 'react'
import { CheckIcon, Lock } from 'lucide-react'
import type {
  CourseChapter,
  CoursePage,
  LessonProgressMap,
} from '@/types/course'

interface CourseTOCProps {
  title: string
  chapters: CourseChapter[]
  /** Direct (unchaptered) pages */
  pages: CoursePage[]
  courseSlug: string
  progressMap?: LessonProgressMap
  isAuthenticated?: boolean
  hasActiveMembership?: boolean
}

// Reason: using inline styles for badge background colors to avoid relying on
// arbitrary Tailwind color values that would require custom config.
export function CourseTOC({
  title,
  chapters,
  pages,
  courseSlug,
  progressMap,
  isAuthenticated,
  hasActiveMembership = false,
}: CourseTOCProps) {
  const lessonCount =
    chapters.reduce((acc, ch) => acc + ch.pages.length, 0) + pages.length
  const chapterCount = chapters.length

  return (
    <article
      id="lessons"
      className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
    >
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {(chapterCount > 0 || lessonCount > 0) && (
        <p className="mb-10 text-sm text-muted-foreground">
          Table of Contents &bull; {lessonCount} Lesson
          {lessonCount !== 1 ? 's' : ''} &bull; {chapterCount} Chapter
          {chapterCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Chapters */}
      {chapters.map((chapter, i) => (
        <section key={chapter.id} className="mb-10">
          <h2 className="mb-4 flex flex-wrap items-center gap-3 text-xl font-semibold text-foreground">
            <span
              className="rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-foreground"
              style={{ background: `var(--color-meta-${(i % 5) + 1})` }}
            >
              Chapter {i + 1}
            </span>
            {chapter.title}
          </h2>

          {chapter.pages.length > 0 && (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-12 pb-2 text-left font-medium text-muted-foreground">
                      #
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      Lesson
                    </th>
                    <th className="w-8 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {chapter.pages.map((page, j) => {
                    const isLocked =
                      page.status !== 'published' && !hasActiveMembership
                    return (
                      <tr
                        key={page.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/40"
                      >
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                          {String(j + 1).padStart(2, '0')}
                        </td>
                        <td className="py-3">
                          <a
                            href={`/courses/${courseSlug}/${page.slug}`}
                            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                          >
                            {page.title}
                          </a>
                        </td>
                        <td className="py-3 text-right">
                          {isLocked ? (
                            <Lock
                              aria-label="Locked"
                              className="inline-block size-4 text-warning"
                            />
                          ) : (
                            progressMap?.[page.slug]?.completedAt && (
                              <CheckIcon className="inline-block size-4 text-positive" />
                            )
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      {/* Direct (unchaptered) pages */}
      {pages.length > 0 && (
        <section className="mb-10">
          {chapters.length > 0 && (
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Additional Pages
            </h2>
          )}
          <ul className="space-y-2">
            {pages.map((page) => {
              const isLocked =
                isAuthenticated === false && page.status !== 'published'
              return (
                <li key={page.id} className="flex items-center gap-2">
                  <a
                    href={`/courses/${courseSlug}/${page.slug}`}
                    className="text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {page.title}
                  </a>
                  {isLocked ? (
                    <Lock
                      aria-label="Locked"
                      className="size-4 shrink-0 text-warning"
                    />
                  ) : (
                    progressMap?.[page.slug]?.completedAt && (
                      <CheckIcon className="size-4 shrink-0 text-positive" />
                    )
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </article>
  )
}
