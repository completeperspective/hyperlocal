import type { JsonValue } from '@prisma/client/runtime/library'
import type { ThemeColors } from '@/types/client'
import type { HeroData } from '@/types/hero'

export interface HeroStat {
  label: string
  value: string
}

export interface HeroPalette {
  /** Hex color — drives bottom-center glow (dominant color) */
  primary: string
  /** Hex color — drives top-right glow */
  secondary: string
  /** Hex color — drives bottom-left glow */
  accent: string
}

export interface HeroConfig {
  eyebrow?: string
  title?: string
  /** Word/phrase within title to apply gradient highlight */
  titleHighlight?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  stats?: HeroStat[]
  /** URL for hero visual image (right-column panel) */
  image?: string
  imageBadgeTitle?: string
  imageBadgeSubtitle?: string
  /** Full-bleed hero background image — desktop (relative to /public or absolute URL) */
  backgroundImage?: string
  /** Full-bleed hero background image — mobile override; falls back to backgroundImage */
  backgroundImageMobile?: string
  /** Pre-extracted palette; when present, overrides CSS-var colors in gradient glows */
  palette?: HeroPalette
  /** Stretch hero to full viewport height */
  fullscreen?: boolean
  /** Hide the subtle grid overlay on the hero background */
  hideGrid?: boolean
}

export interface CoursePage {
  id: string
  title: string
  slug: string
  status: string
}

export interface CourseChapter {
  id: string
  title: string
  sortOrder: number
  pages: CoursePage[]
}

// HeroFieldSource is kept for backward-compat during the migration window.
// HeroData satisfies this interface — callers should migrate to HeroData.
export interface HeroFieldSource {
  heroEyebrow?: string | null
  heroTitle?: string | null
  heroTitleHighlight?: string | null
  heroDescription?: string | null
  heroCtaLabel?: string | null
  heroCtaHref?: string | null
  heroSecondaryLabel?: string | null
  heroSecondaryHref?: string | null
  heroStat1Value?: string | null
  heroStat1Label?: string | null
  heroStat2Value?: string | null
  heroStat2Label?: string | null
  heroStat3Value?: string | null
  heroStat3Label?: string | null
  heroImage?: string | null
  heroImageBadgeTitle?: string | null
  heroImageBadgeSubtitle?: string | null
  heroBackgroundImage?: string | null
  heroBackgroundImageMobile?: string | null
}

/** Assembles a HeroConfig object from a HeroData record. Callers must check heroEnabled on the parent entity before calling. */
export function buildHeroConfig(course: HeroData): HeroConfig {
  const stats: HeroStat[] = []
  if (course.heroStat1Value && course.heroStat1Label)
    stats.push({ value: course.heroStat1Value, label: course.heroStat1Label })
  if (course.heroStat2Value && course.heroStat2Label)
    stats.push({ value: course.heroStat2Value, label: course.heroStat2Label })
  if (course.heroStat3Value && course.heroStat3Label)
    stats.push({ value: course.heroStat3Value, label: course.heroStat3Label })
  return {
    eyebrow: course.heroEyebrow ?? undefined,
    title: course.heroTitle ?? undefined,
    titleHighlight: course.heroTitleHighlight ?? undefined,
    description: course.heroDescription ?? undefined,
    ctaLabel: course.heroCtaLabel ?? undefined,
    ctaHref: course.heroCtaHref ?? undefined,
    secondaryLabel: course.heroSecondaryLabel ?? undefined,
    secondaryHref: course.heroSecondaryHref ?? undefined,
    stats: stats.length > 0 ? stats : undefined,
    image: course.heroImage ?? undefined,
    imageBadgeTitle: course.heroImageBadgeTitle ?? undefined,
    imageBadgeSubtitle: course.heroImageBadgeSubtitle ?? undefined,
    backgroundImage: course.heroBackgroundImage ?? undefined,
    backgroundImageMobile: course.heroBackgroundImageMobile ?? undefined,
    fullscreen: course.heroFullscreen ?? false,
    hideGrid: course.heroHideGrid ?? false,
  }
}

export interface CourseData {
  id: string
  title: string
  description?: string | null
  slug: string
  status: string
  publishedAt?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  heroEnabled: boolean
  hero?: HeroData | null
  theme?: {
    id: string
    name: string
    lightMode: ThemeColors
    darkMode: ThemeColors
    radius: string
    fontHeading: string
    fontBody: string
  } | null
  content?: { [Key in string]?: JsonValue } | null
  trustedHtml?: string | null
  customCss?: string | null
  chapters: CourseChapter[]
  pages: CoursePage[]
}

export interface CourseListItem {
  id: string
  title: string
  slug: string
  status: string
  heroEnabled: boolean
  chapterCount: number
}

export interface LearnerProfile {
  id: string
  userId: string
  totalLessonsCompleted: number
  totalCoursesCompleted: number
  lastActiveAt: string | null
  learningPreferences: Record<string, unknown>
}

export interface CourseEnrollment {
  id: string
  courseId: string
  userId: string
  enrolledAt: string
  lastAccessedAt: string | null
  status: 'enrolled' | 'in_progress' | 'completed'
  completedAt: string | null
}

export interface CourseLessonProgress {
  id: string
  userId: string
  courseId: string
  pageId: string
  viewCount: number
  firstViewedAt: string | null
  lastViewedAt: string | null
  completedAt: string | null
}

/** Per-lesson progress keyed by page slug for efficient sidebar lookup. */
export type LessonProgressMap = Record<string, CourseLessonProgress>

export interface CourseProgressStats {
  courseId: string
  courseTitle: string
  courseSlug: string
  courseStatus: string
  totalLessons: number
  lessonsViewed: number
  lessonsCompleted: number
  completionPercent: number
  lastAccessedAt: string | null
  enrollmentStatus: 'enrolled' | 'in_progress' | 'completed'
  /** Slug of first unread lesson for "Continue" CTA; null if all complete */
  continueLessonSlug: string | null
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageActionAttachment {
  id: string
  filename: string
  label: string
}

/**
 * Discriminated union — fully serializable from server to client (no functions).
 * Extend this union to add new action types.
 */
export type PageActionConfig =
  | {
      type: 'mark-as-read'
      show?: 'public' | 'authenticated' | 'admin'
    }
  | {
      type: 'download-attachments'
      attachments: PageActionAttachment[]
      show?: 'public' | 'authenticated' | 'admin'
    }
