'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form className="w-full">
      <div className="gap-4 mb-8 flex flex-col">
        <Input
          id="email"
          type="email"
          placeholder="Enter your email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="password"
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
  )
}
