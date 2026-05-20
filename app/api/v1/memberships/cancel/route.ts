import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/server/auth'
import { keystoneContext } from '@/server/keystone/context'
import { expireMembership } from '@/server/payments/membership'

const prisma = () => keystoneContext.prisma

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session?.data) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as { membershipId?: string }
  const { membershipId } = body

  if (!membershipId) {
    return NextResponse.json(
      { message: 'membershipId is required' },
      { status: 400 },
    )
  }

  const membership = await prisma().userMembership.findFirst({
    where: { id: membershipId, userId: session.data.id },
    select: { id: true, status: true },
  })

  if (!membership) {
    return NextResponse.json(
      { message: 'Membership not found' },
      { status: 404 },
    )
  }

  if (membership.status !== 'active') {
    return NextResponse.json(
      { message: 'Only active memberships can be cancelled' },
      { status: 409 },
    )
  }

  await expireMembership(membership.id)

  return NextResponse.json({ success: true })
}
