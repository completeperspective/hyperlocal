import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/server/auth'
import { AppSettings } from '@/server/helpers/AppSettings'
import { getMetadata } from '@/server/helpers/get-metadata'

export async function generateMetadata(): Promise<Metadata> {
  return await getMetadata('Home')
}

export default async function PublicLanding() {
  const settings = await AppSettings.instance.settings()
  const isAuth = await isAuthenticated()

  if (settings?.isPrivate && !isAuth) {
    redirect('/login')
  }

  return (
    <div className="gap-16 p-8 pb-20 sm:p-20 grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="gap-4 sm:items-start row-start-2 flex flex-col items-center">
        <h1 className="text-primary dark:text-primary-dark text-4xl font-bold sm:text-left text-center">
          Welcome to Web App!
        </h1>
        <p className="max-w-sm mb-4">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Autem
          delectus natus nostrum id eos.
        </p>
      </main>
      <footer className="gap-6 row-start-3 flex flex-wrap items-center justify-center">
        <p className="text-xs text-gray-400">
          - created with ♥ by complete perspective -
        </p>
      </footer>
    </div>
  )
}
