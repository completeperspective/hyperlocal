'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'

export function CreateAccountForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form className="w-full">
      <div className="gap-4 mb-8 lg:gap-2 flex flex-col">
        <Input
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div>
          <Input
            id="password"
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
  )
}
