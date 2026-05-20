import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/server/auth'
import { getActiveMemberships } from '@/server/payments/membership'
import { GET } from './route'

// Reason: vi.hoisted ensures stubs are available inside vi.mock factory closures
// which are hoisted to the top of the file before any imports are resolved.
const { mockAttachmentFindOne, mockGenerateSignedUrl } = vi.hoisted(() => ({
  mockAttachmentFindOne: vi.fn(),
  mockGenerateSignedUrl: vi.fn(),
}))

vi.mock('@/server/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/server/keystone/context', () => ({
  keystoneContext: {
    sudo: () => ({
      query: {
        PageAttachment: { findOne: mockAttachmentFindOne },
      },
    }),
    prisma: {},
  },
}))

vi.mock('@/server/payments/membership', () => ({
  getActiveMemberships: vi.fn(),
}))

// Reason: generateSignedUrl talks to Cloudinary's signing algorithm which depends
// on env secrets. Mock it to return a deterministic URL for all tests.
vi.mock('@/server/helpers', () => ({
  generateSignedUrl: mockGenerateSignedUrl,
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

const SIGNED_URL = 'https://res.cloudinary.com/demo/signed/test-attachment.pdf'

// Attachment whose parent page is free (published)
const FREE_ATTACHMENT = {
  id: 'att-1',
  publicId: 'test/test-attachment',
  filename: 'test-attachment.pdf',
  mimeType: 'application/pdf',
  page: { slug: 'courses/my-course/my-lesson', status: 'published' },
}

// Attachment whose parent page is membership-gated
const GATED_ATTACHMENT = {
  id: 'att-2',
  publicId: 'test/gated-attachment',
  filename: 'gated-attachment.pdf',
  mimeType: 'application/pdf',
  page: { slug: 'courses/my-course/my-lesson', status: 'membership' },
}

const MATCHING_MEMBERSHIP = [
  {
    tier: {
      contentAccessPatterns: ['/courses/my-course/my-lesson'],
    },
  },
]

const NONMATCHING_MEMBERSHIP = [
  {
    tier: {
      contentAccessPatterns: ['/courses/other-course/**'],
    },
  },
]

// Minimal ArrayBuffer content for a fake file download
const FAKE_BODY = new TextEncoder().encode('PDF content').buffer

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/v1/attachments/att-1/download', {
    method: 'GET',
  })
}

function makeCtx(id = 'att-1') {
  return { params: Promise.resolve({ id }) }
}

/** Creates a mock Response as returned by global.fetch */
function makeFetchResponse(ok = true, contentType = 'application/pdf') {
  return {
    ok,
    headers: {
      get: (header: string) => (header === 'content-type' ? contentType : null),
    },
    arrayBuffer: async () => FAKE_BODY,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  mockGetSession.mockResolvedValue(USER_SESSION as never)
  mockAttachmentFindOne.mockResolvedValue(FREE_ATTACHMENT)
  mockGenerateSignedUrl.mockReturnValue(SIGNED_URL)
  mockGetActiveMemberships.mockResolvedValue([])

  // Reason: the download route uses global fetch to proxy the Cloudinary asset.
  // Stub it at the global level to avoid real network calls in tests.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse()))
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/attachments/[id]/download', () => {
  describe('authentication', () => {
    it('returns 401 when the request is unauthenticated', async () => {
      mockGetSession.mockResolvedValue({ data: null } as never)

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(401)
    })
  })

  describe('free attachment (parent page is published)', () => {
    it('returns 200 with the file content when the parent page is free', async () => {
      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Disposition')).toContain(
        'test-attachment.pdf',
      )
    })

    it('does not call getActiveMemberships when parent page is not gated', async () => {
      await GET(makeRequest(), makeCtx())

      expect(mockGetActiveMemberships).not.toHaveBeenCalled()
    })

    it('generates a signed URL and proxies the upstream response', async () => {
      await GET(makeRequest(), makeCtx())

      expect(mockGenerateSignedUrl).toHaveBeenCalledWith(
        FREE_ATTACHMENT.publicId,
      )
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(SIGNED_URL)
    })
  })

  describe('gated attachment (parent page has status = membership)', () => {
    beforeEach(() => {
      mockAttachmentFindOne.mockResolvedValue(GATED_ATTACHMENT)
    })

    it('returns 403 when user has no active memberships', async () => {
      // Reason: zero active memberships → empty mergedPatterns array. Without an
      // explicit guard, matchesPatterns([], path) would return true (empty = no
      // restriction), incorrectly letting membership-less users through.
      mockGetActiveMemberships.mockResolvedValue([])

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(403)
    })

    it("returns 403 when membership patterns don't match the parent page path", async () => {
      mockGetActiveMemberships.mockResolvedValue(
        NONMATCHING_MEMBERSHIP as never,
      )

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(403)
    })

    it('returns 200 when membership patterns match the parent page path', async () => {
      mockGetActiveMemberships.mockResolvedValue(MATCHING_MEMBERSHIP as never)

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(200)
    })

    it('returns 200 for an admin user bypassing the membership gate', async () => {
      mockGetSession.mockResolvedValue(ADMIN_SESSION as never)

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(200)
      expect(mockGetActiveMemberships).not.toHaveBeenCalled()
    })
  })

  describe('not found and upstream errors', () => {
    it('returns 404 when the attachment does not exist in the database', async () => {
      mockAttachmentFindOne.mockResolvedValue(null)

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(404)
    })

    it('returns 404 when the attachment has no publicId', async () => {
      mockAttachmentFindOne.mockResolvedValue({
        ...FREE_ATTACHMENT,
        publicId: null,
      })

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(404)
    })

    it('returns 502 when the upstream Cloudinary fetch fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(makeFetchResponse(false)),
      )

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(502)
    })
  })

  describe('response headers', () => {
    it('sets correct Content-Type header from upstream response', async () => {
      const res = await GET(makeRequest(), makeCtx())

      expect(res.headers.get('Content-Type')).toBe('application/pdf')
    })

    it('sets Content-Disposition as attachment with the filename', async () => {
      const res = await GET(makeRequest(), makeCtx())

      expect(res.headers.get('Content-Disposition')).toBe(
        'attachment; filename="test-attachment.pdf"',
      )
    })

    it('sets Content-Length matching the file body size', async () => {
      const res = await GET(makeRequest(), makeCtx())

      expect(res.headers.get('Content-Length')).toBe(
        String(FAKE_BODY.byteLength),
      )
    })
  })

  describe('edge cases', () => {
    it('uses attachment mimeType as fallback when upstream content-type header is absent', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          headers: { get: () => null }, // no content-type
          arrayBuffer: async () => FAKE_BODY,
        }),
      )

      const res = await GET(makeRequest(), makeCtx())

      expect(res.headers.get('Content-Type')).toBe('application/pdf')
    })

    it('prepends a leading slash to the page slug before pattern matching', async () => {
      // The DB stores slug without leading slash; the route prepends one.
      // Matching pattern must include the leading slash to succeed.
      mockAttachmentFindOne.mockResolvedValue({
        ...GATED_ATTACHMENT,
        page: { slug: 'courses/my-course/my-lesson', status: 'membership' },
      })

      mockGetActiveMemberships.mockResolvedValue([
        // Pattern with leading slash — must match
        { tier: { contentAccessPatterns: ['/courses/my-course/my-lesson'] } },
      ] as never)

      const res = await GET(makeRequest(), makeCtx())

      expect(res.status).toBe(200)
    })
  })
})
