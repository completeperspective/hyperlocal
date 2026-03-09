export const users = [
  {
    name: 'Admin',
    email: 'admin@example.com',
    recoveryPhrase: 'Password123!',
    isAdmin: true,
  },
  {
    name: 'Bob Dylan',
    email: 'bob@example.com',
    recoveryPhrase: 'Password123!',
  },
]

export const profiles = [
  {
    nickname: 'Admin',
    owner: {
      create: users[0],
    },
    description: 'Admin user',
    location: 'Canada',
    image: {
      title: 'Admin',
      source: './seed-data/assets/admin_profile.jpg',
      altText: 'Admins profile image',
    },
  },
  {
    nickname: 'Bobby',
    owner: {
      create: users[1],
    },
    description: 'builder of things',
    location: 'Canada',
    image: {
      title: 'Bobby',
      source: './seed-data/assets/user_profile.jpg',
      altText: 'Bobbys profile image',
    },
  },
]

export const settings = [
  {
    siteName: 'hyper[local]',
    baseUrl: 'http://localhost:7777',
    metaTitle: 'hyperlocal',
    metaDescription: 'An open source web application framework',
    copyright: '- created with ♥ by complete perspective -',
    theme: {
      create: {
        name: 'Default',
        fontPrimary: "'Lobster', serif",
        fontSecondary: "'Open Sans', sans-serif",
      },
    },
    homePage: {
      create: {
        title: 'Welcome',
        description: 'An open source community engagement platform',
        slug: 'welcome',
        publishedAt: '2025-04-20T00:00:00.000Z',
        status: 'published',
        trustedHtml: `
        <main class="flex min-h-[calc(100vh-65px)] w-full flex-col justify-between p-8 sm:py-32 sm:px-16 bg-transparent">
            <h2 class="mb-10 font-semibold leading-9">
                <span class="text-2xl text-gray-600 dark:text-zinc-300">
                  hyper[<span class="text-primary">local</span>]
                </span>
            </h2>
            <div class="flex flex-col items-start gap-6 md:text-center md:items-center text-left md:mb-8">
                <h3 class="font-secondary text-5xl leading-16 tracking-tight text-black dark:text-zinc-50">
                  An open source community engagement platform
                </h3>
            </div>
            <div class="flex flex-col w-full items-center gap-4 text-base font-medium leading-6 md:justify-center md:flex-row">
                <a
                class="flex h-12 w-full items-center justify-center rounded border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                href="/dashboard"
                target="_self"
                rel="noopener noreferrer"
                >
                Dashboard
                </a>

                
            </div>
        </main>`,
      },
    },
  },
]
