'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import type { CourseListItem } from '@/types/course'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { CourseCreateDialog } from './course-create-dialog'
import { CourseDeleteDialog } from './course-delete-dialog'

interface CourseTableSectionProps {
  items: CourseListItem[]
}

function statusVariant(
  status: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'published') return 'default'
  if (status === 'membership') return 'outline'
  return 'secondary'
}

function statusLabel(status: string): string {
  if (status === 'published') return 'Published'
  if (status === 'membership') return 'Members'
  if (status === 'private') return 'Private'
  return 'Draft'
}

export function CourseTableSection({ items }: CourseTableSectionProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState<CourseListItem | null>(null)

  function handleCreateSuccess() {
    setCreateOpen(false)
    router.refresh()
  }

  function handleDeleteSuccess() {
    setDeleting(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)}>New Course</Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-lg">
            No courses yet. Create your first course.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card stack */}
          <div className="flex flex-col gap-3 sm:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/content/courses/${item.id}`}
                      className="font-semibold truncate hover:text-primary transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                      {item.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/content/courses/${item.id}`)
                      }
                      aria-label={`Edit ${item.title}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleting(item)}
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(item.status)}>
                    {statusLabel(item.status)}
                  </Badge>
                  <Badge variant={item.heroEnabled ? 'default' : 'secondary'}>
                    Hero {item.heroEnabled ? 'On' : 'Off'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.chapterCount} chapter
                    {item.chapterCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Hero</th>
                  <th className="text-left px-4 py-3 font-medium">Chapters</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/content/courses/${item.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {item.slug}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(item.status)}>
                        {statusLabel(item.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={item.heroEnabled ? 'default' : 'secondary'}
                      >
                        {item.heroEnabled ? 'On' : 'Off'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.chapterCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/content/courses/${item.id}`)
                          }
                          aria-label={`Edit ${item.title}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleting(item)}
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CourseCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <CourseDeleteDialog
        open={deleting !== null}
        item={deleting}
        onClose={() => setDeleting(null)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
