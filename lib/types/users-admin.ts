export type MembershipStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'failed'
  | 'blocked'
export type PaymentMethod = 'free' | 'stripe' | 'crypto'

export interface UserMembershipData {
  id: string
  status: MembershipStatus
  paymentMethod: PaymentMethod | null
  activatedAt: string | null
  expiresAt: string | null
  stripeSubscriptionId: string | null
  cryptoTxHash: string | null
  tier: {
    id: string
    name: string
    priceInCents: number
    paymentType: string
  } | null
}

export interface UserRow {
  id: string
  email: string
  isAdmin: boolean
  walletAddress: string | null
  profile: {
    nickname: string | null
    location: string | null
    imageUrl: string | null
    description: string | null
    isPublic: boolean
    contactPreference: string | null
  } | null
  membership: UserMembershipData | null
}

export interface UserDetail extends UserRow {
  name: string | null
  mobile: string | null
  profile: {
    nickname: string | null
    location: string | null
    imageUrl: string | null
    description: string | null
    isPublic: boolean
    contactPreference: string | null
  } | null
  learnerProfile: {
    totalLessonsCompleted: number
    totalCoursesCompleted: number
    lastActiveAt: string | null
  } | null
}

export interface UserStats {
  totalUsers: number
  activeMembers: number
  mrrEstimateCents: number
}

export interface UsersListResponse {
  users: UserRow[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserFilters {
  q: string
  status: string
  tier: string
  role: string
  wallet: string
  page: number
  pageSize: number
}
