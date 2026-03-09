import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CreateAccountForm } from '@/components/forms'
import { AppSettings } from '@/server/helpers/AppSettings'
import { getPageMetadata } from '@/server/helpers/get-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('Signup')
}

export default async function SignUp() {
  const appSettings = await AppSettings.instance.settings()

  // invitation only, no public signups #boot2root
  if (!appSettings?.allowSignup) {
    redirect('/')
  }

  return (
    <div className="gap-16 p-4 pb-20 sm:p-20 grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="gap-4 sm:items-start row-start-2 flex flex-col items-center">
        <h1>Create Acccount</h1>
        <CreateAccountForm />
      </main>
      <footer className="gap-6 row-start-3 flex flex-wrap items-center justify-center">
        <p className="text-xs text-gray-400">
          {appSettings?.isPrivate ? '' : appSettings?.copyright}
        </p>
      </footer>
    </div>
  )
}
