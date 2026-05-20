import { getContext } from '@keystone-6/core/context'
import { BaseKeystoneTypeInfo, KeystoneContext } from '@keystone-6/core/types'
import * as PrismaModule from '@prisma/client'
import config from '../keystone'
import { courseChaptersBySlug, courses } from './courses'
import { lessonPages } from './lesson-pages'

type PageData = (typeof lessonPages)[number]
type CourseData = (typeof courses)[number]

async function upsertPages(
  context: KeystoneContext<BaseKeystoneTypeInfo>,
  pages: PageData[],
) {
  for (const data of pages) {
    const existing = await context.query.Page.findMany({
      where: { slug: { equals: data.slug } },
      query: 'id',
    })
    if (existing.length > 0) {
      console.log(`  ⏭️  Page exists, skipping: ${data.slug}`)
      continue
    }
    await context.query.Page.createOne({ data })
    console.log(`  ✅ Created page: ${data.slug}`)
  }
}

async function upsertCourse(
  context: KeystoneContext<BaseKeystoneTypeInfo>,
  courseData: CourseData,
) {
  const existing = await context.query.Course.findMany({
    where: { slug: { equals: courseData.slug } },
    query: 'id',
  })

  let courseId: string
  if (existing.length > 0) {
    courseId = existing[0].id
    console.log(`  ⏭️  Course exists, skipping create: ${courseData.slug}`)
  } else {
    const created = await context.query.Course.createOne({ data: courseData })
    courseId = created.id
    console.log(`  ✅ Created course: ${courseData.slug}`)
  }

  const chapterDefs = courseChaptersBySlug[courseData.slug] ?? []
  for (const chapterDef of chapterDefs) {
    const existingChapter = await context.query.Chapter.findMany({
      where: {
        title: { equals: chapterDef.title },
        course: { id: { equals: courseId } },
      },
      query: 'id',
    })
    if (existingChapter.length > 0) {
      console.log(`    ⏭️  Chapter exists, skipping: ${chapterDef.title}`)
      continue
    }

    const pageRecords = await context.query.Page.findMany({
      where: { slug: { in: chapterDef.pageSlugs } },
      query: 'id slug',
    })
    const orderedPages = chapterDef.pageSlugs
      .map((s) => pageRecords.find((p) => p.slug === s))
      .filter(Boolean)

    await context.query.Chapter.createOne({
      data: {
        title: chapterDef.title,
        sortOrder: chapterDef.sortOrder,
        course: { connect: { id: courseId } },
        pages: { connect: orderedPages.map((p) => ({ id: p!.id })) },
      },
    })
    console.log(`    ✅ Created chapter: ${chapterDef.title}`)
  }
}

async function main() {
  const context: KeystoneContext<BaseKeystoneTypeInfo> = getContext(
    config,
    PrismaModule,
  )

  console.log('📚 Running course upsert seed (no deletions)...\n')

  console.log('📄 Upserting pages...')
  await upsertPages(context, lessonPages)

  for (const courseData of courses) {
    console.log(`\n📚 Processing course: ${courseData.title}`)
    await upsertCourse(context, courseData)
  }

  console.log('\n✅ Course seed complete.')
  process.exit()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
