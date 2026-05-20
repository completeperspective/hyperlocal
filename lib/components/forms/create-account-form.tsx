'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircleIcon } from 'lucide-react'
import { createUserAccount } from '@/actions/create-user-account'
import { Alert, AlertDescription } from '@/ui/alert'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'

export function CreateAccountForm({
  returnTo = '/dashboard',
}: {
  returnTo?: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showAlert, setShowAlert] = useState<boolean | null>(null)
  const [formState, createAccount] = useActionState(createUserAccount, {
    message: '',
  })

  useEffect(() => {
    if (formState?.sessionToken) {
      // Hard navigation ensures the session cookie is committed on iOS WebKit
      // before the next request fires. router.push() races the cookie jar.
      window.location.href = returnTo
      return
    }
    if (formState?.message) {
      setShowAlert(true)
    }
  }, [formState, returnTo])

  return (
    <section className="w-full max-w-sm">
      <div className="mb-4">
        {showAlert && formState?.message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{formState.message}</AlertDescription>
          </Alert>
        )}
      </div>
      <form className="w-full" action={createAccount}>
        <div className="gap-4 my-10 lg:gap-2 flex flex-col">
          <Input
            id="name"
            name="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <Input
              id="password"
              name="password"
              placeholder="Enter your recovery phrase"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-gray-500 text-sm">
              * required to access your account
            </p>
          </div>
        </div>
        <div className="gap-4 lg:gap-2 flex flex-col">
          <Button className="lg:!w-full" type="submit">
            Sign Up!
          </Button>

          <p className="flex justify-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="ml-2 text-primary dark:text-primary-dark"
            >
              Log in
            </Link>
          </p>
        </div>
      </form>
    </section>
  )
}
