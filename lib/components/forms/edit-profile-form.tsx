'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { Alert, AlertDescription } from '@/ui/alert'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

interface EditProfileFormProps {
  initialValues?: {
    nickname?: string
    description?: string
    location?: string
  }
  onSuccess?: () => void
}

export function EditProfileForm({
  initialValues = {},
  onSuccess,
}: EditProfileFormProps) {
  const router = useRouter()
  const [nickname, setNickname] = useState(initialValues.nickname ?? '')
  const [description, setDescription] = useState(
    initialValues.description ?? '',
  )
  const [location, setLocation] = useState(initialValues.location ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const res = await fetch('/api/v1/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, description, location }),
      })

      if (res.ok) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => {
          setSuccess(false)
          onSuccess?.()
        }, 2000)
        return
      }

      const body = await res.json().catch(() => ({}))
      setError(body.message ?? 'Failed to update profile')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="w-full max-w-md">
      <div className="mb-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="text-positive">
            <CheckCircle2Icon />
            <AlertDescription>Profile updated!</AlertDescription>
          </Alert>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            name="nickname"
            placeholder="Your display name"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="description">Bio</Label>
          <textarea
            id="description"
            name="description"
            placeholder="A short bio"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="Where are you?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </section>
  )
}
