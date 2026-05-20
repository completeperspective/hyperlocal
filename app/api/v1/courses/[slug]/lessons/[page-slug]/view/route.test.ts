import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/server/auth'
import { getActiveMemberships } from '@/server/payments/membership'
import { POST } from './route'

// Reason: vi.hoisted ensures stubs are available inside vi.mock factory closures
// which are hoisted to the top of the file before any imports are resolved.
const {
  mockCourseFindMany,
  mockPageFindMany,
  mockUpsertCourseEnrollment,
  mockUpsertLessonProgress,
} = vi.hoisted(() => ({
  mockCourseFindMany: vi.fn(),
  mockPageFindMany: vi.fn(),
  mockUpsertCourseEnrollment: vi.fn(),
  mockUpsertLessonProgress: vi.fn(),
}))

vi.mock('@/server/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/server/keystone/context', () => ({
  keystoneContext: {
    sudo: () => ({
      query: {
        Course: { findMany: mockCourseFindMany },
        Page: { findMany: mockPageFindMany },
      },
    }),
    prisma: {},
  },
}))

vi.mock('@/server/payments/membership', () => ({
  getActiveMemberships: vi.fn(),
}))

// Reason: progress helpers touch Prisma heavily; mock the whole module so tests
// stay focused on access-gating logic rather than DB write paths.
vi.mock('@/server/helpers/get-course-progress', () => ({
  upsertCourseEnrollment: mockUpsertCourseEnrollment,
  upsertLessonProgress: mockUpsertLessonProgress,
}))

const mockGetSession = vi.mocked(getSession)
const mockGetActiveMemberships = vi.mocked(getActiveMemberships)

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const USER_SESSION = {
  data: { id: 'user-1', email: 'user@test.com', isAdmin: false },
}

const ADMIN_SESSION = {
  data: { id: 'admin-1', email: 'admin@test.com', isAdmin: true },
}

const FREE_COURSE = { id: 'course-id-1', status: 'published' }
const GATED_COURSE = { id: 'course-id-1', status: 'membership' }

const FREE_PAGE = { id: 'page-id-1', status: 'published' }
const GATED_PAGE = { id: 'page-id-1', status: 'membership' }

const MATCHING_MEMBERSHIP = [
  { tier: { contentAccessPatterns: ['/courses/my-course/my-lesson'] } },
]

const NONMATCHING_MEMBERSHIP = [
  { tier: { contentAccessPatterns: ['/courses/other-course/**'] } },
]

function makeRequest(): NextRequest {
  return new NextRequest(
    'http://localhost/api/v1/courses/my-course/lessons/my-lesson/view',
    { method: 'POST' },
  )
}

function makeCtx() {
  return {
    params: Promise.resolve({ slug: 'my-course', 'page-slug': 'my-lesson' }),
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // Default: authenticated non-admin user with free course and page
  mockGetSession.mockResolvedValue(USER_SESSION as never)
  mockCourseFindMany.mockResolvedValue([FREE_COURSE])
  mockPageFindMany.mockResolvedValue([FREE_PAGE])
  mockUpsertCourseEnrollment.mockResolvedValue('enrollment-id-1')
  mockUpsertLessonProgress.mockResolvedValue({
    id: 'progress-id-1',
    viewCount: 1,
  })
  mockGetActiveMemberships.mockResolvedValue([])
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/courses/[slug]/lessons/[page-slug]/view', () => {
  describe('authentication', () => {
    it('returns 401 when request is unauthenticated', async () => {
      mockGetSession.mockResolvedValue({ data: null } as never)

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(401)
    })
  })

  describe('free content (no membership gate)', () => {
    it('returns 200 with progressId and viewCount for a free course and free page', async () => {
      const res = await POST(makeRequest(), makeCtx())
      const body = await res!.json()

      expect(res!.status).toBe(200)
      expect(body.progressId).toBe('progress-id-1')
      expect(body.viewCount).toBe(1)
    })

    it('does not call getActiveMemberships when neither course nor page is gated', async () => {
      await POST(makeRequest(), makeCtx())

      expect(mockGetActiveMemberships).not.toHaveBeenCalled()
    })
  })

  describe('page-level membership gate (page.status = membership)', () => {
    beforeEach(() => {
      mockCourseFindMany.mockResolvedValue([FREE_COURSE])
      mockPageFindMany.mockResolvedValue([GATED_PAGE])
    })

    it('returns 403 when user has no active memberships', async () => {
      // Reason: zero active memberships → empty mergedPatterns array. Without an
      // explicit guard, matchesPatterns([], path) would return true (empty = no
      // restriction), incorrectly letting membership-less users through.
      mockGetActiveMemberships.mockResolvedValue([])

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(403)
    })

    it("returns 403 when user's membership tier patterns do not match the lesson path", async () => {
      mockGetActiveMemberships.mockResolvedValue(
        NONMATCHING_MEMBERSHIP as never,
      )

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(403)
    })

    it("returns 200 when user's membership tier patterns match the lesson path", async () => {
      mockGetActiveMemberships.mockResolvedValue(MATCHING_MEMBERSHIP as never)

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(200)
    })

    it('returns 200 for an admin user even with no membership (admin bypasses gate)', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION as never)
      mockGetActiveMemberships.mockResolvedValue([])

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(200)
      // Admins skip the membership lookup entirely
      expect(mockGetActiveMemberships).not.toHaveBeenCalled()
    })
  })

  describe('course-level membership gate (course.status = membership, page is published)', () => {
    beforeEach(() => {
      mockCourseFindMany.mockResolvedValue([GATED_COURSE])
      mockPageFindMany.mockResolvedValue([FREE_PAGE])
    })

    it('returns 403 when user has no active memberships', async () => {
      mockGetActiveMemberships.mockResolvedValue([])

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(403)
    })

    it("returns 403 when membership patterns don't match the course path", async () => {
      mockGetActiveMemberships.mockResolvedValue(
        NONMATCHING_MEMBERSHIP as never,
      )

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(403)
    })

    it('returns 200 when membership patterns match the course path', async () => {
      mockGetActiveMemberships.mockResolvedValue([
        { tier: { contentAccessPatterns: ['/courses/my-course'] } },
      ] as never)

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(200)
    })

    it('returns 200 for an admin user bypassing the course-level gate', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION as never)

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(200)
      expect(mockGetActiveMemberships).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('returns 404 when the course slug does not exist', async () => {
      mockCourseFindMany.mockResolvedValue([])

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(404)
    })

    it('returns 404 when the page slug does not exist', async () => {
      mockPageFindMany.mockResolvedValue([])

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(404)
    })

    it('merges patterns from multiple active memberships to grant access', async () => {
      mockPageFindMany.mockResolvedValue([GATED_PAGE])

      // Two memberships — only the second one has a matching pattern.
      mockGetActiveMemberships.mockResolvedValue([
        { tier: { contentAccessPatterns: ['/courses/other/**'] } },
        { tier: { contentAccessPatterns: ['/courses/my-course/my-lesson'] } },
      ] as never)

      const res = await POST(makeRequest(), makeCtx())

      expect(res!.status).toBe(200)
    })
  })
})
