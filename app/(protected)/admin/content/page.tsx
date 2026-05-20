import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getHeroesList } from '@/server/helpers/get-heroes-list'
import { keystoneContext } from '@/server/keystone/context'
import type { CourseListItem } from '@/types/course'
import type { PageListItem } from '@/types/page'
import type { PageIndexListItem } from '@/types/page-index'
import { ContentHub } from './components/content-hub'

export const metadata: Metadata = { title: 'Content' }

export default async function ContentPage() {
  const [rawPageIndexes, rawCourses, rawPages, heroes] = await Promise.all([
    keystoneContext.sudo().db.PageIndex.findMany({
      orderBy: [{ title: 'asc' }],
    }),
    keystoneContext.sudo().query.Course.findMany({
      query: 'id title slug status heroEnabled chapters { id }',
      orderBy: [{ title: 'asc' }],
    }),
    keystoneContext.sudo().db.Page.findMany({
      orderBy: [{ title: 'asc' }],
    }),
    getHeroesList(),
  ])

  const pageIndexes: PageIndexListItem[] = rawPageIndexes.map((item) => ({
    id: item.id,
    title: item.title ?? '',
    slug: item.slug ?? '',
    basePath: item.basePath ?? '',
    status: item.status ?? 'draft',
    pageCount: 0,
  }))

  const courses: CourseListItem[] = (
    rawCourses as Array<{
      id: string
      title: string
      slug: string
      status: string | null
      heroEnabled: boolean | null
      chapters: unknown[]
    }>
  ).map((c) => ({
    id: c.id,
    title: c.title ?? '',
    slug: c.slug ?? '',
    status: c.status ?? 'draft',
    heroEnabled: c.heroEnabled ?? false,
    chapterCount: Array.isArray(c.chapters) ? c.chapters.length : 0,
  }))

  const pages: PageListItem[] = rawPages.map((p) => ({
    id: p.id,
    title: p.title ?? '',
    slug: p.slug ?? '',
    status: p.status ?? 'draft',
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  }))

  return (
    <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 space-y-6 overflow-x-hidden">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold">Content</h1>
        <p className="text-muted-foreground mt-1">
          Manage page routes, courses, pages, and heroes
        </p>
      </div>
      <ContentHub
        pageIndexes={
          JSON.parse(JSON.stringify(pageIndexes)) as PageIndexListItem[]
        }
        courses={JSON.parse(JSON.stringify(courses)) as CourseListItem[]}
        pages={JSON.parse(JSON.stringify(pages)) as PageListItem[]}
        heroes={JSON.parse(JSON.stringify(heroes))}
      />
    </section>
  )
}
