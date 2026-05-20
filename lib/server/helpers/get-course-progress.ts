'use server'

import { keystoneContext } from '@/server/keystone/context'
import type { CourseProgressStats, LessonProgressMap } from '@/types/course'

const prisma = keystoneContext.prisma

async function getLearnerProfileId(
  userId: string,
): Promise<string | undefined> {
  const lp = await prisma.learnerProfile.findFirst({
    where: { userId },
    select: { id: true },
  })
  return lp?.id ?? undefined
}

export async function upsertCourseEnrollment(
  userId: string,
  courseId: string,
): Promise<string> {
  const existing = await prisma.courseEnrollment.findFirst({
    where: { userId, courseId },
    select: { id: true, status: true },
  })

  if (!existing) {
    const learnerProfileId = await getLearnerProfileId(userId)
    const created = await prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        ...(learnerProfileId ? { learnerProfileId } : {}),
        status: 'enrolled',
        enrolledAt: new Date(),
      },
      select: { id: true },
    })
    return created.id
  }

  const updateData: Record<string, unknown> = { lastAccessedAt: new Date() }
  if (existing.status === 'enrolled') {
    updateData.status = 'in_progress'
  }
  await prisma.courseEnrollment.update({
    where: { id: existing.id },
    data: updateData,
  })
  return existing.id
}

