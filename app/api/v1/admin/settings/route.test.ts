import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/server/auth'
import { AppSettings } from '@/server/helpers/AppSettings'
import { GET, POST } from './route'

// Mock auth so we can control session state in tests
vi.mock('@/server/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/server/keystone/context', () => ({
  keystoneContext: {
    query: {
      Settings: { findOne: vi.fn() },
    },
    sudo: () => ({
      db: {
        Settings: { updateOne: vi.fn() },
      },
    }),
  },
}))

vi.mock('@/server/helpers/AppSettings', () => ({
  AppSettings: {
    instance: {
      settings: vi.fn(),
      reload: vi.fn(),
      lastReloadedAt: null,
    },
  },
}))

const mockGetSession = vi.mocked(getSession)
const mockSettings = vi.mocked(AppSettings.instance.settings)
const mockReload = vi.mocked(AppSettings.instance.reload)

const CTX = { params: Promise.resolve({}) }

const ADMIN_SESSION = {
  data: { id: '1', email: 'admin@test.com', isAdmin: true },
}

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/v1/admin/settings`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue(ADMIN_SESSION as never)
  mockSettings.mockResolvedValue({ siteName: 'Test Site' } as never)
  mockReload.mockResolvedValue(undefined)
  Object.defineProperty(AppSettings.instance, 'lastReloadedAt', {
    value: null,
    configurable: true,
  })
})

describe('GET /api/v1/admin/settings', () => {
  it('returns current settings with lastReloadedAt', async () => {
    const res = (await GET(makeRequest('GET'), CTX))!
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.siteName).toBe('Test Site')
    expect(body).toHaveProperty('lastReloadedAt')
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({ data: null } as never)
    const res = (await GET(makeRequest('GET'), CTX))!
    expect(res.status).toBe(401)
  })

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSession.mockResolvedValue({
      data: { id: '2', email: 'user@test.com', isAdmin: false },
    } as never)
    const res = (await GET(makeRequest('GET'), CTX))!
    expect(res.status).toBe(403)
  })
})

describe('POST /api/v1/admin/settings', () => {
  it('saves valid payload and calls reload()', async () => {
    Object.defineProperty(AppSettings.instance, 'lastReloadedAt', {
      value: new Date(),
      configurable: true,
    })

    const res = (await POST(
      makeRequest('POST', { siteName: 'New Site', isPrivate: false }),
      CTX,
    ))!

    expect(res.status).toBe(200)
    expect(mockReload).toHaveBeenCalledOnce()
    const body = await res.json()
    expect(body).toHaveProperty('reloadedAt')
  })

  it('returns 400 for invalid robots value', async () => {
    const res = (await POST(
      makeRequest('POST', { robots: 'invalid-value' }),
      CTX,
    ))!

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('Invalid input')
    expect(mockReload).not.toHaveBeenCalled()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue({ data: null } as never)
    const res = (await POST(makeRequest('POST', { siteName: 'test' }), CTX))!
    expect(res.status).toBe(401)
  })

  it('does not call reload() when validation fails', async () => {
    await POST(makeRequest('POST', { isPrivate: 'not-a-boolean' }), CTX)
    expect(mockReload).not.toHaveBeenCalled()
  })

  it('accepts ogImageId and connects the OG image', async () => {
    Object.defineProperty(AppSettings.instance, 'lastReloadedAt', {
      value: new Date(),
      configurable: true,
    })
    const res = (await POST(
      makeRequest('POST', { ogImageId: 'img-abc' }),
      CTX,
    ))!
    expect(res.status).toBe(200)
    expect(mockReload).toHaveBeenCalledOnce()
  })

  it('accepts ogImageId: null to disconnect the OG image', async () => {
    Object.defineProperty(AppSettings.instance, 'lastReloadedAt', {
      value: new Date(),
      configurable: true,
    })
    const res = (await POST(makeRequest('POST', { ogImageId: null }), CTX))!
    expect(res.status).toBe(200)
    expect(mockReload).toHaveBeenCalledOnce()
  })
})
