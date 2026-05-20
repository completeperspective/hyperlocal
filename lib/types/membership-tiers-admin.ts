export type RecurringInterval = 'week' | 'month' | 'year'

export interface TierRow {
  id: string
  name: string
  description: string | null
  priceInCents: number
  currency: 'usd' | 'cad'
  paymentType: 'free' | 'one_time' | 'subscription'
  recurringInterval: RecurringInterval | null
  isActive: boolean
  stripeProductId: string | null
  stripePriceId: string | null
  memberCount: number
  contentAccessPatterns: string[]
}

export interface TiersListResponse {
  tiers: TierRow[]
  totalCount: number
}

export interface CreateTierPayload {
  name: string
  description?: string
  priceInCents: number
  currency: 'usd' | 'cad'
  paymentType: 'free' | 'one_time' | 'subscription'
  recurringInterval?: RecurringInterval | null
  isActive?: boolean
  contentAccessPatterns?: string[]
}

export interface UpdateTierPayload {
  name?: string
  description?: string
  priceInCents?: number
  isActive?: boolean
  contentAccessPatterns?: string[]
}
