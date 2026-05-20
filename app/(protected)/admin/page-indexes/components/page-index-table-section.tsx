'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import type { PageIndexListItem } from '@/types/page-index'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { PageIndexDeleteDialog } from './page-index-delete-dialog'
import { PageIndexFormDialog } from './page-index-form-dialog'

interface PageIndexTableSectionProps {
  items: PageIndexListItem[]
  // When provided, the edit action navigates to this URL instead of opening the dialog
  getEditHref?: (item: PageIndexListItem) => string
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

function buildUrl(basePath: string, slug: string): string {
  return basePath ? `/${basePath}/${slug}` : `/${slug}`
}

export function PageIndexTableSection({
  items,
  getEditHref,
}: PageIndexTableSectionProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<PageIndexListItem | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [deleting, setDeleting] = useState<PageIndexListItem | null>(null)

  function handleEditClick(item: PageIndexListItem) {
    if (getEditHref) {
      router.push(getEditHref(item))
      return
    }
    setSelected(item)
    setDialogMode('edit')
  }

  function handleDialogClose() {
    setDialogMode(null)
    setSelected(null)
  }

  function handleSuccess() {
    setDialogMode(null)
    setSelected(null)
    router.refresh()
  }

  function handleDeleteSuccess() {
    setDeleting(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setDialogMode('create')}>New Page Index</Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-lg mb-6">
            No page indexes yet
          </p>
          <Button onClick={() => setDialogMode('create')}>
            Create your first index
          </Button>
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
                    {getEditHref ? (
                      <Link
                        href={getEditHref(item)}
                        className="font-semibold truncate hover:text-primary transition-colors"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="font-semibold truncate">{item.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                      {buildUrl(item.basePath, item.slug)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(item)}
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
                <Badge variant={statusVariant(item.status)}>
                  {statusLabel(item.status)}
                </Badge>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">URL Path</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
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
                      {getEditHref ? (
                        <Link
                          href={getEditHref(item)}
                          className="hover:text-primary transition-colors"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {buildUrl(item.basePath, item.slug)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(item.status)}>
                        {statusLabel(item.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(item)}
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

      <PageIndexFormDialog
        open={dialogMode !== null}
        mode={dialogMode ?? 'create'}
        item={dialogMode === 'edit' ? (selected ?? undefined) : undefined}
        onClose={handleDialogClose}
        onSuccess={handleSuccess}
      />

      <PageIndexDeleteDialog
        open={deleting !== null}
        item={deleting}
        onClose={() => setDeleting(null)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
