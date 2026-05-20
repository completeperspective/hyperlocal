/**
 * One-time migration script: copies flat hero fields from Course, Page, and PageIndex
 * records into linked Hero entities.
 *
 * Run AFTER the add_hero_entity DB migration and BEFORE removing flat fields:
 *   npx tsx scripts/migrate-hero-fields.ts
 */
import { keystoneContext } from '../lib/server/keystone/context'

const ENTITY_TYPES = ['Course', 'Page', 'PageIndex'] as const

async function migrate() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = keystoneContext.sudo() as any

  for (const entity of ENTITY_TYPES) {
    console.log(`\nMigrating ${entity} hero fields...`)

    const records = await ctx.db[entity].findMany({
      where: { hero: null },
    })

    console.log(`  Found ${records.length} unlinked ${entity} records`)

    for (const record of records) {
      // Only create a Hero record if the entity had meaningful hero data
      const hasData =
        record.heroEnabled ||
        record.heroTitle ||
        record.heroImage ||
        record.heroEyebrow

      if (!hasData) {
        console.log(`  Skipping ${entity} ${record.id} — no hero data`)
        continue
      }

      const hero = await ctx.db.Hero.createOne({
        data: {
          heroEnabled: record.heroEnabled ?? false,
          heroEyebrow: record.heroEyebrow ?? '',
          heroTitle: record.heroTitle ?? '',
          heroTitleHighlight: record.heroTitleHighlight ?? '',
          heroDescription: record.heroDescription ?? '',
          heroCtaLabel: record.heroCtaLabel ?? '',
          heroCtaHref: record.heroCtaHref ?? '',
          heroSecondaryLabel: record.heroSecondaryLabel ?? '',
          heroSecondaryHref: record.heroSecondaryHref ?? '',
          heroStat1Value: record.heroStat1Value ?? '',
          heroStat1Label: record.heroStat1Label ?? '',
          heroStat2Value: record.heroStat2Value ?? '',
          heroStat2Label: record.heroStat2Label ?? '',
          heroStat3Value: record.heroStat3Value ?? '',
          heroStat3Label: record.heroStat3Label ?? '',
          heroImage: record.heroImage ?? '',
          heroImageBadgeTitle: record.heroImageBadgeTitle ?? '',
          heroImageBadgeSubtitle: record.heroImageBadgeSubtitle ?? '',
          // Background image fields are new — no flat field to migrate from
          heroBackgroundImage: '',
          heroBackgroundImageMobile: '',
        },
      })

      await ctx.db[entity].updateOne({
        where: { id: record.id },
        data: { hero: { connect: { id: hero.id } } },
      })

      console.log(`  Migrated ${entity} ${record.id} → Hero ${hero.id}`)
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
