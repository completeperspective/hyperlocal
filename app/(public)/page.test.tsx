import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicLanding from './page'

const {
  mockRedirect,
  mockNotFound,
  mockIsAuthenticated,
  mockGetSession,
  mockGetPageData,
  mockGetCourseData,
  mockSettings,
  mockGetActiveMemberships,
  mockGetActiveMembershipTiers,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
  mockNotFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  mockIsAuthenticated: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetPageData: vi.fn(),
  mockGetCourseData: vi.fn(),
  mockSettings: vi.fn(),
  mockGetActiveMemberships: vi.fn(),
  mockGetActiveMembershipTiers: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}))

vi.mock('@/server/auth', () => ({
  isAuthenticated: mockIsAuthenticated,
  getSession: mockGetSession,
}))

vi.mock('@/server/helpers', () => ({
  AppSettings: { instance: { settings: mockSettings } },
  getPageData: mockGetPageData,
  getCourseData: mockGetCourseData,
  getPageMetadata: vi.fn().mockResolvedValue({}),
  getLessonProgressMap: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/server/payments/membership', () => ({
  getActiveMemberships: mockGetActiveMemberships,
  getActiveMembershipTiers: mockGetActiveMembershipTiers,
}))

vi.mock('@/ui/gated-content-callout', () => ({
  GatedContentCallout: () => <div data-testid="gated-content-callout" />,
}))

vi.mock('~/lib/server/pages/landing-page', () => ({
  LandingPage: () => <div data-testid="landing-page" />,
}))

vi.mock('@/server/pages/course-page', () => ({
  CoursePageRenderer: () => <div data-testid="course-page-renderer" />,
}))

vi.mock('@/server/pages/dynamic-page', () => ({
  DynamicPage: () => <div data-testid="dynamic-page" />,
}))

const baseSettings = {
  isPrivate: false,
  homePage: null,
  rootCourse: null,
}

const baseCourse = {
  id: 'c1',
  slug: 'my-course',
  title: 'My Course',
  status: 'published',
  heroEnabled: false,
  trustedHtml: '',
  chapters: [],
  pages: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockIsAuthenticated.mockResolvedValue(false)
  mockGetSession.mockResolvedValue({ data: null })
  mockSettings.mockResolvedValue(baseSettings)
  mockGetPageData.mockResolvedValue(null)
  mockGetCourseData.mockResolvedValue(baseCourse)
  mockGetActiveMemberships.mockResolvedValue([])
  mockGetActiveMembershipTiers.mockResolvedValue([])
})

