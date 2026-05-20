'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import type { PageGroupData, PageIndexPageData } from '@/types/page-index'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { PagePickerDialog } from './page-picker-dialog'

interface GroupCardProps {
  group: PageGroupData
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onRename: (title: string) => Promise<void>
  onAddPages: (pages: PageIndexPageData[]) => Promise<void>
  onRemovePage: (pageId: string) => Promise<void>
  // All page IDs across the whole index (used to exclude from picker)
  allPageIds: string[]
}

export function GroupCard({
  group,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onRename,
  onAddPages,
  onRemovePage,
  allPageIds,
}: GroupCardProps) {
  const [editing, setEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(group.title)
  const [savingTitle, setSavingTitle] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null)

  async function handleTitleSave() {
    if (!titleDraft.trim() || titleDraft === group.title) {
      setEditing(false)
      setTitleDraft(group.title)
      return
    }
    setSavingTitle(true)
    try {
      await onRename(titleDraft.trim())
      setEditing(false)
    } finally {
      setSavingTitle(false)
    }
  }

  async function handleRemovePage(pageId: string) {
    setDeletingPageId(pageId)
    try {
      await onRemovePage(pageId)
    } finally {
      setDeletingPageId(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Group header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <GripVertical className="size-4 text-muted-foreground shrink-0" />

        {editing ? (
          <Input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave()
              if (e.key === 'Escape') {
                setEditing(false)
                setTitleDraft(group.title)
              }
            }}
            className="h-7 text-sm font-medium"
            disabled={savingTitle}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm font-semibold hover:text-primary transition-colors"
            title="Click to rename"
          >
            {group.title}
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move group up"
            className="size-7 p-0"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move group down"
            className="size-7 p-0"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            aria-label="Delete group"
            className="size-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Pages list */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {group.pages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No pages yet</p>
        ) : (
          group.pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {page.title || '(untitled)'}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  /{page.slug}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={
                    page.status === 'published' ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {page.status}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleRemovePage(page.id)}
                  disabled={deletingPageId === page.id}
                  aria-label={`Remove ${page.title}`}
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPickerOpen(true)}
          className="self-start gap-1.5 text-xs mt-1"
        >
          <Plus className="size-3.5" />
          Add page
        </Button>
      </div>

      <PagePickerDialog
        open={pickerOpen}
        excludeIds={allPageIds}
        onClose={() => setPickerOpen(false)}
        onConfirm={(pages) => {
          setPickerOpen(false)
          onAddPages(pages)
        }}
      />
    </div>
  )
}
