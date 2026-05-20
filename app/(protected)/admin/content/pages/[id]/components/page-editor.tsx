'use client'

import { useState } from 'react'
import type { PageData } from '@/types/page'
import type { HeroFormState } from '@/types/page-index'
import { ContentPanel } from '@/ui/content-panel'
import type { ThemeSummary } from '@/ui/theme-selector'
import { HeroPanel } from './hero-panel'
import { SeoPanel } from './seo-panel'
import { SettingsPanel } from './settings-panel'

type Tab = 'settings' | 'seo' | 'hero' | 'content'

const TABS: { id: Tab; label: string }[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'seo', label: 'SEO' },
  { id: 'hero', label: 'Hero' },
  { id: 'content', label: 'Content' },
]

interface PageEditorProps {
  data: PageData
  themes: ThemeSummary[]
  initialThemeId: string | null
  onThemeChange?: (id: string | null) => void
  onHeroFormChange?: (form: HeroFormState | null) => void
  onHeroEnabledChange?: (enabled: boolean) => void
}

export function PageEditor({
  data,
  themes,
  initialThemeId,
  onThemeChange,
  onHeroFormChange,
  onHeroEnabledChange,
}: PageEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('settings')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'relative px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.label}
            {tab.id === 'hero' && data.heroEnabled && (
              <span
                className="absolute top-2 right-1.5 size-1.5 rounded-full bg-positive"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>

      <div className={activeTab === 'content' ? '' : 'max-w-xl'}>
        {activeTab === 'settings' && (
          <SettingsPanel
            pageId={data.id}
            initialData={data}
            themes={themes}
            initialThemeId={initialThemeId}
            onThemeChange={onThemeChange}
          />
        )}
        {activeTab === 'seo' && (
          <SeoPanel pageId={data.id} initialData={data} />
        )}
        {activeTab === 'hero' && (
          <HeroPanel
            pageId={data.id}
            initialData={data}
            onFormChange={onHeroFormChange}
            onHeroEnabledChange={onHeroEnabledChange}
          />
        )}
        {activeTab === 'content' && (
          <ContentPanel
            endpoint={`/api/v1/admin/pages/${data.id}`}
            initialTrustedHtml={data.trustedHtml}
            initialCustomCss={data.customCss}
          />
        )}
      </div>
    </div>
  )
}
