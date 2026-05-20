import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AppSettings } from '@/server/helpers/AppSettings'
import { keystoneContext } from '@/server/keystone/context'
import { SettingsForm } from './settings-form'

export const metadata: Metadata = { title: 'App Settings' }

export default async function AdminSettingsPage() {
  const [settings, themes, rawPageIndexes, rawCourses] = await Promise.all([
    AppSettings.instance.settings(),
    keystoneContext.sudo().db.Theme.findMany({ orderBy: [{ name: 'asc' }] }),
    keystoneContext.sudo().db.PageIndex.findMany({
      orderBy: [{ title: 'asc' }],
    }),
    keystoneContext.sudo().db.Course.findMany({ orderBy: [{ title: 'asc' }] }),
  ])
  const lastReloadedAt =
    AppSettings.instance.lastReloadedAt?.toISOString() ?? null

  const pageIndexes = rawPageIndexes.map((pi) => ({
    id: pi.id,
    title: pi.title ?? '',
    slug: pi.slug ?? '',
    basePath: pi.basePath ?? '',
  }))

  const courses = rawCourses.map((c) => ({
    id: c.id,
    title: c.title ?? '',
    slug: c.slug ?? '',
  }))

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold">App Settings</h1>
        <p className="text-muted-foreground mt-1">
          Changes persist to the database and reload immediately — no restart
          required.
        </p>
      </div>
      <SettingsForm
        initialValues={settings}
        themes={themes as unknown as { id: string; name: string }[]}
        pageIndexes={pageIndexes}
        courses={courses}
        lastReloadedAt={lastReloadedAt}
      />
    </div>
  )
}
