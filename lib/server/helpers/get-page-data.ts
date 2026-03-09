'use server'

import { notFound } from 'next/navigation'
import { keystoneContext } from '@/server/keystone/context'
import { PageData } from '@/types'
import { getSession } from '../auth'

export async function getPageData(slug: string) {
  // determine statuses to exclude
  let notIn = ['draft', 'private']
  const session = await getSession()
  if (session?.data && session.data.isAdmin) {
    // admins can see all except drafts
    notIn = ['draft']
  }

  try {
    const req = await keystoneContext.sudo().query.Page.findMany({
      where: {
        AND: [{ slug: { equals: slug } }, { status: { notIn: notIn } }],
      },
      query: `
        title
        description
        slug
        status
        publishedAt
        content {
          document
        }
        trustedHtml
      `,
    })

    let page = null

    if (req.length === 0) {
      return notFound()
    }
    page = JSON.parse(JSON.stringify(req[0]))

    return (page as PageData) || null
  } catch (e) {
    console.error(e)
    notFound()
  }
}
