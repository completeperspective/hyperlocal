import { Metadata } from 'next'
import Image from 'next/image'
import { getSession } from '@/server/auth'
import { AppSettings, getPageMetadata } from '@/server/helpers'

export async function generateMetadata(): Promise<Metadata> {
  // get page metadata
  return await getPageMetadata('Profile')
}

export default async function ProfilePage() {
  const settings = await AppSettings.instance.settings()

  const { data } = await getSession()

  return (
    <div className="gap-16 p-4 pb-20 sm:p-20 grid min-h-[calc(100vh-65px)] grid-rows-[20px_1fr_20px] items-center justify-items-center">
      <main className="gap-4 row-start-2 flex w-full flex-col">
        <section className="flex flex-wrap w-full gap-8 items-center justify-center">
          {data?.profile?.image && (
            <Image
              src={data?.profile?.image?.source?.publicUrl as string}
              alt="Profile"
              className="size-45 rounded-full object-cover"
              width={180}
              height={180}
            />
          )}

          <div>
            <h1 className="text-primary dark:text-primary-dark mb-4">
              Your Profile
            </h1>
            <p className="max-w-sm">
              <span className="font-semibold">Nickname:</span>{' '}
              {data?.profile?.nickname}
            </p>
            <p className="max-w-sm">
              <span className="font-semibold">Description:</span>{' '}
              {data?.profile?.description}
            </p>
            <p className="max-w-sm">
              <span className="font-semibold">Location:</span>{' '}
              {data?.profile?.location}
            </p>
          </div>
        </section>
      </main>
      <footer className="gap-6 row-start-3 flex flex-wrap items-center justify-center">
        <p className="text-xs text-gray-400">{settings?.copyright}</p>
      </footer>
    </div>
  )
}
