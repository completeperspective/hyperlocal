import { NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { getSession } from '@/server/auth'
import { getAllEnrollmentStats } from '@/server/helpers/get-course-progress'

async function getCourseProgressHandler() {
  const { data: sessionData } = await getSession()
  if (!sessionData?.id) return NextResponse.json({ courses: [] })
  const courses = await getAllEnrollmentStats(sessionData.id)
  return NextResponse.json({ courses })
}

export const GET = apiHandler(getCourseProgressHandler)
