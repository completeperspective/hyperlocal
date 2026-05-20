import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CourseLessonPage from './page'

const {
  mockNotFound,
  mockGetSession,
  mockSettings,
  mockGetCourseLessonData,
  mockGetActiveMemberships,
  mockGetActiveMembershipTiers,
} = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  mockGetSession: vi.fn(),
  mockSettings: vi.fn(),
  mockGetCourseLessonData: vi.fn(),
  mockGetActiveMemberships: vi.fn(),
  mockGetActiveMembershipTiers: vi.fn(),
}))

vi.mock('next/navigation', () => ({ notFound: mockNotFound }))
vi.mock('@/server/auth', () => ({ getSession: mockGetSession }))
vi.mock('@/server/helpers', () => ({
  AppSettings: { instance: { settings: mockSettings } },
  getCourseLessonData: mockGetCourseLessonData,
}))
vi.mock('@/server/helpers/get-course-progress', () => ({
  getLessonProgressMap: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/server/payments/membership', () => ({
  getActiveMemberships: mockGetActiveMemberships,
  getActiveMembershipTiers: mockGetActiveMembershipTiers,
}))
vi.mock('@/ui/gated-content-callout', () => ({
  GatedContentCallout: () => <div data-testid="gated-content-callout" />,
}))
vi.mock('@/ui/course-lesson-sidebar', () => ({
  CourseLessonSidebar: () => <div data-testid="course-lesson-sidebar" />,
}))
vi.mock('@/ui/lesson-mobile-nav', () => ({
  LessonMobileNav: () => <div data-testid="lesson-mobile-nav" />,
}))
vi.mock('@/ui/lesson-breadcrumb-bar', () => ({
  LessonBreadcrumbBar: () => <div data-testid="lesson-breadcrumb-bar" />,
}))
vi.mock('@/ui/mark-as-read-button', () => ({
  MarkAsReadButton: () => <div data-testid="mark-as-read-button" />,
}))
vi.mock('@/ui/page-attachment-list', () => ({
  PageAttachmentList: () => null,
}))
vi.mock('@/ui/page-view-tracker', () => ({
  PageViewTracker: () => null,
}))
vi.mock('@/ui/trusted-html-block', () => ({
  TrustedHtmlBlock: () => <div data-testid="trusted-html-block" />,
}))
vi.mock('@/ui/copyable-code-block', () => ({
  CopyableCodeBlock: ({ children }: { children: React.ReactNode }) => (
    <pre>{children}</pre>
  ),
}))
vi.mock('@/components/providers/lesson-progress-provider', () => ({
  LessonProgressProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))
vi.mock('~/app/(public)/get-access/get-access-client', () => ({
  GetAccessClient: () => <div data-testid="get-access-client" />,
}))
vi.mock('@keystone-6/document-renderer', () => ({
  DocumentRenderer: () => <div data-testid="document-renderer" />,
}))

const baseSettings = {
  isPrivate: false,
  allowWeb3Auth: false,
  allowSignup: true,
}
const baseCourse = {
  id: 'c1',
  slug: 'intro-101',
  title: 'Intro 101',
  status: 'published',
  chapters: [
    {
      id: 'ch1',
      title: 'Chapter 1',
      pages: [
        { id: 'pg1', slug: 'lesson-1', title: 'Lesson 1', status: 'published' },
      ],
    },
  ],
  customCss: '',
  trustedHtml: '',
}
const basePage = {
  id: 'pg1',
  slug: 'lesson-1',
  title: 'Lesson 1',
  status: 'published',
  content: null,
  trustedHtml: '',
  customCss: '',
  description: '',
  attachments: [],
}

const params = Promise.resolve({ slug: 'intro-101', 'page-slug': 'lesson-1' })

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue({ data: null })
  mockSettings.mockResolvedValue(baseSettings)
  mockGetCourseLessonData.mockResolvedValue({
    course: baseCourse,
    page: basePage,
  })
  mockGetActiveMemberships.mockResolvedValue([])
  mockGetActiveMembershipTiers.mockResolvedValue([])
})

