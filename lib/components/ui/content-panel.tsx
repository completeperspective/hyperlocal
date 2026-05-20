'use client'

import { useState } from 'react'
import { marked } from 'marked'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'

interface ContentPanelProps {
  endpoint: string
  initialTrustedHtml?: string | null
  initialCustomCss?: string | null
}

type Mode = 'markdown' | 'html'

function detectInitialMode(trustedHtml?: string | null): Mode {
  if (!trustedHtml) return 'markdown'
  return trustedHtml.trimStart().startsWith('<') ? 'html' : 'markdown'
}

const textareaClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-y'

export function ContentPanel({
  endpoint,
  initialTrustedHtml,
  initialCustomCss,
}: ContentPanelProps) {
  const [mode, setMode] = useState<Mode>(() =>
    detectInitialMode(initialTrustedHtml),
  )
  const [content, setContent] = useState(initialTrustedHtml ?? '')
  const [css, setCss] = useState(initialCustomCss ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const trustedHtml =
        mode === 'markdown'
          ? ((await marked.parse(content, { async: true })) as string)
          : content

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trustedHtml: trustedHtml || null,
          customCss: css || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { message?: string }).message ?? 'Save failed')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Mode selector */}
      <div className="flex flex-col gap-2">
        <Label>Markup</Label>
        <div className="flex gap-1 p-1 rounded-md bg-muted w-fit">
          {(['markdown', 'html'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={[
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                mode === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {m === 'markdown' ? 'Markdown' : 'HTML'}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === 'markdown'
            ? 'Paste Markdown — converted to HTML on save and stored as trustedHtml'
            : 'Paste raw HTML5 — injected directly into the page as trustedHtml'}
        </p>
      </div>

      {/* Content textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={saving}
        rows={20}
        placeholder={
          mode === 'markdown'
            ? '# Page Title\n\nParagraph text with **bold** and _italic_.\n\n## Section\n\nMore content...'
            : '<section class="hero">\n  <h1>Page Title</h1>\n  <p>Content here.</p>\n</section>'
        }
        className={textareaClass}
        style={{ minHeight: '400px' }}
      />

      <div className="h-px bg-border" />

      {/* Custom CSS */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-css">Custom CSS</Label>
        <p className="text-xs text-muted-foreground">
          CSS3 injected via{' '}
          <code className="font-mono text-xs">&lt;style&gt;</code> tag on this
          page only
        </p>
        <textarea
          id="custom-css"
          value={css}
          onChange={(e) => setCss(e.target.value)}
          disabled={saving}
          rows={8}
          placeholder=".my-class {\n  color: var(--primary);\n}\n\n.hero h1 {\n  font-size: 3rem;\n}"
          className={textareaClass}
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Content'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </form>
  )
}
