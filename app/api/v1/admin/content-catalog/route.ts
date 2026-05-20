import { NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'

// Reason: admin auth is enforced automatically by apiHandler via authMiddleware,
// which rejects non-admin sessions for any path containing '/admin/'.
async function getContentCatalog(): Promise<NextResponse> {
  const [courses, pages, pageIndexes] = await Promise.all([
    keystoneContext.sudo().query.Course.findMany({
      query: 'id slug title',
      orderBy: [{ title: 'asc' }],
    }),
    keystoneContext.sudo().query.Page.findMany({
      query: 'id slug title',
      orderBy: [{ title: 'asc' }],
    }),
    keystoneContext.sudo().query.PageIndex.findMany({
      query: 'id slug basePath title',
      orderBy: [{ title: 'asc' }],
    }),
  ])

  return NextResponse.json({
    courses: (
      courses as Array<{ id: string; slug: string; title: string }>
    ).map((c) => ({ id: c.id, slug: c.slug, title: c.title })),
    pages: (pages as Array<{ id: string; slug: string; title: string }>).map(
      (p) => ({ id: p.id, slug: p.slug, title: p.title }),
    ),
    pageIndexes: (
      pageIndexes as Array<{
        id: string
        slug: string
        basePath: string
        title: string
      }>
    ).map((i) => ({
      id: i.id,
      slug: i.slug,
      basePath: i.basePath ?? '',
      title: i.title,
    })),
  })
}

export const GET = apiHandler(getContentCatalog)
