'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Upload } from 'lucide-react'

interface ThemeJson {
  name?: string
  lightMode?: Record<string, unknown>
  darkMode?: Record<string, unknown>
  radius?: string
  fontHeading?: string
  fontBody?: string
}

function validateThemeJson(raw: string): ThemeJson {
  const parsed = JSON.parse(raw) as unknown

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Must be a JSON object')
  }

  const obj = parsed as Record<string, unknown>

  if (
    typeof obj.lightMode !== 'object' ||
    obj.lightMode === null ||
    typeof obj.darkMode !== 'object' ||
    obj.darkMode === null
  ) {
    throw new Error('JSON must contain "lightMode" and "darkMode" objects')
  }

  return obj as ThemeJson
}

export function ImportThemePanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleImport() {
    setError(null)
    let parsed: ThemeJson
    try {
      parsed = validateThemeJson(raw)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
      return
    }

    setImporting(true)
    try {
      const body = {
        name: (parsed.name ?? 'Imported Theme').trim() || 'Imported Theme',
        lightMode: parsed.lightMode,
        darkMode: parsed.darkMode,
        radius: parsed.radius ?? '0.625rem',
        fontHeading: parsed.fontHeading ?? "'Lobster', sans-serif",
        fontBody: parsed.fontBody ?? "'Open Sans', sans-serif",
      }
      const res = await fetch('/api/v1/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      setRaw('')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Auto-format pasted JSON
    const text = e.clipboardData.getData('text')
    try {
      const pretty = JSON.stringify(JSON.parse(text), null, 2)
      e.preventDefault()
      setRaw(pretty)
      setError(null)
    } catch {
      // not valid JSON yet — let textarea handle it normally
    }
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => {
          setOpen((v) => !v)
          if (!open) setTimeout(() => textareaRef.current?.focus(), 50)
        }}
        className="w-full flex items-center justify-between px-5 py-4 text-left
                   hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Upload className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Import Theme JSON</p>
            <p className="text-xs text-muted-foreground">
              Paste exported JSON to create a new theme
            </p>
          </div>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 flex flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              setError(null)
            }}
            onPaste={handlePaste}
            placeholder={`{\n  "name": "My Theme",\n  "lightMode": { … },\n  "darkMode": { … }\n}`}
            rows={10}
            spellCheck={false}
            className="w-full font-mono text-xs rounded-lg border border-border bg-muted/30
                       p-3 resize-y outline-none focus:ring-2 focus:ring-ring transition-colors"
          />

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setOpen(false)
                setRaw('')
                setError(null)
              }}
              className="px-4 py-2 text-sm rounded-lg border border-border
                         text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!raw.trim() || importing}
              className="px-4 py-2 text-sm font-semibold rounded-lg
                         bg-primary text-primary-foreground
                         disabled:opacity-40 disabled:cursor-not-allowed
                         hover:opacity-90 active:scale-[0.98] transition-all
                         flex items-center gap-2"
            >
              <Upload className="size-3.5" />
              {importing ? 'Importing…' : 'Import Theme'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
