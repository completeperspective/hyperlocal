'use client'

import { useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { Button } from '@/ui/button'

interface CopyFieldProps {
  value: string
  displayValue?: string
  label: string
}

export function CopyField({ value, displayValue, label }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-mono text-xs text-muted-foreground truncate">
        {displayValue ?? value}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        onClick={handleCopy}
        aria-label={label}
      >
        {copied ? (
          <CheckIcon className="size-3 text-positive" />
        ) : (
          <CopyIcon className="size-3" />
        )}
      </Button>
    </div>
  )
}
