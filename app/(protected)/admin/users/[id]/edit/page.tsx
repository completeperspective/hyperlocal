import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { keystoneContext } from '@/server/keystone/context'
import type { UserDetail } from '@/types/users-admin'
import { UserEditForm } from './user-edit-form'

export const metadata: Metadata = { title: 'Edit User' }

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const result = (await keystoneContext.sudo().graphql.run({
    query: `
      query GetUserDetail($id: ID!) {
        user(where: { id: $id }) {
          id
          name
          email
          mobile
          isAdmin
          walletAddress
          profile {
            nickname
            location
            description
            isPublic
            contactPreference
            image { source { publicUrl } }
          }
          learnerProfile {
            totalLessonsCompleted
            totalCoursesCompleted
            lastActiveAt
          }
        }
      }
    `,
    variables: { id },
  })) as {
    user: {
      id: string
      name: string | null
      email: string
      mobile: string | null
      isAdmin: boolean
      walletAddress: string | null
      profile: {
        nickname: string | null
        location: string | null
        description: string | null
        isPublic: boolean
        contactPreference: string | null
        image: { source: { publicUrl: string } | null } | null
      } | null
      learnerProfile: {
        totalLessonsCompleted: number | null
        totalCoursesCompleted: number | null
        lastActiveAt: string | null
      } | null
    } | null
  }

  const raw = result?.user
  if (!raw) notFound()

  const user: UserDetail = {
    id: raw.id,
    name: raw.name ?? null,
    email: raw.email,
    mobile: raw.mobile ?? null,
    isAdmin: raw.isAdmin ?? false,
    walletAddress: raw.walletAddress ?? null,
    profile: raw.profile
      ? {
          nickname: raw.profile.nickname ?? null,
          location: raw.profile.location ?? null,
          description: raw.profile.description ?? null,
          isPublic: raw.profile.isPublic ?? false,
          contactPreference: raw.profile.contactPreference ?? null,
          imageUrl: raw.profile.image?.source?.publicUrl ?? null,
        }
      : null,
    membership: null,
    learnerProfile: raw.learnerProfile
      ? {
          totalLessonsCompleted: raw.learnerProfile.totalLessonsCompleted ?? 0,
          totalCoursesCompleted: raw.learnerProfile.totalCoursesCompleted ?? 0,
          lastActiveAt: raw.learnerProfile.lastActiveAt ?? null,
        }
      : null,
  }

  const displayName = user.profile?.nickname ?? user.name ?? user.email

  return (
    <div className="w-full max-w-3xl p-4 sm:mx-auto space-y-6">
      <Link
        href="/admin/community"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back
      </Link>

      <div className="flex items-center gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
          {displayName !== user.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </div>

      <UserEditForm user={user} />
    </div>
  )
}
