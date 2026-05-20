'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import { Input } from '@/ui/input'

export interface PickablePage {
  id: string
  title: string
  slug: string
  status: string
}

interface PagePickerDialogProps {
  open: boolean
  excludeIds: string[]
  onClose: () => void
  onConfirm: (pages: PickablePage[]) => void
}

export function PagePickerDialog({
  open,
  excludeIds,
  onClose,
  onConfirm,
}: PagePickerDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickablePage[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelected(new Set())
      setResults([])
      return
    }
    // Load all on open
    fetchPages('')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPages(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPages(q: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (excludeIds.length > 0) params.set('excludeIds', excludeIds.join(','))
      const res = await fetch(`/api/v1/admin/pages?${params}`)
      if (res.ok) {
        setResults(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    const pages = results.filter((p) => selected.has(p.id))
    onConfirm(pages)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Pages</DialogTitle>
          <DialogDescription>
            Search and select pages to add to this index.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {query ? 'No pages match your search.' : 'No pages available.'}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {results.map((page) => (
                <li key={page.id}>
                  <label className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded">
                    <input
                      type="checkbox"
                      checked={selected.has(page.id)}
                      onChange={() => toggle(page.id)}
                      className="size-4 accent-primary shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {page.title || '(untitled)'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        /{page.slug}
                      </p>
                    </div>
                    <Badge
                      variant={
                        page.status === 'published' ? 'default' : 'secondary'
                      }
                      className="shrink-0 text-xs"
                    >
                      {page.status}
                    </Badge>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Add{' '}
            {selected.size > 0
              ? `${selected.size} page${selected.size > 1 ? 's' : ''}`
              : 'pages'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
