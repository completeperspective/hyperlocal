import type { Metadata } from 'next'
import { keystoneContext } from '@/server/keystone/context'
import type { PageIndexListItem } from '@/types/page-index'
import { PageIndexTableSection } from './components/page-index-table-section'

export const metadata: Metadata = { title: 'Page Indexes' }

export default async function PageIndexesPage() {
  const raw = await keystoneContext.sudo().db.PageIndex.findMany({
    orderBy: [{ title: 'asc' }],
  })

  const items: PageIndexListItem[] = raw.map((item) => ({
    id: item.id,
    title: item.title ?? '',
    slug: item.slug ?? '',
    basePath: item.basePath ?? '',
    status: item.status ?? 'draft',
    pageCount: 0,
  }))

  // Reason: Keystone returns Proxy objects; JSON round-trip makes them safe to pass to client components
  const plainItems = JSON.parse(JSON.stringify(items)) as PageIndexListItem[]

  return (
    <section className="p-4 max-w-6xl sm:mx-auto space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Page Indexes</h1>
          <p className="text-muted-foreground mt-1">
            Manage custom URL collections of pages
          </p>
        </div>
      </div>
      <PageIndexTableSection items={plainItems} />
    </section>
  )
}
