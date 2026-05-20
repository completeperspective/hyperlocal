import { notFound } from 'next/navigation'
import { DocumentRenderer } from '@keystone-6/document-renderer'
import type { DocumentRendererProps } from '@keystone-6/document-renderer'
import { GetAccessClient } from '~/app/(public)/get-access/get-access-client'
import { LessonProgressProvider } from '@/components/providers/lesson-progress-provider'
import { getSession } from '@/server/auth'
import { AppSettings, getCourseLessonData } from '@/server/helpers'
import { getLessonProgressMap } from '@/server/helpers/get-course-progress'
import {
  getActiveMemberships,
  getActiveMembershipTiers,
} from '@/server/payments/membership'
import { buildHeroConfig } from '@/types/course'
import type {
  BreadcrumbItem,
  CourseData,
  CoursePage,
  LessonProgressMap,
  PageActionAttachment,
  PageActionConfig,
} from '@/types/course'
import type { HeroData } from '@/types/hero'
import type { Attachment } from '@/types/page'
import { CopyableCodeBlock } from '@/ui/copyable-code-block'
import { CourseLessonSidebar } from '@/ui/course-lesson-sidebar'
import { GatedContentCallout } from '@/ui/gated-content-callout'
import { Hero } from '@/ui/hero'
import { LessonBreadcrumbBar } from '@/ui/lesson-breadcrumb-bar'
import { LessonMobileNav } from '@/ui/lesson-mobile-nav'
import { MarkAsReadButton } from '@/ui/mark-as-read-button'
import { PageAttachmentList } from '@/ui/page-attachment-list'
import { PageViewTracker } from '@/ui/page-view-tracker'
import { ProseContent } from '@/ui/prose-content'
import { ScopedThemeWrapper } from '@/ui/scoped-theme-wrapper'
import { TrustedHtmlBlock } from '@/ui/trusted-html-block'
import { matchesPatterns } from '@/utils/content-access'

