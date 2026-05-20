import type { Metadata } from 'next'
import Link from 'next/link'
import { getPageMetadata } from '~/lib/server/helpers'
import { BookOpen, CreditCard, Palette, Settings, Users } from 'lucide-react'
import { AuthPageShell } from '@/layouts/auth-page-shell'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('Admin')
}

export default function AdminPage() {
  return (
    <AuthPageShell
      footer={<p className="text-xs">- created with ♥ by colpitts.dev -</p>}
    >
      <div className="w-full">
        <h1 className="text-primary mb-4 text-2xl font-bold">Admins Only</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/admin/settings"
            className="group flex flex-col gap-2 rounded-xl border border-border p-6 transition-colors hover:border-primary"
          >
            <Settings className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Edit app configuration without restarting
            </p>
          </Link>
          <Link
            href="/admin/themes"
            className="group flex flex-col gap-2 rounded-xl border border-border p-6 transition-colors hover:border-primary"
          >
            <Palette className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Themes</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage app color themes
            </p>
          </Link>

          <Link
            href="/admin/community"
            className="group flex flex-col gap-2 rounded-xl border border-border p-6 transition-colors hover:border-primary"
          >
            <Users className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Community</h2>
            <p className="text-sm text-muted-foreground">
              Manage members and monitor growth
            </p>
          </Link>
          <Link
            href="/admin/content"
            className="group flex flex-col gap-2 rounded-xl border border-border p-6 transition-colors hover:border-primary"
          >
            <BookOpen className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Content</h2>
            <p className="text-sm text-muted-foreground">
              Manage page routes, pages, and courses.
            </p>
          </Link>

          <Link
            href="/admin/membership-tiers"
            className="group flex flex-col gap-2 rounded-xl border border-border p-6 transition-colors hover:border-primary"
          >
            <CreditCard className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Membership Tiers</h2>
            <p className="text-sm text-muted-foreground">
              Manage pricing tiers and Stripe products
            </p>
          </Link>
        </div>
      </div>
    </AuthPageShell>
  )
}
