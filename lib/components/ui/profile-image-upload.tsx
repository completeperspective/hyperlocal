/* eslint-disable @next/next/no-img-element */
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CameraIcon, Loader2Icon } from 'lucide-react'
import { DEFAULT_AVATAR_URL } from '@/utils'

const ACCEPTED = 'image/jpeg,image/png,image/webp'

interface ProfileImageUploadProps {
  currentImageUrl?: string | null
  userName?: string | null
  /** Tailwind size classes applied to the avatar button. Defaults to 'h-24 w-24'. */
  avatarClassName?: string
}

export function ProfileImageUpload({
  currentImageUrl,
  userName,
  avatarClassName = 'h-24 w-24',
}: ProfileImageUploadProps) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const displaySrc = preview ?? currentImageUrl ?? DEFAULT_AVATAR_URL

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setError(null)
    setIsUploading(true)

    const body = new FormData()
    body.append('file', file)

    try {
      const res = await fetch('/api/v1/account/profile/image', {
        method: 'POST',
        body,
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.message ?? 'Upload failed')
        setPreview(null)
        return
      }

      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setPreview(null)
    } finally {
      setIsUploading(false)
      // Reason: reset value so the same file can be reselected after an error
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-label="Change profile photo"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={`group relative overflow-hidden rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed ${avatarClassName}`}
      >
        <img
          src={displaySrc}
          alt={userName ? `${userName}'s avatar` : 'Profile photo'}
          className="h-full w-full object-cover"
        />
        {isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2Icon className="h-6 w-6 animate-spin text-white" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <CameraIcon className="h-6 w-6 text-white" />
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFileChange}
        data-testid="profile-image-input"
      />
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP · max 5 MB</p>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
