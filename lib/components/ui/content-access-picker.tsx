'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

export interface ContentCatalog {
  courses: { id: string; slug: string; title: string }[]
  pages: { id: string; slug: string; title: string }[]
  pageIndexes: { id: string; slug: string; basePath: string; title: string }[]
}

interface ContentAccessPickerProps {
  patterns: string[]
  onChange: (patterns: string[]) => void
  catalog?: ContentCatalog | null
}

function indexPattern(slug: string, basePath: string): string {
  return basePath ? `/${basePath}/${slug}/**` : `/${slug}/**`
}

function toggle(patterns: string[], pat: string): string[] {
  return patterns.includes(pat)
    ? patterns.filter((p) => p !== pat)
    : [...patterns, pat]
}

// Checkbox that supports the indeterminate DOM state
function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  id,
  label,
  sublabel,
  className,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  id: string
  label: string
  sublabel?: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate
  }, [indeterminate])

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-2 cursor-pointer group ${className ?? ''}`}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 accent-primary shrink-0"
      />
      <span className="text-sm leading-tight">{label}</span>
      {sublabel && (
        <span
          className="text-xs text-muted-foreground font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        >
          {sublabel}
        </span>
      )}
    </label>
  )
}

export function ContentAccessPicker({
  patterns,
  onChange,
  catalog: catalogProp,
}: ContentAccessPickerProps) {
  const [catalog, setCatalog] = useState<ContentCatalog | null>(
    catalogProp ?? null,
  )
  const [loading, setLoading] = useState(!catalogProp)
  const [rawOpen, setRawOpen] = useState(false)

  useEffect(() => {
    if (catalogProp !== undefined) {
      setCatalog(catalogProp)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch('/api/v1/admin/content-catalog')
      .then((r) => r.json())
      .then((d: ContentCatalog) => setCatalog(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [catalogProp])

  // --- Derived checked states ---
  const hasAll = patterns.includes('/**')
  const hasAllCourses = patterns.includes('/courses/**')
  const coursePatterns = new Set(
    (catalog?.courses ?? [])
      .map((c) => `/courses/${c.slug}/**`)
      .filter((p) => patterns.includes(p)),
  )
  const someCourses = coursePatterns.size > 0
  const allCoursesIndeterminate = !hasAllCourses && someCourses

  const indexPats = (catalog?.pageIndexes ?? []).map((i) =>
    indexPattern(i.slug, i.basePath),
  )
  const someIndexes = indexPats.some((p) => patterns.includes(p))

  // --- Handlers ---
  function handleAll() {
    if (hasAll) {
      onChange(patterns.filter((p) => p !== '/**'))
    } else {
      // Add /** — keep other patterns so admin can see what was set
      onChange([...patterns, '/**'])
    }
  }

  function handleAllCourses() {
    if (hasAllCourses) {
      onChange(patterns.filter((p) => p !== '/courses/**'))
    } else {
      // Remove individual course patterns, replace with catch-all
      const next = patterns.filter((p) => !p.startsWith('/courses/'))
      onChange([...next, '/courses/**'])
    }
  }

  function handleCourse(slug: string) {
    const pat = `/courses/${slug}/**`
    if (hasAllCourses) {
      // Switching from catch-all to individual: uncheck this one, keep rest
      const rest = (catalog?.courses ?? [])
        .filter((c) => c.slug !== slug)
        .map((c) => `/courses/${c.slug}/**`)
      onChange([...patterns.filter((p) => p !== '/courses/**'), ...rest])
    } else {
      onChange(toggle(patterns, pat))
    }
  }

  function handleIndex(slug: string, basePath: string) {
    onChange(toggle(patterns, indexPattern(slug, basePath)))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="size-3 animate-spin" />
        Loading catalog…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Master: Everything */}
      <IndeterminateCheckbox
        id="cap-all"
        checked={hasAll}
        indeterminate={!hasAll && (someCourses || someIndexes)}
        onChange={handleAll}
        label="All content"
        sublabel="/**"
        className="font-medium"
      />

      {/* Courses section */}
      {(catalog?.courses ?? []).length > 0 && (
        <div className="pl-5 flex flex-col gap-2 border-l border-border ml-2">
          <IndeterminateCheckbox
            id="cap-all-courses"
            checked={hasAllCourses}
            indeterminate={allCoursesIndeterminate}
            onChange={handleAllCourses}
            label="All courses"
            sublabel="/courses/**"
            className="font-medium text-xs"
          />
          <div className="pl-4 flex flex-col gap-1.5">
            {catalog!.courses.map((course) => (
              <IndeterminateCheckbox
                key={course.id}
                id={`cap-course-${course.id}`}
                checked={
                  hasAllCourses ||
                  coursePatterns.has(`/courses/${course.slug}/**`)
                }
                onChange={() => handleCourse(course.slug)}
                label={course.title}
                sublabel={`/courses/${course.slug}/**`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Page Indexes section */}
      {(catalog?.pageIndexes ?? []).length > 0 && (
        <div className="pl-5 flex flex-col gap-2 border-l border-border ml-2">
          <p className="text-xs font-medium text-muted-foreground">
            Page Indexes
          </p>
          <div className="flex flex-col gap-1.5">
            {catalog!.pageIndexes.map((idx) => {
              const pat = indexPattern(idx.slug, idx.basePath)
              return (
                <IndeterminateCheckbox
                  key={idx.id}
                  id={`cap-index-${idx.id}`}
                  checked={hasAll || patterns.includes(pat)}
                  onChange={() => handleIndex(idx.slug, idx.basePath)}
                  label={idx.title}
                  sublabel={pat}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Raw patterns collapsible */}
      {patterns.length > 0 && (
        <div className="border-t border-border pt-2">
          <button
            type="button"
            onClick={() => setRawOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={rawOpen}
          >
            {rawOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            {patterns.length} active pattern{patterns.length !== 1 ? 's' : ''}
          </button>
          {rawOpen && (
            <div className="mt-2 flex flex-col gap-1">
              {patterns.map((pat) => (
                <code
                  key={pat}
                  className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
                >
                  {pat}
                </code>
              ))}
            </div>
          )}
        </div>
      )}

      {patterns.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          No patterns — all membership content is accessible.
        </p>
      )}
    </div>
  )
}
