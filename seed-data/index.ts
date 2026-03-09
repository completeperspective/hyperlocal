import { getContext } from '@keystone-6/core/context'
import { BaseKeystoneTypeInfo, KeystoneContext } from '@keystone-6/core/types'
import * as PrismaModule from '@prisma/client'
import { deleteFile, prepareFile } from '../cloudinary'
import config from '../keystone'
import { profiles, settings } from './data'

async function deleteLists(
  lists: string[],
  context: KeystoneContext<BaseKeystoneTypeInfo>,
) {
  for (let i = 0; i < lists.length; i++) {
    const existingItems = await context.db[lists[i]].findMany()
    for (const deleteItem of existingItems) {
      try {
        await context.db[lists[i]].deleteOne({
          where: { id: `${deleteItem.id}` },
        })
        console.log(`🗑️  Deleted ${lists[i]} ${deleteItem.id}`)
      } catch {
        console.log(`🚨 Error deleting ${lists[i]} ${deleteItem.id}`)
      }
    }
  }
}

async function seedProfiles(context: KeystoneContext<BaseKeystoneTypeInfo>) {
  for (const profile of profiles) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { image: profileImage, ...data } = profile
    try {
      console.log('🪪 Adding User Profile...')
      const { id: newProfileId } = await context
        .sudo()
        .query.Profile.createOne({
          data,
        })

      const newProfileImage = profile.image

      console.log(`📸  Adding profile image ${newProfileImage.altText}...`)
      const image = await prepareFile(newProfileImage.source)

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
          title: newProfileImage.title,
          image,
          altText: newProfileImage.altText,
          profileId: newProfileId,
        },
      })
    } catch (e) {
      console.log(e)
    }
  }
}

function getPublicId(publicUrl: string): string {
  // e.g. https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
  // → folder/image.jpg
  const match = publicUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
  return match ? match[1] : ''
}

async function deleteProfiles(context: KeystoneContext<BaseKeystoneTypeInfo>) {
  // DESTROY all Profile Images
  const existingProfileImages = await context
    .sudo()
    .query.ProfileImage.findMany({
      query: 'id title altText source { id publicUrl }',
    })

  for (const deleteImage of existingProfileImages) {
    console.log(`🗑️  Deleting profile image ${deleteImage.altText}...`)

    // remove file from cloud
    try {
      await deleteFile(getPublicId(deleteImage?.source?.publicUrl || ''))
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
    console.log(`🗑️  Deleting profile ${deleteProfile.title}...`)
    await context.db.Profile.deleteOne({
      where: { id: `${deleteProfile.id}` },
    })
  }
}

export async function main() {
  const context: KeystoneContext<BaseKeystoneTypeInfo> = getContext(
    config,
    PrismaModule,
  )

  console.log('🚨 Resetting database...')

  // DESTROY the following lists
  const lists = ['User', 'Settings', 'Theme', 'Page']

  await deleteLists(lists, context)
  await deleteProfiles(context)

  console.log(`🌱 Inserting seed data...`)

  // Seed user and profile data
  await seedProfiles(context)

  // Settings is a singleton list, and should be the last
  for (const data of settings) {
    await context.query.Settings.createOne({ data })
  }

  console.log('\n')
  console.log(`✅ Seed data inserted...`)
  console.log(`👋 Please start the process with \`pnpm dev\`\n\n`)
  process.exit()
}

main()
