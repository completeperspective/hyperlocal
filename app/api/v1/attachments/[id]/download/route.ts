import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/server/auth'
import { generateSignedUrl } from '@/server/helpers'
import { keystoneContext } from '@/server/keystone/context'
import { getActiveMemberships } from '@/server/payments/membership'
import { matchesPatterns } from '@/utils/content-access'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.data) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { query } = keystoneContext.sudo()
  const attachment = await query.PageAttachment.findOne({
    where: { id },
    query: 'id publicId filename mimeType page { slug status }',
  })

  if (!attachment?.publicId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Reason: only gate the download when the parent page is explicitly membership-only.
  // Public, draft, and private pages are not affected so existing behaviour is preserved.
  const parentPage = attachment.page as
    | { slug: string; status: string }
    | null
    | undefined

  if (parentPage?.status === 'membership') {
    // Admins bypass all membership gates.
    if (!session.data.isAdmin) {
      const activeMemberships = await getActiveMemberships(session.data.id)

      // Reason: matchesPatterns([], path) returns true (empty = no restriction), which
      // is correct for tier-level semantics but would let membership-less users through.
      if (activeMemberships.length === 0) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Reason: merge all pattern lists across every active membership tier so a
      // user with multiple memberships (e.g. upgrade mid-cycle) always gets the
      // broadest access their tiers allow.
      const mergedPatterns = activeMemberships.flatMap(
        (m) => m.tier?.contentAccessPatterns ?? [],
      )

      // Reason: page slugs are stored without a leading slash in the DB — prepend
      // one so micromatch patterns like /courses/** match correctly.
      const pagePath = '/' + parentPage.slug

      if (!matchesPatterns(mergedPatterns, pagePath)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // Reason: all assets are uploaded as type:'private' — their secure_url is stored
  // in publicUrl but is not directly fetchable. Always generate a time-limited
  // signed URL server-side; it is never exposed to the browser.
  const fetchUrl = generateSignedUrl(attachment.publicId)

  const upstream = await fetch(fetchUrl)
  if (!upstream.ok) {
    return NextResponse.json({ error: 'File unavailable' }, { status: 502 })
  }

  const contentType =
    upstream.headers.get('content-type') ??
    attachment.mimeType ??
    'application/octet-stream'
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
      'Content-Length': String(body.byteLength),
    },
  })
}
