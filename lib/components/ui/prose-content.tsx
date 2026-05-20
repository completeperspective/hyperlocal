import { cn } from '@/utils/cn'

interface ProseContentProps {
  children: React.ReactNode
  className?: string
}

// max-w-none: the parent container already constrains width — the prose plugin
// must not add a second max-width on top of container-prose or container-content.
export function ProseContent({ children, className }: ProseContentProps) {
  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
