export const pageIndexes = [
  {
    title: 'Home',
    slug: 'home',
    basePath: '',
    status: 'published' as const,
    heroEnabled: true,
    hero: {
      create: {
        heroFullscreen: true,
        heroEyebrow: 'Open Source Community Engagement',
        heroTitle: 'An open source community engagement platform',
        heroTitleHighlight: 'community engagement platform',
        heroDescription:
          'hyperlocal gives you everything you need to build, brand, and monetize your own private community — on your domain, on your terms.',
        heroCtaLabel: 'Get Started',
        heroCtaHref: '/get-access',
        heroSecondaryLabel: 'View Example Course',
        heroSecondaryHref: '/courses/example-course',
        heroStat1Value: 'Open',
        heroStat1Label: 'Source',
        heroStat2Value: '100%',
        heroStat2Label: 'Self-hosted',
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
