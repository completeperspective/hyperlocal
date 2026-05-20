import { BadgeCheckIcon, CoinsIcon, UsersIcon } from 'lucide-react'
import type { UserStats } from '@/types/users-admin'

interface UserStatsBarProps {
  stats: UserStats
}

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
  note?: string
}

function StatCard({ icon, value, label, note }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">{icon}</div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
    </div>
  )
}

export function UserStatsBar({ stats }: UserStatsBarProps) {
  const mrr = (stats.mrrEstimateCents / 100).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard
        icon={<UsersIcon className="size-4 text-muted-foreground" />}
        value={stats.totalUsers.toLocaleString()}
        label="Total Users"
      />
      <StatCard
        icon={<BadgeCheckIcon className="size-4 text-muted-foreground" />}
        value={stats.activeMembers.toLocaleString()}
        label="Active Members"
      />
      <StatCard
        icon={<CoinsIcon className="size-4 text-muted-foreground" />}
        value={`$${mrr}`}
        label="Est. MRR"
      />
    </div>
  )
}
