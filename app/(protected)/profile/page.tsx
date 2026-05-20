import { Metadata } from 'next'
import { getSession } from '@/server/auth'
import { AppSettings, getPageMetadata } from '@/server/helpers'
import { keystoneContext } from '@/server/keystone/context'
import { ProfilePageClient } from './profile-page-client'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('Profile')
}

export default async function ProfilePage() {
  const settings = await AppSettings.instance.settings()
  const { data: sessionData } = await getSession()

  // Reason: fetch profile directly from DB rather than session cookie so edits
  // are reflected immediately after router.refresh() without requiring re-login.
  const user = sessionData?.id
    ? await keystoneContext.sudo().query.User.findOne({
        where: { id: sessionData.id },
        query:
          'id name profile { nickname description location isPublic contactPreference image { source { publicUrl } } }',
      })
    : null

  const profile = user?.profile as
    | {
        nickname?: string
        description?: string
        location?: string
        isPublic?: boolean
        contactPreference?: string
        image?: { source?: { publicUrl?: string } }
      }
    | null
    | undefined

  return (
    <div className="min-h-[calc(100vh-var(--header-height))]">
      <ProfilePageClient
        imageUrl={profile?.image?.source?.publicUrl ?? null}
        userName={profile?.nickname ?? (user?.name as string | null) ?? null}
        nickname={profile?.nickname ?? null}
        description={profile?.description ?? null}
        location={profile?.location ?? null}
        isPublic={profile?.isPublic ?? false}
        contactPreference={profile?.contactPreference ?? null}
        copyright={settings?.copyright ?? null}
      />
    </div>
  )
}
