'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  CheckIcon,
  Circle,
  Download,
  Loader2,
  Paperclip,
} from 'lucide-react'
import { useLessonProgress } from '@/components/providers/lesson-progress-provider'
import type {
  CourseData,
  LessonProgressMap,
  PageActionAttachment,
  PageActionConfig,
} from '@/types/course'
import { SidebarContent } from '@/ui/course-lesson-sidebar'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/ui/drawer'
import { cn } from '@/utils/cn'

interface LessonMobileNavProps {
  course: CourseData
  currentPageSlug: string
  progressMap: LessonProgressMap
  isAuthenticated?: boolean
  isAdmin?: boolean
  actions?: PageActionConfig[]
  scrollContainerId?: string
  hasActiveMembership?: boolean
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

function useScrollVisibility(scrollContainerId: string) {
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const container = document.getElementById(scrollContainerId)
    if (!container) return

    function handleScroll() {
      const currentY = container!.scrollTop
      const delta = currentY - lastScrollY.current
      if (Math.abs(delta) < 8) return
      setVisible(delta < 0 || currentY < 60)
      lastScrollY.current = currentY
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [scrollContainerId])

  return visible
}

function MobileAttachmentsButton({
  attachments,
}: {
  attachments: PageActionAttachment[]
}) {
  const [open, setOpen] = useState(false)

  if (attachments.length === 1) {
    return (
      <a
        href={`/api/v1/attachments/${attachments[0].id}/download`}
        download={attachments[0].filename}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Download ${attachments[0].label}`}
      >
        <Paperclip className="size-5" />
        <span>Download</span>
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Download attachments"
      >
        <Paperclip className="size-5" />
        <span>Downloads</span>
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Attachments</DrawerTitle>
          </DrawerHeader>
          <ul className="px-4 pb-8 space-y-2">
            {attachments.map((att) => (
              <li key={att.id}>
                <a
                  href={`/api/v1/attachments/${att.id}/download`}
                  download={att.filename}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Download className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{att.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export function LessonMobileNav({
  course,
  currentPageSlug,
  progressMap,
  isAuthenticated = false,
  isAdmin = false,
  actions = [],
  scrollContainerId = 'lesson-main-content',
  hasActiveMembership = false,
}: LessonMobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const barVisible = useScrollVisibility(scrollContainerId)

  const markAsReadAction = actions.find(
    (a): a is Extract<PageActionConfig, { type: 'mark-as-read' }> =>
      a.type === 'mark-as-read',
  )
  const downloadAction = actions.find(
    (a): a is Extract<PageActionConfig, { type: 'download-attachments' }> =>
      a.type === 'download-attachments',
  )

  const showMarkAsRead =
    !!markAsReadAction &&
    shouldShow(markAsReadAction.show, isAuthenticated, isAdmin)
  const showDownload =
    !!downloadAction &&
    downloadAction.attachments.length > 0 &&
    shouldShow(downloadAction.show, isAuthenticated, isAdmin)

  const { isComplete, isPending, toggle } = useLessonProgress()

  return (
    <>
      {/* Course sidebar Drawer — triggered by Contents button in bottom bar */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="sr-only">Course Navigation</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <SidebarContent
              course={course}
              currentPageSlug={currentPageSlug}
              progressMap={progressMap}
              isAuthenticated={isAuthenticated}
              hasActiveMembership={hasActiveMembership}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Scroll-aware bottom action bar — mobile only */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'flex items-stretch justify-around',
          'border-t border-border bg-background/95 backdrop-blur-sm',
          'h-14',
          'pb-[env(safe-area-inset-bottom,0px)]',
          'transition-transform duration-200 ease-in-out',
          barVisible ? 'translate-y-0' : 'translate-y-full',
        )}
        aria-hidden={!barVisible}
      >
        {/* Contents — always visible; opens sidebar drawer */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open course navigation"
        >
          <BookOpen className="size-5" />
          <span>Contents</span>
        </button>

        {/* Mark Complete — only if authenticated and action configured */}
        {showMarkAsRead && (
          <button
            type="button"
            onClick={toggle}
            disabled={isPending}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2 text-[11px] transition-colors',
              isComplete
                ? 'text-positive hover:text-positive/80'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={isComplete ? 'Mark as Incomplete' : 'Mark as Complete'}
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : isComplete ? (
              <CheckIcon className="size-5" />
            ) : (
              <Circle className="size-5" />
            )}
            <span>{isComplete ? 'Completed' : 'Mark as Complete'}</span>
          </button>
        )}

        {/* Attachments — only if page has attachments and visibility allows */}
        {showDownload && downloadAction && (
          <MobileAttachmentsButton attachments={downloadAction.attachments} />
        )}
      </div>
    </>
  )
}
