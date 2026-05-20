'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'

const RESERVED_PREFIXES = [
  'api',
  'courses',
  'admin',
  'dashboard',
  'profile',
  'settings',
  'onboarding',
  'login',
  'logout',
  'signup',
  'get-access',
  '_next',
  'static',
]

type ValidationState =
  | { status: 'idle' }
  | { status: 'reserved'; error: string }
  | { status: 'checking' }
  | { status: 'valid' }
  | { status: 'collision'; error: string }
  | { status: 'error'; error: string }

interface UrlPreviewBarProps {
  basePath: string
  slug: string
  excludeId?: string
  onValidationChange?: (valid: boolean) => void
}

function buildSegments(basePath: string, slug: string): string[] {
  const parts: string[] = []
  if (basePath) {
    parts.push(...basePath.split('/').filter(Boolean))
  }
  if (slug) parts.push(slug)
  parts.push('[page-slug]')
  return parts
}

export function UrlPreviewBar({
  basePath,
  slug,
  excludeId,
  onValidationChange,
}: UrlPreviewBarProps) {
  const [validation, setValidation] = useState<ValidationState>({
    status: 'idle',
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!slug) {
      setValidation({ status: 'idle' })
      onValidationChange?.(false)
      return
    }

    // Synchronous reserved check — no debounce needed
    const firstSegment = (basePath || slug).split('/')[0].toLowerCase()
    if (RESERVED_PREFIXES.includes(firstSegment)) {
      setValidation({
        status: 'reserved',
        error: `"${firstSegment}" is a reserved platform path.`,
      })
      onValidationChange?.(false)
      return
    }

    // Debounced collision check against the API
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setValidation({ status: 'checking' })

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ basePath, slug })
        if (excludeId) params.set('excludeId', excludeId)
        const res = await fetch(
          `/api/v1/admin/page-indexes/check-path?${params.toString()}`,
        )
        const data = (await res.json()) as {
          ok: boolean
          type?: 'reserved' | 'collision'
          error?: string
        }

        if (data.ok) {
          setValidation({ status: 'valid' })
          onValidationChange?.(true)
        } else if (data.type === 'reserved') {
          setValidation({
            status: 'reserved',
            error: data.error ?? 'Reserved path.',
          })
          onValidationChange?.(false)
        } else if (data.type === 'collision') {
          setValidation({
            status: 'collision',
            error: data.error ?? 'Path already in use.',
          })
          onValidationChange?.(false)
        } else {
          setValidation({
            status: 'error',
            error: data.error ?? 'Validation failed.',
          })
          onValidationChange?.(false)
        }
      } catch {
        setValidation({ status: 'error', error: 'Could not validate path.' })
        onValidationChange?.(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, slug, excludeId])

  const segments = buildSegments(basePath, slug)
  const hasContent = basePath || slug

  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        URL Preview
      </p>

      {/* Segment pills */}
      <div className="flex flex-wrap items-center gap-1 min-h-[28px]">
        {!hasContent ? (
          <span className="text-xs text-muted-foreground italic">
            Enter a base path and slug above
          </span>
        ) : (
          segments.map((seg, i) => {
            const isPageSlug = seg === '[page-slug]'
            const isSlug =
              !isPageSlug && basePath
                ? i === segments.length - 2
                : i === segments.length - 2
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="text-muted-foreground text-xs">/</span>
                )}
                <span
                  className={[
                    'px-2 py-0.5 rounded text-xs font-mono',
                    isPageSlug
                      ? 'bg-muted text-muted-foreground border border-dashed border-border'
                      : isSlug
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-secondary/60 text-secondary-foreground',
                  ].join(' ')}
                >
                  {seg}
                </span>
              </span>
            )
          })
        )}
      </div>

      {/* Validation status */}
      {validation.status === 'checking' && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Checking availability…
        </div>
      )}
      {validation.status === 'valid' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="size-3" />
          Path is available
        </div>
      )}
      {(validation.status === 'reserved' ||
        validation.status === 'collision' ||
        validation.status === 'error') && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <XCircle className="size-3" />
          {validation.error}
        </div>
      )}
    </div>
  )
}
