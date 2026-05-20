/**
 * One-time migration script: copies heroEnabled from linked Hero records into
 * the parent Course, Page, and PageIndex entities.
 *
 * Background: heroEnabled previously lived on the Hero entity. In the reusable-hero
 * refactor it moves to the parent so that a single Hero can be shared across multiple
 * parents without each parent toggling the same Hero.
 *
 * Run AFTER applying the DB migration that adds heroEnabled to Course/Page/PageIndex:
 *   npx tsx scripts/migrate-hero-enabled.ts
 */
import { keystoneContext } from '../lib/server/keystone/context'

const ENTITY_TYPES = ['Course', 'Page', 'PageIndex'] as const

async function migrate() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = keystoneContext.sudo() as any

  for (const entity of ENTITY_TYPES) {
    console.log(`\nMigrating heroEnabled for ${entity} records...`)

    // Find all records that have a linked hero
    const records = await ctx.db[entity].findMany({
      where: { hero: { id: { not: null } } },
    })

    console.log(
      `  Found ${records.length} ${entity} records with a linked hero`,
    )

    for (const record of records) {
      try {
        // Fetch the linked hero to read its heroEnabled value
        const hero = await ctx.db.Hero.findOne({
          where: { id: record.heroId as string },
        })

        if (!hero) {
          console.log(
            `  Skipping ${entity} ${record.id} — hero ${record.heroId} not found`,
          )
          continue
        }

        // Copy heroEnabled from Hero → parent entity
        await ctx.db[entity].updateOne({
          where: { id: record.id },
          data: { heroEnabled: hero.heroEnabled ?? false },
        })

        console.log(
          `  ${entity} ${record.id}: heroEnabled = ${hero.heroEnabled ?? false}`,
        )
      } catch (err) {
        console.error(
          `  ERROR migrating ${entity} ${record.id}:`,
          err instanceof Error ? err.message : err,
        )
      }
    }
  }

  console.log('\nMigration complete.')
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
