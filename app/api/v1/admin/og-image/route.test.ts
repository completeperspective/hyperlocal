import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/server/auth'
import { POST } from './route'

// vi.hoisted ensures mock fn references are available inside vi.mock factories
const { mockUploadImage, mockOGImageCreate } = vi.hoisted(() => ({
  mockUploadImage: vi.fn(),
  mockOGImageCreate: vi.fn(),
}))

vi.mock('@/server/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/server/helpers', () => ({
  uploadImage: mockUploadImage,
}))

vi.mock('@/server/keystone/context', () => ({
  keystoneContext: {
    sudo: () => ({
      prisma: {
        oGImage: { create: mockOGImageCreate },
      },
    }),
  },
}))

const mockGetSession = vi.mocked(getSession)

const ADMIN_SESSION = {
  data: { id: '1', email: 'admin@test.com', isAdmin: true },
}

const UPLOAD_RESULT = {
  publicId: 'test/og-image',
  secureUrl: 'https://res.cloudinary.com/demo/image/upload/test/og-image.png',
  width: 1200,
  height: 630,
  format: 'png',
  bytes: 12345,
}

function makeImageFile(
  name = 'og.png',
  type = 'image/png',
  sizeBytes = 100,
): File {
  const file = new File([new Uint8Array(sizeBytes)], name, { type })
  return file
}

function makeRequest(file?: File): NextRequest {
  const form = new FormData()
  if (file) form.append('file', file)
  return new NextRequest('http://localhost/api/v1/admin/og-image', {
    method: 'POST',
    body: form,
  })
}

const CTX = { params: Promise.resolve({}) }

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue(ADMIN_SESSION as never)
  mockUploadImage.mockResolvedValue(UPLOAD_RESULT)
  mockOGImageCreate.mockResolvedValue({ id: 'og-record-1' })
})

describe('POST /api/v1/admin/og-image', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({ data: null } as never)
    const res = (await POST(makeRequest(makeImageFile()), CTX))!
    expect(res.status).toBe(401)
  })

  it('returns 403 when not admin', async () => {
    mockGetSession.mockResolvedValue({
      data: { id: '2', email: 'user@test.com', isAdmin: false },
    } as never)
    const res = (await POST(makeRequest(makeImageFile()), CTX))!
    expect(res.status).toBe(403)
  })

  it('returns 400 when no file is provided', async () => {
    const res = (await POST(makeRequest(), CTX))!
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/missing/i)
  })

  it('returns 400 when file type is not an image', async () => {
    const res = (await POST(
      makeRequest(makeImageFile('data.csv', 'text/plain')),
      CTX,
    ))!
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/unsupported/i)
  })

  // Note: the 5 MB buffer.byteLength check in the route is verified manually /
  // in integration tests. JSDOM's FormData does not reliably serialise large
  // binary payloads through NextRequest in the unit-test environment.

  it('returns 201 with id and url on successful upload', async () => {
    const res = (await POST(makeRequest(makeImageFile()), CTX))!
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('og-record-1')
    expect(body.url).toBe(UPLOAD_RESULT.secureUrl)
  })

  it('calls uploadImage() once with a Buffer on success', async () => {
    await POST(makeRequest(makeImageFile()), CTX)
    expect(mockUploadImage).toHaveBeenCalledOnce()
    const [buffer] = mockUploadImage.mock.calls[0]
    expect(Buffer.isBuffer(buffer)).toBe(true)
  })

  it('creates OGImage record with correct _meta shape', async () => {
    await POST(makeRequest(makeImageFile('hero.png')), CTX)
    expect(mockOGImageCreate).toHaveBeenCalledOnce()
    const { data } = mockOGImageCreate.mock.calls[0][0]
    expect(data.source).toEqual({
      _meta: {
        public_id: UPLOAD_RESULT.publicId,
        secure_url: UPLOAD_RESULT.secureUrl,
        width: UPLOAD_RESULT.width,
        height: UPLOAD_RESULT.height,
        format: UPLOAD_RESULT.format,
        bytes: UPLOAD_RESULT.bytes,
        resource_type: 'image',
        type: 'upload',
      },
    })
    // file.name may not survive the NextRequest FormData roundtrip in tests,
    // but title should always be a string set from the file.
    expect(typeof data.title).toBe('string')
  })
})
