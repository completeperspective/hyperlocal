'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react'
import { authenticateUserWithPassword } from '@/actions/authenticate-user-with-password'
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'

export function LoginForm() {
  const router = useRouter()
  const [formState, loginAction] = useActionState(
    authenticateUserWithPassword,
    {
      message: '',
    },
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showAlert, setShowAlert] = useState<boolean | null>(null)

  useEffect(() => {
    if (formState?.message || formState?.sessionToken) {
      setShowAlert(true)
    }
  }, [formState])

  return (
    <section className="w-sm">
      <div className="mb-4">
        {showAlert && (
          <>
            {formState?.message && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircleIcon />
                <AlertDescription>{formState.message}</AlertDescription>
              </Alert>
            )}
            {formState?.sessionToken && (
              <Alert className="text-positive mb-8">
                <CheckCircle2Icon />

                <AlertTitle>
                  Success! The server issued a secure auth token!
                </AlertTitle>
              </Alert>
            )}
          </>
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

          <p className="flex justify-center">
            Need an account?{' '}
            <Link
              href="/signup"
              className="ml-2 text-primary dark:text-primary-dark"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </section>
  )
}