describe('PublicLanding', () => {
  it('renders CoursePageRenderer inline at / when rootCourse is configured', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    const jsx = await PublicLanding()
    expect(jsx).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('renders course inline even when homePage is also set (Course wins)', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      homePage: { slug: 'home' },
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    const jsx = await PublicLanding()
    expect(jsx).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('renders page when homePage is set and rootCourse is null', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      homePage: { slug: 'home' },
    })
    mockGetPageData.mockResolvedValue({
      id: 'p1',
      slug: 'home',
      status: 'published',
      trustedHtml: '',
    })
    const jsx = await PublicLanding()
    expect(jsx).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('renders LandingPage when neither homePage nor rootCourse is set', async () => {
    const jsx = await PublicLanding()
    expect(jsx).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects to /login when app is private and user is not authenticated', async () => {
    mockSettings.mockResolvedValue({ ...baseSettings, isPrivate: true })
    await expect(PublicLanding()).rejects.toThrow('NEXT_REDIRECT:/login')
  })

  it('redirects to /get-access when rootCourse is membership-only and unauthenticated', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    mockGetCourseData.mockResolvedValue({ ...baseCourse, status: 'membership' })

    await expect(PublicLanding()).rejects.toThrow('NEXT_REDIRECT:/get-access')
  })

  // rootCourse — tier pattern mismatch
  it('renders GatedContentCallout when rootCourse is membership-only, user has membership but tier does not match', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    mockGetCourseData.mockResolvedValue({ ...baseCourse, status: 'membership' })
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: false, walletAddress: null },
    })
    mockGetActiveMemberships.mockResolvedValue([
      {
        tier: { id: 't1', name: 'Basic', contentAccessPatterns: ['/pages/**'] },
      },
    ])
    mockGetActiveMembershipTiers.mockResolvedValue([
      { id: 't2', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
    ])

    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    render(jsx)
    expect(screen.getByTestId('gated-content-callout')).toBeInTheDocument()
    expect(screen.queryByTestId('course-page-renderer')).not.toBeInTheDocument()
  })

  // rootCourse — tier pattern matches
  it('renders CoursePageRenderer when rootCourse is membership-only and tier patterns match', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    mockGetCourseData.mockResolvedValue({ ...baseCourse, status: 'membership' })
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: false, walletAddress: null },
    })
    mockGetActiveMemberships.mockResolvedValue([
      {
        tier: { id: 't1', name: 'Pro', contentAccessPatterns: ['/courses/**'] },
      },
    ])

    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    render(jsx)
    expect(screen.getByTestId('course-page-renderer')).toBeInTheDocument()
    expect(
      screen.queryByTestId('gated-content-callout'),
    ).not.toBeInTheDocument()
  })

  // rootCourse — multi-membership union access
  it('grants access when combined patterns across two memberships cover the course path', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    mockGetCourseData.mockResolvedValue({ ...baseCourse, status: 'membership' })
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
          contentAccessPatterns: ['/courses/my-course/**'],
        },
      },
    ])
    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(jsx).toBeTruthy()
  })

  it('shows gated callout when two memberships exist but neither covers the course path', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    mockGetCourseData.mockResolvedValue({ ...baseCourse, status: 'membership' })
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: false, walletAddress: null },
    })
    mockGetActiveMemberships.mockResolvedValue([
      {
        tier: { id: 't1', name: 'Basic', contentAccessPatterns: ['/pages/**'] },
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
    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(jsx).toBeTruthy()
  })

  // rootCourse — admin bypass
  it('renders CoursePageRenderer for admin even when rootCourse is membership-only and admin has no membership', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      rootCourse: { id: 'c1', slug: 'my-course' },
    })
    mockGetCourseData.mockResolvedValue({ ...baseCourse, status: 'membership' })
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: true, walletAddress: null },
    })
    mockGetActiveMemberships.mockResolvedValue([])

    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    render(jsx)
    expect(screen.getByTestId('course-page-renderer')).toBeInTheDocument()
    expect(
      screen.queryByTestId('gated-content-callout'),
    ).not.toBeInTheDocument()
  })

  // homePage — authenticated but no active membership
  it('redirects to /dashboard?upgrade=1 when homePage is membership-only and user has no active membership', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      homePage: { slug: 'home' },
    })
    mockIsAuthenticated.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: false, walletAddress: null },
    })
    mockGetPageData.mockResolvedValue({
      id: 'p1',
      slug: 'home',
      title: 'Home',
      status: 'membership',
      trustedHtml: '',
    })
    mockGetActiveMemberships.mockResolvedValue([])

    await expect(PublicLanding()).rejects.toThrow('NEXT_REDIRECT:/dashboard')
  })

  // homePage — membership but tier pattern mismatch
  it('renders GatedContentCallout when homePage is membership-only and tier does not match', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      homePage: { slug: 'home' },
    })
    mockIsAuthenticated.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: false, walletAddress: null },
    })
    mockGetPageData.mockResolvedValue({
      id: 'p1',
      slug: 'home',
      title: 'Home',
      status: 'membership',
      trustedHtml: '',
    })
    mockGetActiveMemberships.mockResolvedValue([
      {
        tier: {
          id: 't1',
          name: 'Basic',
          contentAccessPatterns: ['/pages/other'],
        },
      },
    ])
    mockGetActiveMembershipTiers.mockResolvedValue([
      { id: 't2', name: 'Pro', contentAccessPatterns: ['/**'] },
    ])

    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(jsx).toBeTruthy()
  })

  // homePage — membership and tier matches
  it('renders DynamicPage when homePage is membership-only and tier patterns match', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      homePage: { slug: 'home' },
    })
    mockIsAuthenticated.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: false, walletAddress: null },
    })
    mockGetPageData.mockResolvedValue({
      id: 'p1',
      slug: 'home',
      title: 'Home',
      status: 'membership',
      trustedHtml: '',
    })
    mockGetActiveMemberships.mockResolvedValue([
      { tier: { id: 't1', name: 'Pro', contentAccessPatterns: ['/**'] } },
    ])

    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(jsx).toBeTruthy()
  })

  // homePage — admin bypass
  it('renders DynamicPage for admin even when homePage is membership-only and admin has no membership', async () => {
    mockSettings.mockResolvedValue({
      ...baseSettings,
      homePage: { slug: 'home' },
    })
    mockIsAuthenticated.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({
      data: { id: 'u1', isAdmin: true, walletAddress: null },
    })
    mockGetPageData.mockResolvedValue({
      id: 'p1',
      slug: 'home',
      title: 'Home',
      status: 'membership',
      trustedHtml: '',
    })
    mockGetActiveMemberships.mockResolvedValue([])

    const jsx = await PublicLanding()
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(jsx).toBeTruthy()
  })
})
