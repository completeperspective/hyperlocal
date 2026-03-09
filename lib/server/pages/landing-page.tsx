import Link from 'next/link'
import { AppSettings } from '@/server/helpers/AppSettings'
import { isAuthenticated } from '../auth'

export async function LandingPage() {
  const auth = await isAuthenticated()
  const appSettings = await AppSettings.instance.settings()
  return (
    <main className="flex min-h-[calc(100vh-65px)] w-full flex-col justify-between p-8 sm:py-32 sm:px-16 bg-transparent">
      <h2 className="mb-10 font-semibold leading-9">
        <span className="text-2xl font-primary text-gray-600 dark:text-zinc-300">
          {appSettings?.siteName}
        </span>
      </h2>
      <div className="flex flex-col items-start gap-6 text-left md:text-center md:items-center md:mb-8">
        <h3 className="font-secondary text-5xl leading-16 tracking-tight text-black dark:text-zinc-50">
          {appSettings?.metaDescription}
        </h3>
      </div>
      <div className="flex flex-col w-full items-center gap-4 text-base font-medium leading-6 md:justify-center md:flex-row">
        {auth ? (
          <Link
            className="flex h-12 w-full items-center justify-center rounded bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="/dashboard"
            target="_self"
            rel="noopener noreferrer"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              className="flex h-12 w-full items-center justify-center rounded border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#2a2a2a] md:w-[158px]"
              href="/login"
              target="_self"
              rel="noopener noreferrer"
            >
              Log in
            </Link>
            {appSettings?.allowSignup && (
              <Link
                className="flex h-12 w-full items-center justify-center gap-2 rounded bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                href="/signup"
                target="_self"
                rel="noopener noreferrer"
              >
                Sign up
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  )
}
