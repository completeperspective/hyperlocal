'use client'

import { useEffect, useRef, useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { Button } from '@/ui/button'

interface InlineEditFieldProps {
  label: string
  value: string
  onSave: (newValue: string) => Promise<void>
  multiline?: boolean
  placeholder?: string
  emptyText?: string
}

export function InlineEditField({
  label,
  value,
  onSave,
  multiline = false,
  placeholder,
  emptyText = 'Not set',
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  // Reason: show the saved value optimistically while the parent re-fetches,
  // preventing a flash back to the stale prop between save and router.refresh().
  const [optimistic, setOptimistic] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => {
    setOptimistic(null)
  }, [value])

  const displayValue = optimistic ?? value

  function handleEdit() {
    setDraft(value)
    setError(null)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function handleBlur() {
    if (draft === value) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    setError(null)
    setOptimistic(draft)
    try {
      await onSave(draft)
      setIsEditing(false)
    } catch {
      setOptimistic(null)
      setIsEditing(false)
      setError('Failed to save. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setDraft(value)
      setError(null)
      setIsEditing(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50'

  return (
    <div className="group flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-start gap-1">
        {isEditing ? (
          multiline ? (
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={3}
              disabled={isSaving}
              className={inputClass}
              data-testid={`inline-edit-${label.toLowerCase()}-textarea`}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSaving}
              className={inputClass}
              data-testid={`inline-edit-${label.toLowerCase()}-input`}
            />
          )
        ) : (
          <>
            <span className="flex-1 py-1 text-sm">
              {displayValue || (
                <span className="text-muted-foreground">{emptyText}</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 opacity-40 transition-opacity group-hover:opacity-100"
              onClick={handleEdit}
              aria-label={`Edit ${label.toLowerCase()}`}
              data-testid={`inline-edit-${label.toLowerCase()}-btn`}
            >
              <PencilIcon className="size-3" />
            </Button>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
