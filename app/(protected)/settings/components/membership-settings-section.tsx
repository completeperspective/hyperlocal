import type { UserMembership } from '@/types/membership'
import { MembershipManagePanel } from '@/ui/membership-manage-panel'

interface MembershipSettingsSectionProps {
  membership: UserMembership | null
}

export function MembershipSettingsSection({
  membership,
}: MembershipSettingsSectionProps) {
  return (
    <section
      id="membership"
      className="rounded-lg border border-border bg-card p-6 space-y-4"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Membership
      </h2>
      <MembershipManagePanel membership={membership} compact />
    </section>
  )
}
