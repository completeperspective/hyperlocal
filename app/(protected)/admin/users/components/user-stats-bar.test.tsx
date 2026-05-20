import { render, screen } from '@testing-library/react'
import type { UserStats } from '@/types/users-admin'
import { UserStatsBar } from './user-stats-bar'

const baseStats: UserStats = {
  totalUsers: 1000,
  activeMembers: 42,
  mrrEstimateCents: 99900,
}

describe('UserStatsBar', () => {
  it('renders total users with locale formatting', () => {
    render(<UserStatsBar stats={baseStats} />)
    expect(screen.getByText('1,000')).toBeInTheDocument()
  })

  it('renders active members count', () => {
    render(<UserStatsBar stats={baseStats} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders MRR formatted as dollars', () => {
    render(<UserStatsBar stats={baseStats} />)
    expect(screen.getByText('$999')).toBeInTheDocument()
  })

  it('renders the Est. MRR label on the MRR card', () => {
    render(<UserStatsBar stats={baseStats} />)
    expect(screen.getByText('Est. MRR')).toBeInTheDocument()
  })

  it('renders all three stat labels', () => {
    render(<UserStatsBar stats={baseStats} />)
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('Active Members')).toBeInTheDocument()
    expect(screen.getByText('Est. MRR')).toBeInTheDocument()
  })

  it('renders zero values without errors', () => {
    const zeroStats: UserStats = {
      totalUsers: 0,
      activeMembers: 0,
      mrrEstimateCents: 0,
    }
    render(<UserStatsBar stats={zeroStats} />)
    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(screen.getByText('$0')).toBeInTheDocument()
  })
})
