import type { MembershipTier } from '@/types/membership'
import { keystoneContext } from '../keystone/context'

export interface MembershipRecord {
  id: string
  status: string
  paymentMethod: string | null
  activatedAt: string | null
  expiresAt: string | null
  stripeCheckoutSessionId: string | null
  stripeSubscriptionId: string | null
  cryptoTxHash: string | null
  tier: {
    id: string
    name: string
    priceInCents: number
    paymentType: string
    contentAccessPatterns: string[] | null
  } | null
  user: { id: string } | null
}

const MEMBERSHIP_QUERY = `
  id status paymentMethod activatedAt expiresAt
  stripeCheckoutSessionId stripeSubscriptionId cryptoTxHash
  tier { id name priceInCents paymentType contentAccessPatterns }
  user { id }
`

// Reason: reads use the Keystone query API for nested field expansion (tier, user).
const query = () => keystoneContext.sudo().query

// Reason: writes use prisma directly — Keystone's query and db layers both run
// relationship resolver validation on connect operations which denies writes even
// under sudo(). Direct Prisma bypasses all Keystone abstractions.
const prisma = () => keystoneContext.prisma

export async function getActiveMemberships(
  userId: string,
): Promise<MembershipRecord[]> {
  const results = await query().UserMembership.findMany({
    where: {
      user: { id: { equals: userId } },
      status: { equals: 'active' },
      // Reason: guard against missed Stripe webhooks — a membership with a past
      // expiresAt must not continue to grant access even if status was never updated.
      OR: [
        { expiresAt: { equals: null } },
        { expiresAt: { gt: new Date().toISOString() } },
      ],
    },
    query: MEMBERSHIP_QUERY,
  })
  return results as MembershipRecord[]
}

export async function getActiveMembership(
  userId: string,
): Promise<MembershipRecord | null> {
  return (await getActiveMemberships(userId))[0] ?? null
}

export async function createPendingMembership(
  userId: string,
  tierId: string,
): Promise<string> {
  const membership = await prisma().userMembership.create({
    data: {
      userId,
      tierId,
      status: 'pending',
    },
  })
  return membership.id
}

export async function activateMembership(
  membershipId: string,
  paymentMethod: 'stripe' | 'crypto' | 'free',
): Promise<void> {
  await prisma().userMembership.update({
    where: { id: membershipId },
    data: {
      status: 'active',
      paymentMethod,
      activatedAt: new Date(),
    },
  })
}

export async function failMembership(membershipId: string): Promise<void> {
  await prisma().userMembership.update({
    where: { id: membershipId },
    data: { status: 'failed' },
  })
}

export async function expireMembership(membershipId: string): Promise<void> {
  await prisma().userMembership.update({
    where: { id: membershipId },
    data: { status: 'expired' },
  })
}

export async function getMembershipByCheckoutSession(
  sessionId: string,
): Promise<MembershipRecord | null> {
  const results = await query().UserMembership.findMany({
    where: { stripeCheckoutSessionId: { equals: sessionId } },
    query: MEMBERSHIP_QUERY,
  })
  return (results[0] as MembershipRecord) ?? null
}

export async function getMembershipByTxHash(
  txHash: string,
): Promise<MembershipRecord | null> {
  const results = await query().UserMembership.findMany({
    where: { cryptoTxHash: { equals: txHash } },
    query: MEMBERSHIP_QUERY,
  })
  return (results[0] as MembershipRecord) ?? null
}

export async function updateMembershipCheckoutSession(
  membershipId: string,
  stripeCheckoutSessionId: string,
): Promise<void> {
  await prisma().userMembership.update({
    where: { id: membershipId },
    data: { stripeCheckoutSessionId },
  })
}

export async function getActiveMembershipTiers(): Promise<MembershipTier[]> {
  const tiersRaw = await keystoneContext.prisma.membershipTier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      priceInCents: true,
      paymentType: true,
      isActive: true,
      contentAccessPatterns: true,
    },
  })

  return tiersRaw.map((t) => ({
    id: t.id,
    name: t.name ?? '',
    description: t.description ?? null,
    priceInCents: t.priceInCents ?? 0,
    paymentType: (t.paymentType as MembershipTier['paymentType']) ?? 'one_time',
    isActive: t.isActive ?? false,
    stripeProductId: null,
    stripePriceId: null,
    // Reason: DB stores Json? — may be null when no patterns configured; normalize
    // to empty array so callers can safely use .length / Array.isArray without guards.
    contentAccessPatterns: Array.isArray(t.contentAccessPatterns)
      ? (t.contentAccessPatterns as string[])
      : [],
  }))
}

export async function updateMembershipSubscription(
  membershipId: string,
  stripeSubscriptionId: string,
  expiresAt?: string,
): Promise<void> {
  await prisma().userMembership.update({
    where: { id: membershipId },
    data: {
      stripeSubscriptionId,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
    },
  })
}

// Reason: idempotent activation — finds by stripeCheckoutSessionId first so it
// works even if the pending record was never created (e.g. process crash between
// createPendingMembership and stripe.checkout.sessions.create). Called from both
// the success-page verify endpoint and the webhook so neither depends on the other.
export async function createOrActivateMembershipByStripeSession(
  stripeCheckoutSessionId: string,
  userId: string,
  tierId: string,
  stripeSubscriptionId?: string,
): Promise<void> {
  const p = prisma()
  const existing = await p.userMembership.findFirst({
    where: { stripeCheckoutSessionId },
    select: { id: true, status: true },
  })

  if (existing?.status === 'active') return

  const subData = stripeSubscriptionId ? { stripeSubscriptionId } : {}

  if (existing) {
    await p.userMembership.update({
      where: { id: existing.id },
      data: {
        status: 'active',
        paymentMethod: 'stripe',
        activatedAt: new Date(),
        ...subData,
      },
    })
  } else {
    await p.userMembership.create({
      data: {
        userId,
        tierId,
        status: 'active',
        paymentMethod: 'stripe',
        activatedAt: new Date(),
        stripeCheckoutSessionId,
        ...subData,
      },
    })
  }
}
