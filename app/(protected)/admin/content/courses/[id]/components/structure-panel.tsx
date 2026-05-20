'use client'

import { ExternalLink } from 'lucide-react'

interface Chapter {
  id: string
  title: string
  sortOrder: number
}

interface StructurePanelProps {
  courseId: string
  chapters: Chapter[]
}

export function StructurePanel({ courseId, chapters }: StructurePanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-3">
          Chapters ({chapters.length})
        </h2>

        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No chapters yet. Add chapters via Keystone.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {chapters.map((chapter, index) => (
              <li
                key={chapter.id}
                className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-2.5"
              >
                <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm font-medium truncate">
                  {chapter.title}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground mb-3">
          Chapters, lessons, and page content are managed in Keystone.
        </p>
        <a
          href={`/api/keystone/admin/course/${courseId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Edit chapters &amp; lessons in Keystone
          <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  )
}
