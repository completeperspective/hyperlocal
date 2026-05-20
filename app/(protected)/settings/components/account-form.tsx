'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

interface AccountFormProps {
  initialValues: { name: string | null; email: string; mobile: string | null }
}

export function AccountForm({ initialValues }: AccountFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialValues.name ?? '')
  const [email, setEmail] = useState(initialValues.email)
  const [mobile, setMobile] = useState(initialValues.mobile ?? '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsPending(true)

    try {
      const res = await fetch('/api/v1/account/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile }),
      })

      const body = (await res.json().catch(() => ({}))) as { message?: string }

      if (!res.ok) {
        if (res.status === 409) {
          setError(body.message ?? 'A conflict occurred.')
        } else {
          setError(body.message ?? 'Something went wrong')
        }
        return
      }

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-name">Name</Label>
        <Input
          id="account-name"
          type="text"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-email">Email</Label>
        <Input
          id="account-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-mobile">Mobile</Label>
        <Input
          id="account-mobile"
          type="tel"
          placeholder="+1 555 000 0000"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
        >
          Changes saved.
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
