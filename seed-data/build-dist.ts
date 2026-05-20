#!/usr/bin/env tsx
/**
 * Builds static HTML artifacts for live content updates.
 *
 * Usage:
 *   pnpm course:dist
 *
 * Output: dist/course/[course-slug]/
 *   index.css              — course-level CSS (paste into CMS once per course)
 *   index.html             — full HTML5 preview for local reference
 *   [lesson-slug].html     — <article> fragment for CMS copy-paste
 */
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { courseChaptersBySlug, courses } from './courses'
import { lessonPages } from './lesson-pages'

const DIST_ROOT = join(process.cwd(), 'dist', 'course')

const pageBySlug = Object.fromEntries(
  lessonPages.map((page) => [page.slug, page]),
)

for (const course of courses) {
  const courseDir = join(DIST_ROOT, course.slug)
  mkdirSync(courseDir, { recursive: true })

  const allSlugs = (courseChaptersBySlug[course.slug] ?? []).flatMap(
    (ch) => ch.pageSlugs,
  )

  console.log(`\n📚 Building dist for: ${course.title}`)

  // --- per-lesson fragment files: <article> only, colocated in course dir ---
  for (const slug of allSlugs) {
    const page = pageBySlug[slug]
    if (!page?.trustedHtml) {
      console.warn(`  ⚠️  No trustedHtml for lesson: ${slug}`)
      continue
    }
    writeFileSync(join(courseDir, `${slug}.html`), page.trustedHtml, 'utf-8')
    console.log(`  ✅ ${slug}.html`)
  }

  // --- index.html: full HTML5 preview for local reference ---
  const allLessonsHtml = allSlugs
    .map((slug) => pageBySlug[slug]?.trustedHtml ?? '')
    .filter(Boolean)
    .join(
      '\n\n<hr style="border:none;border-top:3px solid #ccc;margin:4rem 0">\n\n',
    )

  writeFileSync(
    join(courseDir, 'index.html'),
    buildFullPage(course.title, allLessonsHtml),
    'utf-8',
  )
  console.log('  ✅ index.html (preview)')
}

console.log('\n✅ Course dist build complete.')
console.log('   Output: dist/course/')

function buildFullPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="index.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 2rem;
      background: #fff;
      color: #1a1a1a;
      line-height: 1.7;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`
}
