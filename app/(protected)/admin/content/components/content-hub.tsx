'use client'

import { useState } from 'react'
import { BookOpen, FileText, GraduationCap, Sparkles } from 'lucide-react'
import type { HeroListItem } from '@/server/helpers/get-heroes-list'
import type { CourseListItem } from '@/types/course'
import type { PageListItem } from '@/types/page'
import type { PageIndexListItem } from '@/types/page-index'
import { PageIndexTableSection } from '../../page-indexes/components/page-index-table-section'
import { CourseTableSection } from '../courses/components/course-table-section'
import { PageTableSection } from '../pages/components/page-table-section'
import { HeroesSection } from './heroes-section'

type Tab = 'page-indexes' | 'courses' | 'pages' | 'heroes'

interface ContentHubProps {
  pageIndexes: PageIndexListItem[]
  courses: CourseListItem[]
  pages: PageListItem[]
  heroes: HeroListItem[]
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'page-indexes',
    label: 'Page Routes',
    icon: <BookOpen className="size-4" />,
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: <GraduationCap className="size-4" />,
  },
  { id: 'pages', label: 'Pages', icon: <FileText className="size-4" /> },
  { id: 'heroes', label: 'Heroes', icon: <Sparkles className="size-4" /> },
]

export function ContentHub({
  pageIndexes,
  courses,
  pages,
  heroes,
}: ContentHubProps) {
  const [activeTab, setActiveTab] = useState<Tab>('page-indexes')

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
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'page-indexes' && (
        <PageIndexTableSection
          items={pageIndexes}
          getEditHref={(item) => `/admin/content/page-indexes/${item.id}`}
        />
      )}

      {activeTab === 'courses' && <CourseTableSection items={courses} />}

      {activeTab === 'pages' && <PageTableSection items={pages} />}

      {activeTab === 'heroes' && <HeroesSection heroes={heroes} />}
    </div>
  )
}
