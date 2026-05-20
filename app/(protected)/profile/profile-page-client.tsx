'use client'

import { useRouter } from 'next/navigation'
import { InlineEditField } from '@/ui/inline-edit-field'
import { ProfileImageUpload } from '@/ui/profile-image-upload'

interface ProfilePageClientProps {
  imageUrl: string | null
  userName: string | null
  nickname: string | null
  description: string | null
  location: string | null
  isPublic: boolean
  contactPreference?: string | null
  copyright?: string | null
}

export function ProfilePageClient({
  imageUrl,
  userName,
  nickname,
  description,
  location,
  isPublic,
  contactPreference,
  copyright,
}: ProfilePageClientProps) {
  const router = useRouter()

  async function saveField(
    field:
      | 'nickname'
      | 'description'
      | 'location'
      | 'isPublic'
      | 'contactPreference',
    value: string | boolean,
  ) {
    const res = await fetch('/api/v1/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(
        (body as { message?: string }).message ?? 'Failed to save',
      )
    }
    router.refresh()
  }

  return (
    <div className="container-prose section-normal flex flex-col gap-6">
      <section className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-12">
        <div className="mt-12 sm:mt-0">
          <ProfileImageUpload
            currentImageUrl={imageUrl}
            userName={userName}
            avatarClassName="h-40 w-40 sm:h-52 sm:w-52"
          />
        </div>

        <div className="flex w-full flex-col gap-4">
          <h1 className="mb-4 mt-10 text-primary dark:text-primary-dark sm:mb-0 sm:mt-0">
            Your Profile
          </h1>

          <InlineEditField
            label="Nickname"
            value={nickname ?? ''}
            onSave={(v) => saveField('nickname', v)}
            placeholder="Your display name"
            emptyText="Not set"
          />

          <InlineEditField
            label="Bio"
            value={description ?? ''}
            onSave={(v) => saveField('description', v)}
            multiline
            placeholder="A short bio"
            emptyText="No bio yet"
          />

          <InlineEditField
            label="Location"
            value={location ?? ''}
            onSave={(v) => saveField('location', v)}
            placeholder="Where are you?"
            emptyText="Not set"
          />

          <label className="flex cursor-pointer items-center gap-2 pt-2">
            <input
              type="checkbox"
              defaultChecked={isPublic}
              onChange={(e) => saveField('isPublic', e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Show me in the members directory</span>
          </label>

          <div className="flex flex-col gap-1.5 pt-2">
            <span className="text-sm font-medium">Preferred contact</span>
            <select
              defaultValue={contactPreference ?? 'email'}
              onChange={(e) => saveField('contactPreference', e.target.value)}
              className="flex rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="both">Both</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </section>
      {copyright && (
        <p className="text-xs text-muted-foreground text-center">{copyright}</p>
      )}
    </div>
  )
}
