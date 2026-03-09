import { Metadata } from 'next'
import { AppSettings } from '~/lib/server/helpers/AppSettings'
import { getPageMetadata } from '~/lib/server/helpers/get-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('Dashboard')
}

export default async function DashboardPage() {
  const appSettings = await AppSettings.instance.settings()
  return (
    <div className="gap-16 p-4 pb-20 sm:p-20 grid min-h-[calc(100vh-65px)] grid-rows-[20px_1fr_20px] items-center justify-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="gap-4 row-start-2 flex flex-col">
        <h1 className="text-primary">Private Dashboard</h1>
        <p className="max-w-lg mb-4">
          Members only, requires authentication to view.
        </p>
      </main>
      <footer className="gap-6 row-start-3 flex flex-wrap items-center justify-center">
        <p className="text-xs text-gray-400">
          {appSettings?.isPrivate ? '' : appSettings?.copyright}
        </p>
      </footer>
    </div>
  )
}

export const dynamic = 'force-dynamic'
