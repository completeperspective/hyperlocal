import { createInterface } from 'readline/promises'
import { getContext } from '@keystone-6/core/context'
import { BaseKeystoneTypeInfo, KeystoneContext } from '@keystone-6/core/types'
import * as PrismaModule from '@prisma/client'
import { deleteFileByPublicId, getPublicId, prepareFile } from '../cloudinary'
import config from '../keystone'
import { courseChaptersBySlug, courses } from './courses'
import { membershipTiers, profiles, settings, users } from './data'
import { lessonPages } from './lesson-pages'
import { pageIndexes } from './page-indexes'

async function deleteLists(
  lists: string[],
  context: KeystoneContext<BaseKeystoneTypeInfo>,
) {
  for (let i = 0; i < lists.length; i++) {
    const existingItems = await context.db[lists[i]].findMany()
    for (const deleteItem of existingItems) {
      await context.db[lists[i]].deleteOne({
        where: { id: `${deleteItem.id}` },
      })
    }
  }
}

async function deleteProfiles(context: KeystoneContext<BaseKeystoneTypeInfo>) {
  // DESTROY all Profile Images
  const existingProfileImages = await context
    .sudo()
    .query.ProfileImage.findMany({
      query: 'id title altText source { id publicUrl }',
    })
  console.log(`🚨 Deleting ${existingProfileImages.length} profile images...`)
  for (const deleteImage of existingProfileImages) {
    console.log(`🗑️  Deleting profile image ${deleteImage.altText}...`)
    // remove file from cloud
    try {
      const publicId = getPublicId(deleteImage?.source?.publicUrl)
      await deleteFileByPublicId(publicId)
      console.log('\tremoved from cloud')
    } catch (e) {
      console.error(e)
    }
    // remove from db
    try {
      await context.db.ProfileImage.deleteOne({
        where: { id: `${deleteImage.id}` },
      })
      console.log('\tremoved from database')
    } catch (e) {
      console.error(e)
    }
  }
  // DESTROY all Profiles
  const existingProfiles = await context.db.Profile.findMany()
  for (const deleteProfile of existingProfiles) {
    await context.db.Profile.deleteOne({
      where: { id: `${deleteProfile.id}` },
    })
  }
}

async function seedUsers(context: KeystoneContext<BaseKeystoneTypeInfo>) {
  for (const user of users) {
    console.log(`👤 Creating user ${user.email}...`)
    // Reason: using query.User (not db.User) so the afterOperation hook fires
    // and auto-creates a bare Profile. seedProfiles() then updates that profile
    // in-place — avoiding a second profile being created for the same user.
    await context.query.User.createOne({ data: user })
  }
}

async function seedProfiles(context: KeystoneContext<BaseKeystoneTypeInfo>) {
  for (const profile of profiles) {
    const { image, userEmail, ...profileData } = profile
    try {
      console.log(`🪪 Updating profile for ${userEmail}...`)

      // Find the profile auto-created by the User afterOperation hook.
      const [existing] = await context.sudo().query.Profile.findMany({
        where: { owner: { email: { equals: userEmail } } },
        query: 'id',
      })

      if (!existing) {
        console.error(`❌ No auto-created profile found for ${userEmail}`)
        continue
      }

      await context.sudo().query.Profile.updateOne({
        where: { id: existing.id },
        data: profileData,
      })

      console.log(`📸 Uploading profile image for ${userEmail}...`)
      const preparedImage = await prepareFile(image.source)

      await context.graphql.run({
        query: `
          mutation($image: Upload!, $profileId: ID!, $altText: String!, $title: String) {
            createProfileImage(data: {
              source: $image,
              altText: $altText,
              title: $title,
              profile: { connect: { id: $profileId } },
            }) {
              id
            }
          }
        `,
        variables: {
          title: image.title,
          image: preparedImage,
          altText: image.altText,
          profileId: existing.id,
        },
      })
    } catch (e) {
      console.log(e)
    }
  }
}

