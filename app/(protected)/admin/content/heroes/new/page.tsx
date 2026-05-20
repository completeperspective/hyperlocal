import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { HeroCreateClient } from './hero-create-client'

export const metadata: Metadata = { title: 'Create Hero' }

export default function HeroNewPage() {
  return (
    <section className="w-full p-4 max-w-4xl sm:mx-auto space-y-6 overflow-x-hidden">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/content"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Content
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-muted-foreground">Heroes</span>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold">New Hero</h1>
      </div>

      <HeroCreateClient />
    </section>
  )
}
