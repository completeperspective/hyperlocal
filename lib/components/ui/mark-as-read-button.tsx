'use client'

import { CheckIcon, Circle, Loader2 } from 'lucide-react'
import { useLessonProgress } from '@/components/providers/lesson-progress-provider'
import { Button } from '@/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'

export function useMarkAsRead() {
  const { isComplete, isPending, error, toggle } = useLessonProgress()
  return { isComplete, isPending, error, handleToggle: toggle }
}

interface MarkAsReadButtonProps {
  /** Render as a round icon-only button (for breadcrumb bar / bottom bar). */
  compact?: boolean
  /** Visual variant for compact mode. Default: 'ghost'. */
  buttonVariant?: 'default' | 'ghost' | 'outline'
  /** Scoped theme ID — applies the course/index theme to the tooltip popup. */
  themeId?: string | null
}

export function MarkAsReadButton({
  compact = false,
  buttonVariant = 'ghost',
  themeId,
}: MarkAsReadButtonProps) {
  const { isComplete, isPending, error, toggle } = useLessonProgress()

  if (compact) {
    const label = isComplete ? 'Mark as Incomplete' : 'Mark as Complete'
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={buttonVariant}
            size="icon"
            onClick={toggle}
            disabled={isPending}
            className="rounded-full"
            aria-label={label}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isComplete ? (
              <CheckIcon className="size-4 text-positive" />
            ) : (
              <Circle className="size-4 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" themeId={themeId}>
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={isComplete ? 'outline' : 'default'}
        onClick={toggle}
        disabled={isPending}
        className="gap-2"
      >
        {isComplete && <CheckIcon className="size-4 text-positive" />}
        {isPending
          ? 'Saving...'
          : isComplete
            ? 'Completed — Mark as Incomplete'
            : 'Mark as Complete'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