async function seedMembership(context: KeystoneContext<BaseKeystoneTypeInfo>) {
  console.log('💳 Seeding membership tiers...')

  // Reason: afterOperation hook only syncs to Stripe when priceInCents > 0 AND
  // STRIPE_SECRET_KEY is set — safe to create paid tiers in dev without Stripe configured.
  const tierIdByName: Record<string, string> = {}
  for (const tierData of membershipTiers) {
    const created = await context.query.MembershipTier.createOne({
      data: tierData,
      query: 'id name',
    })
    tierIdByName[created.name] = created.id
    console.log(`  ✅ Tier: ${created.name}`)
  }

  async function findUserId(email: string): Promise<string | null> {
    const [user] = await context.sudo().query.User.findMany({
      where: { email: { equals: email } },
      query: 'id',
    })
    return user?.id ?? null
  }

  // Admin — active free membership so test env needs no purchase.
  const adminId = await findUserId(users[0].email)
  if (!adminId) {
    console.error('❌ Admin user not found — skipping membership seed')
    return
  }
  await context.sudo().query.UserMembership.createOne({
    data: {
      user: { connect: { id: adminId } },
      tier: { connect: { id: tierIdByName['Member'] } },
      status: 'active',
      paymentMethod: 'free',
      activatedAt: new Date().toISOString(),
    },
  })
  console.log(`  ✅ admin@example.com — active (free)`)

  // Status test users — one membership per status value for manual UI testing.
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString()
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString()

  type MembershipSeed = {
    email: string
    tierName: string
    status: 'active' | 'pending' | 'expired' | 'failed' | 'blocked'
    paymentMethod: 'free' | 'stripe' | 'crypto'
    activatedAt?: string
    expiresAt?: string
  }

  const membershipSeeds: MembershipSeed[] = [
    // active@: active free membership — shows "Cancel Membership" CTA
    {
      email: 'active@example.com',
      tierName: 'Member',
      status: 'active',
      paymentMethod: 'free',
      activatedAt: ninetyDaysAgo,
    },
    // pending@: stripe subscription awaiting webhook confirmation — no CTA
    {
      email: 'pending@example.com',
      tierName: 'Premium',
      status: 'pending',
      paymentMethod: 'stripe',
    },
    // expired@: one-time purchase that lapsed — shows "Browse memberships" link
    {
      email: 'expired@example.com',
      tierName: 'Pro',
      status: 'expired',
      paymentMethod: 'free',
      activatedAt: ninetyDaysAgo,
      expiresAt: sevenDaysAgo,
    },
    // failed@: stripe payment failed — shows warning + browse link
    {
      email: 'failed@example.com',
      tierName: 'Premium',
      status: 'failed',
      paymentMethod: 'stripe',
    },
    // blocked@: manually restricted by admin — shows contact support message
    {
      email: 'blocked@example.com',
      tierName: 'Member',
      status: 'blocked',
      paymentMethod: 'free',
      activatedAt: ninetyDaysAgo,
    },
  ]

  console.log('👤 Seeding status test memberships...')
  for (const seed of membershipSeeds) {
    const userId = await findUserId(seed.email)
    const tierId = tierIdByName[seed.tierName]

    if (!userId) {
      console.error(`  ❌ User not found: ${seed.email}`)
      continue
    }
    if (!tierId) {
      console.error(`  ❌ Tier not found: ${seed.tierName}`)
      continue
    }

    await context.sudo().query.UserMembership.createOne({
      data: {
        user: { connect: { id: userId } },
        tier: { connect: { id: tierId } },
        status: seed.status,
        paymentMethod: seed.paymentMethod,
        ...(seed.activatedAt ? { activatedAt: seed.activatedAt } : {}),
        ...(seed.expiresAt ? { expiresAt: seed.expiresAt } : {}),
      },
    })
    console.log(
      `  ✅ ${seed.email} — ${seed.status} (${seed.tierName}, ${seed.paymentMethod})`,
    )
  }
}

