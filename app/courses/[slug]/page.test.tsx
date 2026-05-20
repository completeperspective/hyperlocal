import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CourseSlugPage from './page'

const {
  mockNotFound,
  mockGetSession,
  mockSettings,
  mockGetCourseData,
  mockGetActiveMemberships,
  mockGetActiveMembershipTiers,
} = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  mockGetSession: vi.fn(),
  mockSettings: vi.fn(),
  mockGetCourseData: vi.fn(),
  mockGetActiveMemberships: vi.fn(),
  mockGetActiveMembershipTiers: vi.fn(),
}))

vi.mock('next/navigation', () => ({ notFound: mockNotFound }))
vi.mock('@/server/auth', () => ({ getSession: mockGetSession }))
vi.mock('@/server/helpers', () => ({
  AppSettings: { instance: { settings: mockSettings } },
  getCourseData: mockGetCourseData,
  getPageMetadata: vi.fn().mockResolvedValue({}),
  getLessonProgressMap: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/server/payments/membership', () => ({
  getActiveMemberships: mockGetActiveMemberships,
  getActiveMembershipTiers: mockGetActiveMembershipTiers,
}))
vi.mock('@/server/pages/course-page', () => ({
  CoursePageRenderer: () => <div data-testid="course-page-renderer" />,
}))
vi.mock('~/app/(public)/get-access/get-access-client', () => ({
  GetAccessClient: () => <div data-testid="get-access-client" />,
}))
vi.mock('@/ui/gated-content-callout', () => ({
  GatedContentCallout: () => <div data-testid="gated-content-callout" />,
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
  heroEnabled: false,
  trustedHtml: '',
  chapters: [],
  pages: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue({ data: null })
  mockSettings.mockResolvedValue(baseSettings)
  mockGetCourseData.mockResolvedValue(baseCourse)
  mockGetActiveMemberships.mockResolvedValue([])
  mockGetActiveMembershipTiers.mockResolvedValue([])
})

describe('CourseSlugPage', () => {
  it('renders CoursePageRenderer for a published course', async () => {
    const jsx = await CourseSlugPage({
      params: Promise.resolve({ slug: 'intro-101' }),
    })
    render(jsx)
    screen.getByTestId('course-page-renderer')
  })

  describe('membership gating', () => {
    it('shows GetAccessClient when course is membership-only and user has no active membership', async () => {
      mockGetCourseData.mockResolvedValue({
        ...baseCourse,
        status: 'membership',
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: false, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([])
      mockGetActiveMembershipTiers.mockResolvedValue([
        { id: 't1', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
      ])

      const jsx = await CourseSlugPage({
        params: Promise.resolve({ slug: 'intro-101' }),
      })
      render(jsx)
      screen.getByTestId('get-access-client')
    })

    it('renders GatedContentCallout when user has membership but tier patterns do not include the course', async () => {
      mockGetCourseData.mockResolvedValue({
        ...baseCourse,
        status: 'membership',
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

      const jsx = await CourseSlugPage({
        params: Promise.resolve({ slug: 'intro-101' }),
      })
      render(jsx)
      expect(screen.getByTestId('gated-content-callout')).toBeInTheDocument()
      expect(
        screen.queryByTestId('course-page-renderer'),
      ).not.toBeInTheDocument()
    })

    it('renders course when user has membership and tier patterns include /courses/**', async () => {
      mockGetCourseData.mockResolvedValue({
        ...baseCourse,
        status: 'membership',
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

      const jsx = await CourseSlugPage({
        params: Promise.resolve({ slug: 'intro-101' }),
      })
      render(jsx)
      expect(screen.getByTestId('course-page-renderer')).toBeInTheDocument()
      expect(
        screen.queryByTestId('gated-content-callout'),
      ).not.toBeInTheDocument()
    })

    it('renders course when user has membership and tier patterns include /courses/intro-101/**', async () => {
      mockGetCourseData.mockResolvedValue({
        ...baseCourse,
        status: 'membership',
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

      const jsx = await CourseSlugPage({
        params: Promise.resolve({ slug: 'intro-101' }),
      })
      render(jsx)
      screen.getByTestId('course-page-renderer')
    })

    it('grants access when combined patterns across two memberships cover the course path', async () => {
      mockGetCourseData.mockResolvedValue({
        ...baseCourse,
        status: 'membership',
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
      const jsx = await CourseSlugPage({
        params: Promise.resolve({ slug: 'intro-101' }),
      })
      render(jsx)
      screen.getByTestId('course-page-renderer')
    })

    it('shows GatedContentCallout when two memberships exist but neither covers the course path', async () => {
      mockGetCourseData.mockResolvedValue({
        ...baseCourse,
        status: 'membership',
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
      const jsx = await CourseSlugPage({
        params: Promise.resolve({ slug: 'intro-101' }),
      })
      render(jsx)
      screen.getByTestId('gated-content-callout')
    })

    it('renders CoursePageRenderer for admin even when course is membership-only and admin has no membership', async () => {
      mockGetCourseData.mockResolvedValue({
        ...baseCourse,
        status: 'membership',
      })
      mockGetSession.mockResolvedValue({
        data: { id: 'u1', isAdmin: true, walletAddress: null },
      })
      mockGetActiveMemberships.mockResolvedValue([])

      const jsx = await CourseSlugPage({
        params: Promise.resolve({ slug: 'intro-101' }),
      })
      render(jsx)
      expect(screen.getByTestId('course-page-renderer')).toBeInTheDocument()
      expect(screen.queryByTestId('get-access-client')).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('gated-content-callout'),
      ).not.toBeInTheDocument()
    })
  })
})
