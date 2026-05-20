import type { MembershipStatus } from '@/types/users-admin'
import { cn } from '@/utils'

const STATUS_CONFIG: Record<
  MembershipStatus,
  { label: string; classes: string }
> = {
  active: {
    label: 'Active',
    classes: 'bg-positive/15 text-positive border-positive/20',
  },
  pending: { label: 'Pending', classes: 'bg-info/15 text-info border-info/20' },
  expired: {
    label: 'Expired',
    classes: 'bg-muted text-muted-foreground border-border',
  },
  failed: {
    label: 'Failed',
    classes: 'bg-warning/15 text-warning border-warning/20',
  },
  blocked: {
    label: 'Blocked',
    classes: 'bg-destructive/15 text-destructive border-destructive/20',
  },
}

interface MembershipStatusBadgeProps {
  status: MembershipStatus
  className?: string
}

export function MembershipStatusBadge({
  status,
  className,
}: MembershipStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.expired
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
