#!/usr/bin/env tsx
/**
 * Updates trustedHtml for all lesson pages in the target database.
 * Reads from seed-data/lessons/*.md via the markdown transformer.
 *
 * Usage:
 *   pnpm course:publish                          # updates local dev DB
 *   DATABASE_URL=<prod_url> pnpm course:publish  # updates live environment
 */
import { getContext } from '@keystone-6/core/context'
import * as PrismaModule from '@prisma/client'
import config from '../keystone'
import { lessonPages } from './lesson-pages'

async function main() {
  const context = getContext(config, PrismaModule)

  console.log('📝 Publishing course lesson content...\n')

  for (const page of lessonPages) {
    const existing = await context.query.Page.findMany({
      where: { slug: { equals: page.slug } },
      query: 'id',
    })

    if (existing.length === 0) {
      console.warn(`  ⚠️  Page not found, skipping: ${page.slug}`)
      continue
    }

    await context.query.Page.updateOne({
      where: { id: existing[0].id },
      data: { trustedHtml: page.trustedHtml },
    })
    console.log(`  ✅ Updated: ${page.slug}`)
  }

  console.log('\n✅ Publish complete.')
  process.exit()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
