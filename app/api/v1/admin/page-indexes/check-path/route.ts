// GET /api/v1/admin/page-indexes/check-path?basePath=docs%2Fv2&slug=guide&excludeId=optional
//
// Used by the admin form URL preview bar for live collision/reservation checking.
// The client debounces calls by 400 ms; reserved-prefix errors are also caught
// client-side synchronously so they never reach this endpoint in normal flow.

import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/server/api'
import { keystoneContext } from '@/server/keystone/context'
import type { PageIndexWhereInput } from '.keystone/types'

const RESERVED_BASEPATH_PREFIXES = [
  'api',
  'courses',
  'admin',
  'dashboard',
  'profile',
  'settings',
  'onboarding',
  'login',
  'logout',
  'signup',
  'get-access',
  '_next',
  'static',
]

async function checkPathHandler(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const basePath = (searchParams.get('basePath') ?? '').trim()
  const slug = (searchParams.get('slug') ?? '').trim()
  const excludeId = searchParams.get('excludeId') ?? ''

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: 'slug is required' },
      { status: 400 },
    )
  }

  // Reason: check reserved prefix first — a reserved hit means no DB query needed.
  const firstSegment = (basePath || slug).split('/')[0].toLowerCase()
  if (RESERVED_BASEPATH_PREFIXES.includes(firstSegment)) {
    return NextResponse.json({
      ok: false,
      type: 'reserved',
      error: `"${firstSegment}" is a reserved path prefix.`,
    })
  }

  const where: PageIndexWhereInput = {
    slug: { equals: slug },
    basePath: { equals: basePath },
    // Reason: in edit mode, exclude the current record so a no-op save
    // (same slug + basePath) doesn't falsely report a collision.
    ...(excludeId ? { id: { not: { equals: excludeId } } } : {}),
  }

  const conflicts = await keystoneContext
    .sudo()
    .db.PageIndex.findMany({ where })

  if (conflicts.length > 0) {
    return NextResponse.json({
      ok: false,
      type: 'collision',
      error: `A page index already exists at "${basePath ? basePath + '/' : ''}${slug}".`,
    })
  }

  return NextResponse.json({ ok: true })
}

export const GET = apiHandler(checkPathHandler)