interface LessonPageData {
  id: string
  title: string
  description?: string
  slug: string
  status: string
  heroEnabled?: boolean
  hero?: HeroData | null
  content?: { document: unknown }
  trustedHtml?: string
  customCss?: string
  attachments?: Attachment[]
}

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string; 'page-slug': string }>
}) {
  const { slug, 'page-slug': pageSlug } = await params

  const appSettings = await AppSettings.instance.settings()
  const { data: sessionData } = await getSession()
  const isAuthenticated = !!sessionData
  if (appSettings?.isPrivate && !isAuthenticated) {
    return notFound()
  }

  const { course, page: rawPage } = await getCourseLessonData(slug, pageSlug)
  const page = rawPage as LessonPageData | null

  if (!course || !page) {
    return notFound()
  }

  // Resolve once — used for both gating checks and lock icons in the sidebar.
  const activeMemberships = sessionData?.id
    ? await getActiveMemberships(sessionData.id)
    : []
  const hasActiveMembership = activeMemberships.length > 0

  // Reason: admins bypass all membership gates regardless of their own membership status.
  const isAdmin = sessionData?.isAdmin ?? false

  if (page.status === 'membership' && !hasActiveMembership && !isAdmin) {
    const tiers = await getActiveMembershipTiers()
    return (
      <div className="flex flex-1 min-h-0">
        <CourseLessonSidebar
          course={course}
          currentPageSlug={pageSlug}
          progressMap={{}}
          isAuthenticated={isAuthenticated}
          hasActiveMembership={false}
        />
        <main className="flex-1 flex items-center justify-center overflow-y-auto">
          <GetAccessClient
            returnTo={`/courses/${slug}/${pageSlug}`}
            tiers={tiers}
            allowWeb3Auth={appSettings?.allowWeb3Auth ?? false}
            allowSignup={appSettings?.allowSignup ?? false}
            signinMessage={appSettings?.web3SignInMessage ?? undefined}
            isAuthenticated={isAuthenticated}
            walletAddress={sessionData?.walletAddress ?? null}
            receiverWalletAddress={appSettings?.receiverWalletAddress ?? null}
          />
        </main>
        <LessonMobileNav
          course={course}
          currentPageSlug={pageSlug}
          progressMap={{}}
          isAuthenticated={isAuthenticated}
          hasActiveMembership={false}
          actions={[]}
        />
      </div>
    )
  }

  // Reason: user has memberships but their combined tier glob patterns may not include
  // this specific lesson path. Show GatedContentCallout with the tiers that DO match.
  if (page.status === 'membership' && hasActiveMembership && !isAdmin) {
    // Reason: union all active tier patterns so users with multiple memberships get combined access.
    const mergedPatterns = activeMemberships.flatMap(
      (m) => m.tier?.contentAccessPatterns ?? [],
    )
    const currentPath = `/courses/${slug}/${pageSlug}`
    if (!matchesPatterns(mergedPatterns, currentPath)) {
      const allTiers = await getActiveMembershipTiers()
      const grantingTiers = allTiers.filter((t) =>
        matchesPatterns(t.contentAccessPatterns, currentPath),
      )
      return (
        <div className="flex flex-1 min-h-0">
          <CourseLessonSidebar
            course={course}
            currentPageSlug={pageSlug}
            progressMap={{}}
            isAuthenticated={isAuthenticated}
            hasActiveMembership={false}
          />
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <GatedContentCallout
              contentTitle={page.title}
              requiredTiers={grantingTiers.map((t) => ({
                id: t.id,
                name: t.name,
              }))}
              currentTierName={
                activeMemberships
                  .map((m) => m.tier?.name)
                  .filter(Boolean)
                  .join(', ') || undefined
              }
              isAuthenticated={true}
              upgradeHref={`/get-access?returnTo=${encodeURIComponent(currentPath)}`}
            />
          </main>
          <LessonMobileNav
            course={course}
            currentPageSlug={pageSlug}
            progressMap={{}}
            isAuthenticated={isAuthenticated}
            hasActiveMembership={false}
            actions={[]}
          />
        </div>
      )
    }
  }

  if (course.status === 'membership' && !hasActiveMembership && !isAdmin) {
    const tiers = await getActiveMembershipTiers()
    return (
      <div className="flex flex-1 min-h-0">
        <CourseLessonSidebar
          course={course}
          currentPageSlug={pageSlug}
          progressMap={{}}
          isAuthenticated={isAuthenticated}
          hasActiveMembership={false}
        />
        <main className="flex-1 flex items-center justify-center overflow-y-auto">
          <GetAccessClient
            returnTo={`/courses/${slug}/${pageSlug}`}
            tiers={tiers}
            allowWeb3Auth={appSettings?.allowWeb3Auth ?? false}
            allowSignup={appSettings?.allowSignup ?? false}
            signinMessage={appSettings?.web3SignInMessage ?? undefined}
            isAuthenticated={isAuthenticated}
            walletAddress={sessionData?.walletAddress ?? null}
            receiverWalletAddress={appSettings?.receiverWalletAddress ?? null}
          />
        </main>
        <LessonMobileNav
          course={course}
          currentPageSlug={pageSlug}
          progressMap={{}}
          isAuthenticated={isAuthenticated}
          hasActiveMembership={false}
          actions={[]}
        />
      </div>
    )
  }

  // Reason: course-level membership check — same merged tier pattern logic as the page check above.
  if (course.status === 'membership' && hasActiveMembership && !isAdmin) {
    // Reason: union all active tier patterns so users with multiple memberships get combined access.
    const mergedPatterns = activeMemberships.flatMap(
      (m) => m.tier?.contentAccessPatterns ?? [],
    )
    const currentPath = `/courses/${slug}`
    if (!matchesPatterns(mergedPatterns, currentPath)) {
      const allTiers = await getActiveMembershipTiers()
      const grantingTiers = allTiers.filter((t) =>
        matchesPatterns(t.contentAccessPatterns, currentPath),
      )
      return (
        <div className="flex flex-1 min-h-0">
          <CourseLessonSidebar
            course={course}
            currentPageSlug={pageSlug}
            progressMap={{}}
            isAuthenticated={isAuthenticated}
            hasActiveMembership={false}
          />
          <main className="flex-1 overflow-y-auto p-6 md:p-10">
            <GatedContentCallout
              contentTitle={course.title}
              requiredTiers={grantingTiers.map((t) => ({
                id: t.id,
                name: t.name,
              }))}
              currentTierName={
                activeMemberships
                  .map((m) => m.tier?.name)
                  .filter(Boolean)
                  .join(', ') || undefined
              }
              isAuthenticated={true}
              upgradeHref={`/get-access?returnTo=${encodeURIComponent(currentPath)}`}
            />
          </main>
          <LessonMobileNav
            course={course}
            currentPageSlug={pageSlug}
            progressMap={{}}
            isAuthenticated={isAuthenticated}
            hasActiveMembership={false}
            actions={[]}
          />
        </div>
      )
    }
  }

  const flatPages = buildFlatPageList(course)
  const currentIndex = flatPages.findIndex((p) => p.slug === pageSlug)
  const prevPage = currentIndex > 0 ? flatPages[currentIndex - 1] : null
  const nextPage =
    currentIndex < flatPages.length - 1 ? flatPages[currentIndex + 1] : null

  let progressMap: LessonProgressMap = {}
  if (sessionData?.id && course.id) {
    progressMap = await getLessonProgressMap(sessionData.id, course.id)
  }

  const initialCompletedAt = progressMap[pageSlug]?.completedAt ?? null

  // Build breadcrumb trail: Course → Chapter (if applicable) → Lesson
  const breadcrumbs: BreadcrumbItem[] = [
    { label: course.title, href: `/courses/${slug}` },
  ]
  const parentChapter = course.chapters?.find((ch) =>
    ch.pages.some((p) => p.slug === pageSlug),
  )
  if (parentChapter) {
    breadcrumbs.push({ label: parentChapter.title })
  }
  breadcrumbs.push({ label: page.title })

  // Build action configs (serializable — passed to both breadcrumb bar and mobile nav)
  const actions: PageActionConfig[] = []
  if (isAuthenticated) {
    actions.push({
      type: 'mark-as-read',
      show: 'authenticated',
    })
  }
  const attachmentItems: PageActionAttachment[] = (page.attachments ?? []).map(
    (att) => ({
      id: att.id,
      filename: att.filename,
      label: att.title ?? att.filename,
    }),
  )
  if (attachmentItems.length > 0) {
    actions.push({
      type: 'download-attachments',
      attachments: attachmentItems,
      show: 'public',
    })
  }

  const renderers: DocumentRendererProps['renderers'] = {
    block: {
      heading({ level, children, textAlign }) {
        const Comp = `h${level}` as const
        return (
          <Comp style={{ textAlign }} className="text-pretty">
            {children}
          </Comp>
        )
      },
      blockquote(props) {
        return <blockquote className="text-accent mb-4" {...props} />
      },
      paragraph(props) {
        return <p {...props} />
      },
      code({ children }) {
        return <CopyableCodeBlock>{children}</CopyableCodeBlock>
      },
    },
  }

  return (
    <ScopedThemeWrapper theme={course.theme ?? null} global>
      <LessonProgressProvider
        courseSlug={slug}
        pageSlug={pageSlug}
        initialCompletedAt={initialCompletedAt}
      >
        <div className="flex flex-1 min-h-0">
          <CourseLessonSidebar
            course={course}
            currentPageSlug={pageSlug}
            progressMap={progressMap}
            isAuthenticated={isAuthenticated}
            hasActiveMembership={hasActiveMembership}
          />
          <main
            id="lesson-main-content"
            className="flex-1 h-[calc(100svh-var(--header-height))] overflow-y-auto"
          >
            {isAuthenticated && (
              <PageViewTracker courseSlug={slug} pageSlug={pageSlug} />
            )}
            {page.customCss && (
              <style dangerouslySetInnerHTML={{ __html: page.customCss }} />
            )}
            {course.customCss && (
              <style dangerouslySetInnerHTML={{ __html: course.customCss }} />
            )}

            <LessonBreadcrumbBar
              breadcrumbs={breadcrumbs}
              actions={actions}
              isAuthenticated={isAuthenticated}
              isAdmin={sessionData?.isAdmin ?? false}
              themeId={course.theme?.id}
            />

            {page.heroEnabled && page.hero && (
              <Hero config={buildHeroConfig(page.hero)} />
            )}

            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 mt-4 md:mt-6 pb-20 md:pb-6">
              <ProseContent>
                {page.trustedHtml ? (
                  <TrustedHtmlBlock html={page.trustedHtml} />
                ) : (
                  page.content?.document != null && (
                    <DocumentRenderer
                      document={
                        page.content
                          .document as DocumentRendererProps['document']
                      }
                      renderers={renderers}
                    />
                  )
                )}
              </ProseContent>

              <PageAttachmentList attachments={page.attachments ?? []} />

              {/* Lesson footer: mark-as-read (center) flanked by prev/next */}
              <nav className="mt-16 grid grid-cols-3 items-center gap-4 border-t border-border pt-8 pb-4">
                {prevPage ? (
                  <a
                    href={`/courses/${slug}/${prevPage.slug}`}
                    className="flex flex-col gap-0.5 text-sm"
                  >
                    <span className="text-xs text-muted-foreground">
                      ← Previous
                    </span>
                    <span className="font-medium text-foreground hover:text-primary">
                      {prevPage.title}
                    </span>
                  </a>
                ) : (
                  <span />
                )}

                {isAuthenticated ? (
                  <div className="flex justify-center">
                    <MarkAsReadButton />
                  </div>
                ) : (
                  <span />
                )}

                {nextPage ? (
                  <a
                    href={`/courses/${slug}/${nextPage.slug}`}
                    className="flex flex-col items-end gap-0.5 text-sm"
                  >
                    <span className="text-xs text-muted-foreground">
                      Next →
                    </span>
                    <span className="font-medium text-foreground hover:text-primary">
                      {nextPage.title}
                    </span>
                  </a>
                ) : (
                  <span />
                )}
              </nav>
            </div>
          </main>

          {/* Mobile nav: scroll-aware bottom bar + sidebar drawer */}
          <LessonMobileNav
            course={course}
            currentPageSlug={pageSlug}
            progressMap={progressMap}
            isAuthenticated={isAuthenticated}
            isAdmin={sessionData?.isAdmin ?? false}
            hasActiveMembership={hasActiveMembership}
            actions={actions}
          />
        </div>
      </LessonProgressProvider>
    </ScopedThemeWrapper>
  )
}

function buildFlatPageList(course: CourseData): CoursePage[] {
  const seen = new Set<string>()
  const pages: CoursePage[] = []

  for (const chapter of course.chapters ?? []) {
    for (const page of chapter.pages ?? []) {
      if (!seen.has(page.id)) {
        seen.add(page.id)
        pages.push(page)
      }
    }
  }
  for (const page of course.pages ?? []) {
    if (!seen.has(page.id)) {
      seen.add(page.id)
      pages.push(page)
    }
  }

  return pages
}