export async function upsertLessonProgress(
  userId: string,
  courseId: string,
  pageId: string,
): Promise<{ id: string; viewCount: number }> {
  const existing = await prisma.courseLessonProgress.findFirst({
    where: { userId, pageId, courseId },
    select: { id: true, viewCount: true },
  })

  let id: string
  let viewCount: number

  if (!existing) {
    const learnerProfileId = await getLearnerProfileId(userId)
    const created = await prisma.courseLessonProgress.create({
      data: {
        userId,
        courseId,
        pageId,
        ...(learnerProfileId ? { learnerProfileId } : {}),
        viewCount: 1,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
      },
      select: { id: true, viewCount: true },
    })
    id = created.id
    viewCount = created.viewCount ?? 1
  } else {
    const updated = await prisma.courseLessonProgress.update({
      where: { id: existing.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      select: { id: true, viewCount: true },
    })
    id = updated.id
    viewCount = updated.viewCount ?? (existing.viewCount ?? 0) + 1
  }

  await prisma.courseEnrollment.updateMany({
    where: { userId, courseId },
    data: { lastAccessedAt: new Date(), status: 'in_progress' },
  })
  await prisma.learnerProfile.updateMany({
    where: { userId },
    data: { lastActiveAt: new Date() },
  })

  return { id, viewCount }
}

export async function toggleLessonComplete(
  userId: string,
  courseId: string,
  pageId: string,
  markComplete: boolean,
): Promise<{ completedAt: string | null }> {
  // Ensure enrollment exists even if the view tracker never fired (e.g. dev mode)
  await upsertCourseEnrollment(userId, courseId)

  let existing = await prisma.courseLessonProgress.findFirst({
    where: { userId, pageId, courseId },
    select: { id: true, completedAt: true },
  })

  if (!existing) {
    const learnerProfileId = await getLearnerProfileId(userId)
    existing = await prisma.courseLessonProgress.create({
      data: {
        userId,
        courseId,
        pageId,
        ...(learnerProfileId ? { learnerProfileId } : {}),
        viewCount: 0,
      },
      select: { id: true, completedAt: true },
    })
  }

  const wasAlreadyComplete = existing.completedAt !== null

  const updated = await prisma.courseLessonProgress.update({
    where: { id: existing.id },
    data: { completedAt: markComplete ? new Date() : null },
    select: { completedAt: true },
  })

  // Update LearnerProfile denormalized lesson counter
  if (markComplete && !wasAlreadyComplete) {
    await prisma.learnerProfile.updateMany({
      where: { userId },
      data: { totalLessonsCompleted: { increment: 1 } },
    })
  } else if (!markComplete && wasAlreadyComplete) {
    await prisma.learnerProfile.updateMany({
      where: { userId },
      data: { totalLessonsCompleted: { decrement: 1 } },
    })
  }

  // Reason: Page has no back-ref to Course in the schema, so we query via
  // the Keystone query layer to count unique pages in this course.
  const courseData = await keystoneContext.sudo().query.Course.findOne({
    where: { id: courseId },
    query: 'chapters { pages { id } } pages { id }',
  })
  const seenPageIds = new Set<string>()
  for (const ch of (courseData?.chapters ?? []) as Array<{
    pages: Array<{ id: string }>
  }>) {
    for (const p of ch.pages ?? []) {
      seenPageIds.add(p.id)
    }
  }
  for (const p of (courseData?.pages ?? []) as Array<{ id: string }>) {
    seenPageIds.add(p.id)
  }
  const totalPages = seenPageIds.size

  const completedCount = await prisma.courseLessonProgress.count({
    where: { userId, courseId, completedAt: { not: null } },
  })

  const isNowComplete = totalPages > 0 && completedCount >= totalPages
  const wasPreviouslyComplete = await prisma.courseEnrollment.findFirst({
    where: { userId, courseId, status: 'completed' },
    select: { id: true },
  })

  if (isNowComplete && !wasPreviouslyComplete) {
    await prisma.courseEnrollment.updateMany({
      where: { userId, courseId },
      data: { status: 'completed', completedAt: new Date() },
    })
    await prisma.learnerProfile.updateMany({
      where: { userId },
      data: { totalCoursesCompleted: { increment: 1 } },
    })
  } else if (!isNowComplete && wasPreviouslyComplete) {
    await prisma.courseEnrollment.updateMany({
      where: { userId, courseId },
      data: { status: 'in_progress', completedAt: null },
    })
    await prisma.learnerProfile.updateMany({
      where: { userId },
      data: { totalCoursesCompleted: { decrement: 1 } },
    })
  }

  return { completedAt: updated.completedAt?.toISOString() ?? null }
}

export async function getLessonProgressMap(
  userId: string,
  courseId: string,
): Promise<LessonProgressMap> {
  const progressRecords = await prisma.courseLessonProgress.findMany({
    where: { userId, courseId },
    select: {
      id: true,
      pageId: true,
      viewCount: true,
      firstViewedAt: true,
      lastViewedAt: true,
      completedAt: true,
    },
  })

  if (progressRecords.length === 0) return {}

  const pageIds = progressRecords
    .map((p) => p.pageId)
    .filter((id) => id !== null)
  const pages = await prisma.page.findMany({
    where: { id: { in: pageIds } },
    select: { id: true, slug: true },
  })

  const slugById = Object.fromEntries(pages.map((p) => [p.id, p.slug ?? '']))

  const map: LessonProgressMap = {}
  for (const record of progressRecords) {
    if (!record.pageId) continue
    const slug = slugById[record.pageId]
    if (!slug) continue
    map[slug] = {
      id: record.id,
      userId,
      courseId,
      pageId: record.pageId,
      viewCount: record.viewCount ?? 0,
      firstViewedAt: record.firstViewedAt?.toISOString() ?? null,
      lastViewedAt: record.lastViewedAt?.toISOString() ?? null,
      completedAt: record.completedAt?.toISOString() ?? null,
    }
  }

  return map
}

export async function getAllEnrollmentStats(
  userId: string,
): Promise<CourseProgressStats[]> {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId },
    select: {
      id: true,
      courseId: true,
      status: true,
      lastAccessedAt: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          chapters: {
            select: {
              pages: { select: { id: true, slug: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          pages: { select: { id: true, slug: true } },
        },
      },
    },
  })

  const stats: CourseProgressStats[] = []

  for (const enrollment of enrollments) {
    const course = enrollment.course
    if (!course) continue

    const seen = new Set<string>()
    const orderedPages: { id: string; slug: string }[] = []

    for (const chapter of course.chapters ?? []) {
      for (const page of chapter.pages ?? []) {
        if (!seen.has(page.id)) {
          seen.add(page.id)
          orderedPages.push({ id: page.id, slug: page.slug ?? '' })
        }
      }
    }
    for (const page of course.pages ?? []) {
      if (!seen.has(page.id)) {
        seen.add(page.id)
        orderedPages.push({ id: page.id, slug: page.slug ?? '' })
      }
    }

    const progressRecords = await prisma.courseLessonProgress.findMany({
      where: { userId, courseId: course.id },
      select: { pageId: true, viewCount: true, completedAt: true },
    })

    const progressByPageId = Object.fromEntries(
      progressRecords.map((p) => [p.pageId, p]),
    )

    const totalLessons = orderedPages.length
    const lessonsViewed = progressRecords.filter(
      (p) => (p.viewCount ?? 0) > 0,
    ).length
    const lessonsCompleted = progressRecords.filter(
      (p) => p.completedAt !== null,
    ).length
    const completionPercent =
      totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0

    const firstIncomplete = orderedPages.find(
      (p) => !progressByPageId[p.id]?.completedAt,
    )

    stats.push({
      courseId: course.id,
      courseTitle: course.title ?? '',
      courseSlug: course.slug ?? '',
      courseStatus: course.status ?? '',
      totalLessons,
      lessonsViewed,
      lessonsCompleted,
      completionPercent,
      lastAccessedAt: enrollment.lastAccessedAt?.toISOString() ?? null,
      enrollmentStatus:
        (enrollment.status as CourseProgressStats['enrollmentStatus']) ??
        'enrolled',
      continueLessonSlug: firstIncomplete?.slug ?? null,
    })
  }

  return stats
}
