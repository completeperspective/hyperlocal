import { NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'

const TIER_QUERY = 'id name description priceInCents paymentType isActive'
const MEMBERSHIP_QUERY = `
  id status paymentMethod activatedAt expiresAt
  tier { id name priceInCents paymentType }
`

const query = () => keystoneContext.sudo().query

export async function GET() {
  const tiers = await query().MembershipTier.findMany({
    where: { isActive: { equals: true } },
    query: TIER_QUERY,
  })

  const { data: sessionData } = await getSession()
  let currentMembership = null

  if (sessionData?.id) {
    // Active membership takes priority; fall back to most recent of any status
    const active = await query().UserMembership.findMany({
      where: {
        user: { id: { equals: sessionData.id } },
        status: { equals: 'active' },
      },
      query: MEMBERSHIP_QUERY,
      take: 1,
    })

    if (active.length > 0) {
      currentMembership = active[0]
    } else {
      const any = await query().UserMembership.findMany({
        where: { user: { id: { equals: sessionData.id } } },
        query: MEMBERSHIP_QUERY,
        orderBy: [{ id: 'desc' }],
        take: 1,
      })
      currentMembership = any[0] ?? null
    }
  }

  return NextResponse.json({ tiers, currentMembership })
}
