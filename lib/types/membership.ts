export interface MembershipTier {
  id: string
  name: string
  description: string | null
  priceInCents: number
  paymentType: 'free' | 'one_time' | 'subscription'
  stripeProductId: string | null
  stripePriceId: string | null
  isActive: boolean
  contentAccessPatterns: string[]
}

export interface UserMembership {
  id: string
  tier: MembershipTier | null
  status: 'pending' | 'active' | 'expired' | 'failed' | 'blocked'
  paymentMethod: 'free' | 'stripe' | 'crypto' | null
  activatedAt: string | null
  expiresAt: string | null
}

export interface MembershipsResponse {
  tiers: MembershipTier[]
  currentMembership: UserMembership | null
}
