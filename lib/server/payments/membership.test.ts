import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getActiveMembership,
  getActiveMemberships,
  type MembershipRecord,
} from './membership'

// Reason: mock the Keystone sudo().query layer so tests never touch the DB.
// The production code calls keystoneContext.sudo().query.UserMembership.findMany,
// so we wire the mock at the module level and grab the stub reference below.
vi.mock('@/server/keystone/context', () => ({
  keystoneContext: {
    sudo: () => ({
      query: {
        UserMembership: {
          findMany: mockFindMany,
        },
      },
    }),
    prisma: {},
  },
}))

// Hoisted stub — must be declared before the vi.mock factory executes.
const mockFindMany = vi.fn()

const BASE_TIER = {
  id: 'tier-1',
  name: 'Pro',
  priceInCents: 999,
  paymentType: 'one_time',
  contentAccessPatterns: null,
}

function makeMembership(
  overrides: Partial<MembershipRecord> = {},
): MembershipRecord {
  return {
    id: 'mem-1',
    status: 'active',
    paymentMethod: 'stripe',
    activatedAt: '2025-01-01T00:00:00.000Z',
    expiresAt: null,
    stripeCheckoutSessionId: 'cs_test_1',
    stripeSubscriptionId: null,
    cryptoTxHash: null,
    tier: BASE_TIER,
    user: { id: 'user-1' },
    ...overrides,
  }
}

describe('getActiveMemberships', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  it('returns a membership with expiresAt: null (non-expiring / one-time purchase)', async () => {
    const record = makeMembership({ expiresAt: null })
    mockFindMany.mockResolvedValue([record])

    const result = await getActiveMemberships('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].expiresAt).toBeNull()
    expect(result[0].status).toBe('active')
  })

  it('returns a membership with a future expiresAt (active subscription)', async () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const record = makeMembership({ expiresAt: future })
    mockFindMany.mockResolvedValue([record])

    const result = await getActiveMemberships('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].expiresAt).toBe(future)
  })

  it('passes the OR expiry-bypass clause to Keystone so the DB excludes past-expiry memberships', async () => {
    // Reason: we are asserting the where clause structure, not the DB result.
    // The mock returns [] to simulate the DB correctly excluding the stale record.
    mockFindMany.mockResolvedValue([])

    await getActiveMemberships('user-1')

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { expiresAt: { equals: null } },
            expect.objectContaining({
              expiresAt: expect.objectContaining({ gt: expect.any(String) }),
            }),
          ]),
        }),
      }),
    )
  })

  it('returns an empty array when Keystone finds no memberships', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getActiveMemberships('user-1')

    expect(result).toEqual([])
  })
})

describe('getActiveMembership (backward compat)', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  it('returns the first element when multiple memberships exist', async () => {
    const first = makeMembership({ id: 'mem-1' })
    const second = makeMembership({ id: 'mem-2' })
    mockFindMany.mockResolvedValue([first, second])

    const result = await getActiveMembership('user-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('mem-1')
  })

  it('returns null when there are no active memberships', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getActiveMembership('user-1')

    expect(result).toBeNull()
  })
})
