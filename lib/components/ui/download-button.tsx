'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from './button'

interface DownloadButtonProps {
  id: string
  filename: string
  label: string
}

export function DownloadButton({ id, filename, label }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/attachments/${id}/download`)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      // Reason: fallback for browsers that block programmatic blob downloads —
      // navigate directly to the API route which sets Content-Disposition: attachment.
      window.open(
        `/api/v1/attachments/${id}/download`,
        '_blank',
        'noopener,noreferrer',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleClick}
      disabled={loading}
      aria-label={`Download ${label}`}
    >
      <Download aria-hidden="true" />
    </Button>
  )
}
