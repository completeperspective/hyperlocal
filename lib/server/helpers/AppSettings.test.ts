import { beforeEach, describe, expect, it, vi } from 'vitest'
// Import after mock is registered
import { keystoneContext } from '@/server/keystone/context'
import { AppSettings } from './AppSettings'

// Mock keystoneContext before importing AppSettings so the mock is in place
vi.mock('@/server/keystone/context', () => ({
  keystoneContext: {
    query: {
      Settings: {
        findOne: vi.fn(),
      },
    },
  },
}))

const mockFindOne = vi.mocked(keystoneContext.query.Settings.findOne)

const MOCK_SETTINGS_A = {
  siteName: 'Site A',
  baseUrl: 'https://a.example.com',
  copyright: '© A',
  metaTitle: '',
  metaDescription: '',
  ogImage: null,
  robots: 'noindex, nofollow, noarchive, nosnippet',
  isPrivate: true,
  allowSignup: false,
  maintenanceMode: false,
  maintenanceMessage: "We'll be back shortly.",
  gaTrackingId: '',
  socialLinks: null,
  theme: null,
  homePage: null,
  rootCourse: null,
  transparentHeader: true,
  allowWeb3Auth: true,
  web3SignInMessage: 'Sign in with your wallet',
  receiverWalletAddress: null,
}

const MOCK_SETTINGS_B = { ...MOCK_SETTINGS_A, siteName: 'Site B' }

beforeEach(() => {
  vi.clearAllMocks()
  AppSettings._resetForTest()
})

describe('AppSettings.settings()', () => {
  it('loads settings from DB on first access', async () => {
    mockFindOne.mockResolvedValue(MOCK_SETTINGS_A)

    const result = await AppSettings.instance.settings()

    expect(mockFindOne).toHaveBeenCalledOnce()
    expect(result.siteName).toBe('Site A')
  })

  it('returns a deep clone so callers cannot mutate internal state', async () => {
    mockFindOne.mockResolvedValue(MOCK_SETTINGS_A)

    const a = await AppSettings.instance.settings()
    a.siteName = 'mutated'
    const b = await AppSettings.instance.settings()

    expect(b.siteName).toBe('Site A')
  })
})

describe('AppSettings.reload()', () => {
  it('fetches fresh settings and updates internal state', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_SETTINGS_A)
    await AppSettings.instance.settings()

    mockFindOne.mockResolvedValueOnce(MOCK_SETTINGS_B)
    await AppSettings.instance.reload()

    const result = await AppSettings.instance.settings()
    expect(result.siteName).toBe('Site B')
  })

  it('sets lastReloadedAt after a successful reload', async () => {
    mockFindOne.mockResolvedValue(MOCK_SETTINGS_A)

    expect(AppSettings.instance.lastReloadedAt).toBeNull()

    await AppSettings.instance.reload()

    expect(AppSettings.instance.lastReloadedAt).toBeInstanceOf(Date)
  })

  it('leaves _settings unchanged when the DB query rejects', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_SETTINGS_A)
    await AppSettings.instance.settings()

    mockFindOne.mockRejectedValueOnce(new Error('DB connection failed'))

    await expect(AppSettings.instance.reload()).rejects.toThrow(
      'DB connection failed',
    )

    // Original settings still intact
    const result = await AppSettings.instance.settings()
    expect(result.siteName).toBe('Site A')
  })

  it('coalesces concurrent reload() calls into one DB fetch', async () => {
    mockFindOne.mockResolvedValue(MOCK_SETTINGS_A)

    // Fire two reloads simultaneously without awaiting
    const p1 = AppSettings.instance.reload()
    const p2 = AppSettings.instance.reload()

    await Promise.all([p1, p2])

    // Only one DB call should have been made
    expect(mockFindOne).toHaveBeenCalledOnce()
  })
})
