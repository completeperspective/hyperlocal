import { Metadata } from 'next'
import { CreateAccountForm } from '@/components/forms/create-account-form'

export const metadata: Metadata = {
  title: 'Web App | Sign Up',
  description: 'Nextjs web app with Keystonejs data engine',
}

export default function SignUp() {
  return (
    <div className="gap-16 p-4 pb-20 sm:p-20 grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="gap-4 sm:items-start row-start-2 flex flex-col items-center">
        <h1 className="mb-6">Create Acccount</h1>
        <CreateAccountForm />
      </main>
      <footer className="gap-6 row-start-3 flex flex-wrap items-center justify-center">
        <p className="text-xs text-gray-400">
          - created with ♥ by complete perspective -
        </p>
      </footer>
    </div>
  )
}
