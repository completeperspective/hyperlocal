import Link from 'next/link'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { keystoneContext } from '@/server/keystone/context'
import { Button } from '@/ui/button'
import { ImportThemePanel } from './components/import-theme-panel'

interface Theme {
  id: string
  name: string
  lightMode: Record<string, string> | null
  darkMode: Record<string, string> | null
}

function ThemeSwatches({
  lightMode,
}: {
  lightMode: Record<string, string> | null
}) {
  const keys = ['primary', 'secondary', 'accent', 'background']
  return (
    <div className="flex gap-1">
      {keys.map((key) => {
        const color = lightMode?.[key]
        return (
          <div
            key={key}
            className="w-6 h-6 rounded border border-border"
            style={{ background: color ?? 'transparent' }}
            title={key}
          />
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-muted-foreground text-lg mb-6">No themes yet.</p>
      <Link href="/admin/themes/create">
        <Button>
          <Plus className="size-4 mr-2" /> Create your first theme
        </Button>
      </Link>
    </div>
  )
}

export default async function ThemesPage() {
  const themes = (await keystoneContext.sudo().db.Theme.findMany({
    orderBy: [{ id: 'asc' }],
  })) as unknown as Theme[]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Themes</h1>
          <p className="text-muted-foreground mt-1">
            Manage your app color themes
          </p>
        </div>
        <Link href="/admin/themes/create">
          <Button>
            <Plus className="size-4 mr-2" /> New Theme
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <ImportThemePanel />
      </div>

      {themes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{theme.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {theme.lightMode ? Object.keys(theme.lightMode).length : 0}{' '}
                    light tokens
                  </p>
                </div>
                <ThemeSwatches lightMode={theme.lightMode} />
              </div>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/admin/themes/${theme.id}/edit`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Edit
                  </Button>
                </Link>
                <form
                  action={async () => {
                    'use server'
                    await keystoneContext
                      .sudo()
                      .db.Theme.deleteOne({ where: { id: theme.id } })
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
