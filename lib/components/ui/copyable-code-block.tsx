'use client'

import { useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/ui/button'
import { cn } from '@/utils/cn'

interface CopyableCodeBlockProps {
  children?: React.ReactNode
  className?: string
}

export function CopyableCodeBlock({
  children,
  className,
}: CopyableCodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      const text = preRef.current?.textContent ?? ''
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable or denied — fail silently
    }
  }

  return (
    <div className="group relative">
      <pre ref={preRef} className={cn('bg-muted p-4 rounded', className)}>
        {children}
      </pre>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute top-2 right-2 h-7 w-7"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  )
}