export async function main() {
  const context: KeystoneContext<BaseKeystoneTypeInfo> = getContext(
    config,
    PrismaModule,
  )

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  console.log(
    '\n⚠️  WARNING: This will permanently delete ALL data in the database.',
  )
  console.log(
    '   Users, courses, pages, memberships, and settings will be wiped.\n',
  )
  const answer = await rl.question('   Type "yes" to continue: ')
  rl.close()
  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('\n❌ Seed cancelled.')
    process.exit(0)
  }

  console.log('\n🚨 Resetting database...')

  // Reason: profiles must be deleted before users so Cloudinary cleanup runs
  // while the profile image records still exist in the DB.
  await deleteProfiles(context)

  // Reason: UserMembership before User/MembershipTier to avoid FK conflicts.
  // Chapter before Course to avoid FK conflicts when deleting courses.
  // PageGroup before PageIndex (FK from PageGroup → PageIndex).
  // PageIndex/Course/Page before Hero — they hold heroId FKs pointing at Hero.
  // Settings before Course/PageIndex — it holds rootCourse/rootPageIndex FKs.
  const lists = [
    'CourseLessonProgress',
    'CourseEnrollment',
    'LearnerProfile',
    'UserMembership',
    'MembershipTier',
    'User',
    'Settings',
    'PageGroup',
    'PageIndex',
    'Chapter',
    'Course',
    'Page',
    'Hero',
    'Theme',
  ]
  await deleteLists(lists, context)

  console.log(`🌱 Inserting seed data...`)

  // Create users first — the afterOperation hook auto-creates a bare Profile
  // for each one. seedProfiles() then updates those profiles with the correct
  // data and uploads the images.
  await seedUsers(context)
  await seedProfiles(context)
  await seedMembership(context)

  // Settings is a singleton list
  for (const data of settings) {
    await context.query.Settings.createOne({ data })
  }

  // Seed lesson pages
  for (const data of lessonPages) {
    await context.query.Page.createOne({ data })
  }

  // Seed page indexes
  for (const data of pageIndexes) {
    console.log(`📄 Creating page index: ${data.title}...`)
    await context.query.PageIndex.createOne({ data })
  }

  // Seed courses
  for (const data of courses) {
    console.log(`📚 Creating course: ${data.title}...`)
    const created = await context.query.Course.createOne({ data })

    // Seed chapters for this course
    const chapterDefs = courseChaptersBySlug[data.slug] ?? []
    for (const chapterDef of chapterDefs) {
      // Resolve page IDs from slugs
      const pageRecords = await context.query.Page.findMany({
        where: { slug: { in: chapterDef.pageSlugs } },
        query: 'id slug',
      })
      // Preserve slug order defined in seed data
      const orderedPages = chapterDef.pageSlugs
        .map((s) => pageRecords.find((p) => p.slug === s))
        .filter(Boolean)

      await context.query.Chapter.createOne({
        data: {
          title: chapterDef.title,
          sortOrder: chapterDef.sortOrder,
          course: { connect: { id: created.id } },
          pages: { connect: orderedPages.map((p) => ({ id: p!.id })) },
        },
      })
    }
    console.log(`  ✅ Course created with ${chapterDefs.length} chapters`)
  }

  // Wire the first seeded page index as rootPageIndex on Settings
  const [settingsRecord] = await context.query.Settings.findMany({
    query: 'id',
  })
  const [rootPageIndex] = await context.query.PageIndex.findMany({
    where: { slug: { equals: pageIndexes[0].slug } },
    query: 'id',
  })
  if (settingsRecord && rootPageIndex) {
    await context.query.Settings.updateOne({
      where: { id: settingsRecord.id },
      data: { rootPageIndex: { connect: { id: rootPageIndex.id } } },
    })
    console.log(
      `🔗 Settings.rootPageIndex connected to: ${pageIndexes[0].slug}`,
    )
  }

  console.log('\n')
  console.log(`✅ Seed data inserted...`)
  console.log(`👋 Please start the process with \`pnpm dev\`\n\n`)

  process.exit()
}

main()
