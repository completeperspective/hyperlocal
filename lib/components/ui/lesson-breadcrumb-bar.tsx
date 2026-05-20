'use client'

import Link from 'next/link'
import { ChevronRight, Download, HomeIcon } from 'lucide-react'
import type { BreadcrumbItem, PageActionConfig } from '@/types/course'
import { Button } from '@/ui/button'
import { DownloadButton } from '@/ui/download-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { MarkAsReadButton } from '@/ui/mark-as-read-button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip'
import { cn } from '@/utils/cn'

interface LessonBreadcrumbBarProps {
  breadcrumbs: BreadcrumbItem[]
  actions?: PageActionConfig[]
  isAuthenticated?: boolean
  isAdmin?: boolean
  /** Scoped theme ID — applies the course/index theme to tooltip popups. */
  themeId?: string | null
}

function shouldShow(
  show: PageActionConfig['show'],
  isAuthenticated: boolean,
  isAdmin: boolean,
): boolean {
  if (!show || show === 'public') return true
  if (show === 'authenticated') return isAuthenticated
  if (show === 'admin') return isAdmin
  return false
}

export function LessonBreadcrumbBar({
  breadcrumbs,
  actions = [],
  isAuthenticated = false,
  isAdmin = false,
  themeId,
}: LessonBreadcrumbBarProps) {
  const visibleActions = actions.filter((a) =>
    shouldShow(a.show, isAuthenticated, isAdmin),
  )

  return (
    // Reason: sticky top-0 is relative to <main overflow-y-auto>, not the viewport.
    // The SiteHeader is a sibling outside <main> and stays visible independently.
    <div className="sticky top-0 z-40 flex h-10 items-center justify-between border-b border-border/50 bg-background/80 px-4 py-6 backdrop-blur-sm md:p-6 md:pr-4">
      {/* LEFT — breadcrumb trail */}
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5 overflow-hidden text-sm"
      >
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          const isMiddle = i > 0 && !isLast

          return (
            <span
              key={crumb.label}
              className={cn(
                'flex items-center gap-1.5',
                isMiddle ? 'hidden md:flex' : '',
              )}
            >
              {i > 0 && (
                <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
              )}
              {isLast ? (
                <span className="truncate font-medium text-foreground max-w-[160px] md:max-w-xs">
                  {crumb.label}
                </span>
              ) : crumb.href ? (
                i === 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={crumb.href}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={crumb.label}
                      >
                        <HomeIcon className="size-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent themeId={themeId}>
                      {crumb.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    href={crumb.href}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )
              ) : (
                <span className="shrink-0 text-muted-foreground">
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>

      {/* RIGHT — action buttons, desktop only */}
      {visibleActions.length > 0 && (
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {visibleActions.map((action) => {
            if (action.type === 'mark-as-read') {
              return (
                <MarkAsReadButton
                  key="mark-as-read"
                  compact
                  buttonVariant="ghost"
                  themeId={themeId}
                />
              )
            }

            if (action.type === 'download-attachments') {
              if (action.attachments.length === 0) return null

              if (action.attachments.length === 1) {
                return (
                  <DownloadButton
                    key="download"
                    id={action.attachments[0].id}
                    filename={action.attachments[0].filename}
                    label={action.attachments[0].label}
                  />
                )
              }

              return (
                <DropdownMenu key="download">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      aria-label="Download attachments"
                    >
                      <Download className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {action.attachments.map((att) => (
                      <DropdownMenuItem key={att.id} asChild>
                        <a
                          href={`/api/v1/attachments/${att.id}/download`}
                          download={att.filename}
                        >
                          <Download className="size-4 mr-2" />
                          {att.label}
                        </a>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}
