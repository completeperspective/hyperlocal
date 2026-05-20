'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircleIcon } from 'lucide-react'
import { authenticateUserWithPassword } from '@/actions/authenticate-user-with-password'
import { Alert, AlertDescription } from '@/ui/alert'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'

export function LoginForm({
  returnTo = '/dashboard',
  allowSignup = false,
}: {
  returnTo?: string
  allowSignup?: boolean
}) {
  const [formState, loginAction] = useActionState(
    authenticateUserWithPassword,
    { message: '' },
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (formState?.sessionToken) {
      // Hard navigation ensures the session cookie is committed to the browser
      // jar before the next request fires. router.push() is too fast on iOS WebKit.
      window.location.href = returnTo
    }
  }, [formState, returnTo])

  return (
    <section className="w-full max-w-sm">
      <div className="mb-4">
        {formState?.message && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircleIcon />
            <AlertDescription>{formState.message}</AlertDescription>
          </Alert>
        )}
      </div>
      <form action={loginAction}>
        <div className="gap-4 my-10 flex flex-col">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            name="password"
            placeholder="Enter your password..."
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button className="lg:!w-full" type="submit">
            Login
          </Button>
          {allowSignup && (
            <p className="flex justify-center">
              Need an account?{' '}
              <Link
                href="/signup"
                className="ml-2 text-primary dark:text-primary-dark"
              >
                Sign up
              </Link>
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
