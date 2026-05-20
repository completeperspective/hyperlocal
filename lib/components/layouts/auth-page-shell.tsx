import { cn } from '@/utils/cn'

interface AuthPageShellProps {
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthPageShell({
  children,
  footer,
  className,
}: AuthPageShellProps) {
  return (
    <div
      className={cn(
        'grid min-h-[calc(100vh-var(--header-height))] grid-rows-[1fr_auto] items-start sm:items-center justify-items-start md:justify-items-center p-4 sm:p-8',
        className,
      )}
    >
      <main className="flex w-full max-w-2xl flex-col items-center gap-6">
        {children}
      </main>
      {footer && (
        <footer className="flex w-full flex-wrap items-center justify-center gap-6 py-6 text-sm text-muted-foreground">
          {footer}
        </footer>
      )}
    </div>
  )
}
