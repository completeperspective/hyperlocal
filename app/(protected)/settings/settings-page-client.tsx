'use client'

import type { UserMembership } from '@/types/membership'
import { ProfilePageClient } from '../profile/profile-page-client'
import { AccountForm } from './components/account-form'
import { DeleteAccountSection } from './components/delete-account-dialog'
import { MembershipSettingsSection } from './components/membership-settings-section'
import { SecurityForm } from './components/security-form'

interface SettingsPageClientProps {
  name: string | null
  email: string
  mobile: string | null
  nickname: string | null
  description: string | null
  location: string | null
  isPublic: boolean
  contactPreference: string | null
  imageUrl: string | null
  userName: string | null
  currentMembership: UserMembership | null
}

export function SettingsPageClient({
  name,
  email,
  mobile,
  nickname,
  description,
  location,
  isPublic,
  contactPreference,
  imageUrl,
  userName,
  currentMembership,
}: SettingsPageClientProps) {
  return (
    <div className="container-prose section-normal space-y-6">
      <div className="space-y-1 mb-2">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and profile
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </h2>
        <ProfilePageClient
          imageUrl={imageUrl}
          userName={userName ?? email}
          nickname={nickname}
          description={description}
          location={location}
          isPublic={isPublic}
          contactPreference={contactPreference}
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <AccountForm initialValues={{ name, email, mobile }} />
      </section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Security
        </h2>
        <SecurityForm />
      </section>

      <MembershipSettingsSection membership={currentMembership} />

      <DeleteAccountSection />
    </div>
  )
}
