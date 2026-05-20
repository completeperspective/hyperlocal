import type { Page } from '@prisma/client'
import type { JsonValue } from '@prisma/client/runtime/library'
import type { ThemeColors } from '@/types/client'
import type { HeroData } from '@/types/hero'

export interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export interface Attachment {
  id: string
  title: string | null
  filename: string
  mimeType: string | null
  format: string | null
  bytes: number | null
}

export interface PageData extends Page {
  heroEnabled: boolean
  content: { [Key in string]?: JsonValue }
  trustedHtml: string
  customCss: string
  attachments?: Attachment[]
  ogImage?: {
    id: string
    title: string | null
    source?: { publicUrl?: string }
  } | null
  theme?: {
    id: string
    name: string
    lightMode: ThemeColors
    darkMode: ThemeColors
    radius: string
    fontHeading: string
    fontBody: string
  } | null
  hero?: HeroData | null
}

// Minimum shape accepted by getPageMetadata — both PageData and CourseData satisfy this
export interface PageMetadataInput {
  title?: string | null
  description?: string | null
  slug?: string | null
}

export interface PageListItem {
  id: string
  title: string
  slug: string
  status: string
  publishedAt: string | null
}
