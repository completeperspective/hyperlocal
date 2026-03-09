import { getContext } from '@keystone-6/core/context'
import { KeystoneContext } from '@keystone-6/core/types'
import * as PrismaModule from '@prisma/client'
import config from '../keystone'
import { settings, users } from './data'
import type { TypeInfo } from '.keystone/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteLists(lists: string[], context: KeystoneContext<any>) {
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

export async function main() {
  const context: KeystoneContext<TypeInfo> = getContext(config, PrismaModule)

  console.log('🚨 Resetting database...')

  // DESTROY the following lists
  const lists = ['User', 'Settings', 'Theme', 'Page']

  await deleteLists(lists, context)

  console.log(`🌱 Inserting seed data...`)

  // Seed user data
  for (const user of users) {
    await context.query.User.createOne({
      data: user,
    })
  }

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