describe('CourseLessonPage', () => {
  it('renders lesson content for a published page', async () => {
    const jsx = await CourseLessonPage({ params })
    render(jsx)
    screen.getByTestId('lesson-breadcrumb-bar')
  })

  describe('page-level membership gating', () => {
    it('shows GetAccessClient when page is membership-only and user has no active membership', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: baseCourse,
        page: { ...basePage, status: 'membership' },
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([])
      mockGetActiveMembershipTiers.mockResolvedValue([
        { id: 't1', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
      ])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      screen.getByTestId('get-access-client')
    })

    it('renders GatedContentCallout when page is membership-only and tier patterns do not match lesson path', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: baseCourse,
        page: { ...basePage, status: 'membership' },
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([
        {
          tier: {
            id: 't1',
            name: 'Basic',
            contentAccessPatterns: ['/pages/**'],
          },
        },
      ])
      mockGetActiveMembershipTiers.mockResolvedValue([
        { id: 't2', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
      ])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      expect(screen.getByTestId('gated-content-callout')).toBeInTheDocument()
      expect(
        screen.queryByTestId('lesson-breadcrumb-bar'),
      ).not.toBeInTheDocument()
    })

    it('renders lesson when page is membership-only and tier patterns include /courses/**', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: baseCourse,
        page: { ...basePage, status: 'membership' },
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([
        {
          tier: {
            id: 't1',
            name: 'Pro',
            contentAccessPatterns: ['/courses/**'],
          },
        },
      ])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      screen.getByTestId('lesson-breadcrumb-bar')
    })

    it('grants access when combined patterns across two memberships cover the lesson path', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: baseCourse,
        page: { ...basePage, status: 'membership' },
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([
        {
          tier: {
            id: 't1',
            name: 'Course A Pass',
            contentAccessPatterns: ['/courses/other/**'],
          },
        },
        {
          tier: {
            id: 't2',
            name: 'Course B Pass',
            contentAccessPatterns: ['/courses/intro-101/**'],
          },
        },
      ])
      const jsx = await CourseLessonPage({ params })
      render(jsx)
      screen.getByTestId('lesson-breadcrumb-bar')
    })

    it('shows GatedContentCallout when two memberships exist but neither covers the lesson path', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: baseCourse,
        page: { ...basePage, status: 'membership' },
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([
        {
          tier: {
            id: 't1',
            name: 'Basic',
            contentAccessPatterns: ['/pages/**'],
          },
        },
        {
          tier: {
            id: 't2',
            name: 'Starter',
            contentAccessPatterns: ['/blog/**'],
          },
        },
      ])
      mockGetActiveMembershipTiers.mockResolvedValue([
        { id: 't3', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
      ])
      const jsx = await CourseLessonPage({ params })
      render(jsx)
      screen.getByTestId('gated-content-callout')
    })

    it('renders lesson for admin even when page is membership-only and admin has no membership', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: baseCourse,
        page: { ...basePage, status: 'membership' },
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: true, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      expect(screen.getByTestId('lesson-breadcrumb-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('get-access-client')).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('gated-content-callout'),
      ).not.toBeInTheDocument()
    })
  })

  describe('course-level membership gating', () => {
    it('shows GetAccessClient when course is membership-only and user has no active membership', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: { ...baseCourse, status: 'membership' },
        page: basePage,
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([])
      mockGetActiveMembershipTiers.mockResolvedValue([
        { id: 't1', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
      ])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      screen.getByTestId('get-access-client')
    })

    it('renders GatedContentCallout when course is membership-only and tier patterns do not match course path', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: { ...baseCourse, status: 'membership' },
        page: basePage,
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([
        {
          tier: {
            id: 't1',
            name: 'Basic',
            contentAccessPatterns: ['/pages/**'],
          },
        },
      ])
      mockGetActiveMembershipTiers.mockResolvedValue([
        { id: 't2', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
      ])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      expect(screen.getByTestId('gated-content-callout')).toBeInTheDocument()
      expect(
        screen.queryByTestId('lesson-breadcrumb-bar'),
      ).not.toBeInTheDocument()
    })

    it('renders lesson when course is membership-only and tier has /courses/intro-101/** (matches course root)', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: { ...baseCourse, status: 'membership' },
        page: basePage,
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([
        {
          tier: {
            id: 't1',
            name: 'Pro',
            contentAccessPatterns: ['/courses/intro-101/**'],
          },
        },
      ])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      screen.getByTestId('lesson-breadcrumb-bar')
    })

    it('renders lesson for admin even when course is membership-only and admin has no membership', async () => {
      mockGetCourseLessonData.mockResolvedValue({
        course: { ...baseCourse, status: 'membership' },
        page: basePage,
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: true, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([])

      const jsx = await CourseLessonPage({ params })
      render(jsx)
      expect(screen.getByTestId('lesson-breadcrumb-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('get-access-client')).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('gated-content-callout'),
      ).not.toBeInTheDocument()
    })
  })
})
