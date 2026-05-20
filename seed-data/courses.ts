export const courses = [
  {
    title: 'Example Course',
    description:
      'A sample course demonstrating the hyperlocal content platform.',
    slug: 'example-course',
    publishedAt: '2026-05-19T00:00:00.000Z',
    status: 'published',
    heroEnabled: true,
    hero: {
      create: {
        heroEyebrow: 'Start Learning',
        heroTitle: 'An example course to get you started',
        heroTitleHighlight: 'example course',
        heroDescription:
          'Two chapters, four lessons — just enough structure to show how hyperlocal organizes course content.',
        heroCtaLabel: 'Start the Course',
        heroCtaHref: '/courses/example-course',
        heroSecondaryLabel: 'Jump to Lesson 1',
        heroSecondaryHref: '/courses/example-course/example-lesson-one',
        heroStat1Value: '4',
        heroStat1Label: 'Lessons',
        heroStat2Value: '2',
        heroStat2Label: 'Chapters',
        heroStat3Value: 'Your',
        heroStat3Label: 'Community',
        heroImage: '/images/og-image.png',
        heroImageBadgeTitle: 'Hyperlocal',
        heroImageBadgeSubtitle: 'Own Your Community',
        heroBackgroundImage: '/images/hero-bg-desktop.png',
        heroBackgroundImageMobile: '/images/hero-bg-mobile.png',
      },
    },
  },
]

// Chapters to create after the course exists.
// Key = course slug; value = ordered chapter definitions.
// Each chapter's pages are identified by slug and must already exist in the DB.
export const courseChaptersBySlug: Record<
  string,
  { title: string; sortOrder: number; pageSlugs: string[] }[]
> = {
  'example-course': [
    {
      title: 'Chapter One',
      sortOrder: 1,
      pageSlugs: ['example-lesson-one', 'example-lesson-two'],
    },
    {
      title: 'Chapter Two',
      sortOrder: 2,
      pageSlugs: ['example-lesson-three', 'example-lesson-four'],
    },
  ],
}
