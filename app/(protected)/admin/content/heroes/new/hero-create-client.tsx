'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HeroFormState } from '@/types/page-index'
import { HeroEditor } from '@/ui/hero-editor'
import { defaultHeroFormState } from '@/ui/hero-form-section'
import { HeroPreviewCard } from '@/ui/hero-preview-card'

export function HeroCreateClient() {
  const router = useRouter()
  const [liveForm, setLiveForm] = useState<HeroFormState>(() =>
    defaultHeroFormState(),
  )

  function handleCreated(heroId: string) {
    router.push(`/admin/content/heroes/${heroId}`)
  }

  return (
    <div className="space-y-6">
      <div className="max-w-xl">
        <HeroPreviewCard value={liveForm} />
      </div>

      <HeroEditor
        parentEndpoint="/api/v1/admin/heroes"
        initialHero={null}
        onHeroCreated={handleCreated}
        onFormChange={setLiveForm}
        skipLink={true}
      />
    </div>
  )
}
