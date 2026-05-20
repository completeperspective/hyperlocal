'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type {
  PageGroupData,
  PageIndexData,
  PageIndexPageData,
} from '@/types/page-index'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { GroupCard } from './group-card'
import { PagePickerDialog } from './page-picker-dialog'

interface StructurePanelProps {
  indexId: string
  initialData: PageIndexData
}

export function StructurePanel({ indexId, initialData }: StructurePanelProps) {
  const [groups, setGroups] = useState<PageGroupData[]>(initialData.groups)
  const [directPages, setDirectPages] = useState<PageIndexPageData[]>(
    initialData.pages,
  )
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [directPickerOpen, setDirectPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // All page IDs currently referenced anywhere in this index
  const allPageIds = [
    ...directPages.map((p) => p.id),
    ...groups.flatMap((g) => g.pages.map((p) => p.id)),
  ]

  async function handleCreateGroup() {
    if (!newGroupTitle.trim()) return
    setCreatingGroup(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/page-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageIndexId: indexId,
          title: newGroupTitle.trim(),
          sortOrder: groups.length,
        }),
      })
      if (!res.ok) throw new Error('Failed to create group')
      const created = await res.json()
      setGroups((prev) => [
        ...prev,
        {
          id: created.id,
          title: newGroupTitle.trim(),
          sortOrder: prev.length,
          pages: [],
        },
      ])
      setNewGroupTitle('')
      setAddGroupOpen(false)
    } catch {
      setError('Failed to create group. Please try again.')
    } finally {
      setCreatingGroup(false)
    }
  }

  async function handleMoveGroup(index: number, direction: 'up' | 'down') {
    const next = [...groups]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    // Update sortOrder to match new positions
    const updated = next.map((g, i) => ({ ...g, sortOrder: i }))
    setGroups(updated)
    // Persist sortOrder for both swapped groups
    await Promise.all([
      fetch(`/api/v1/admin/page-groups/${updated[index].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: updated[index].sortOrder }),
      }),
      fetch(`/api/v1/admin/page-groups/${updated[swapIdx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: updated[swapIdx].sortOrder }),
      }),
    ])
  }

  async function handleDeleteGroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId))
    await fetch(`/api/v1/admin/page-groups/${groupId}`, { method: 'DELETE' })
  }

  async function handleRenameGroup(groupId: string, title: string) {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, title } : g)),
    )
    await fetch(`/api/v1/admin/page-groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
  }

  async function handleAddPagesToGroup(
    groupId: string,
    pages: PageIndexPageData[],
  ) {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return
    const newPages = [...group.pages, ...pages]
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, pages: newPages } : g)),
    )
    await fetch(`/api/v1/admin/page-groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIds: newPages.map((p) => p.id) }),
    })
  }

  async function handleRemovePageFromGroup(groupId: string, pageId: string) {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return
    const newPages = group.pages.filter((p) => p.id !== pageId)
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, pages: newPages } : g)),
    )
    await fetch(`/api/v1/admin/page-groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIds: newPages.map((p) => p.id) }),
    })
  }

  async function handleAddDirectPages(pages: PageIndexPageData[]) {
    const newPages = [...directPages, ...pages]
    setDirectPages(newPages)
    await fetch(`/api/v1/admin/page-indexes/${indexId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIds: newPages.map((p) => p.id) }),
    })
  }

  async function handleRemoveDirectPage(pageId: string) {
    const newPages = directPages.filter((p) => p.id !== pageId)
    setDirectPages(newPages)
    await fetch(`/api/v1/admin/page-indexes/${indexId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageIds: newPages.map((p) => p.id) }),
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Groups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Groups</h3>
          {!addGroupOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddGroupOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              Add group
            </Button>
          )}
        </div>

        {addGroupOpen && (
          <div className="flex gap-2">
            <Input
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              placeholder="Group title…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup()
                if (e.key === 'Escape') {
                  setAddGroupOpen(false)
                  setNewGroupTitle('')
                }
              }}
              autoFocus
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleCreateGroup}
              disabled={creatingGroup || !newGroupTitle.trim()}
            >
              {creatingGroup ? 'Creating…' : 'Create'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddGroupOpen(false)
                setNewGroupTitle('')
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}

        {groups.length === 0 && !addGroupOpen ? (
          <p className="text-sm text-muted-foreground italic">
            No groups yet — add a group to organize pages into sections.
          </p>
        ) : (
          <div className="space-y-3">
            {groups.map((group, i) => (
              <GroupCard
                key={group.id}
                group={group}
                isFirst={i === 0}
                isLast={i === groups.length - 1}
                onMoveUp={() => handleMoveGroup(i, 'up')}
                onMoveDown={() => handleMoveGroup(i, 'down')}
                onDelete={() => handleDeleteGroup(group.id)}
                onRename={(title) => handleRenameGroup(group.id, title)}
                onAddPages={(pages) => handleAddPagesToGroup(group.id, pages)}
                onRemovePage={(pageId) =>
                  handleRemovePageFromGroup(group.id, pageId)
                }
                allPageIds={allPageIds}
              />
            ))}
          </div>
        )}
      </div>

      {/* Direct pages (not in a group) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Ungrouped Pages</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pages attached directly to this index, shown outside any group.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDirectPickerOpen(true)}
            className="gap-1.5 shrink-0"
          >
            <Plus className="size-3.5" />
            Add page
          </Button>
        </div>

        {directPages.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No ungrouped pages.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {directPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
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
                    onClick={() => handleRemoveDirectPage(page.id)}
                    aria-label={`Remove ${page.title}`}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PagePickerDialog
        open={directPickerOpen}
        excludeIds={allPageIds}
        onClose={() => setDirectPickerOpen(false)}
        onConfirm={(pages) => {
          setDirectPickerOpen(false)
          handleAddDirectPages(pages)
        }}
      />
    </div>
  )
}
