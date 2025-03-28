"use server";

import { notFound, redirect } from "next/navigation";
import { keystoneContext } from "@/app/server/keystone";
import { auth } from "@/app/server/auth";
import { PageData } from "@/app/types";

export async function getPage(slug: string) {
  const isAuthenticated = await auth.isAuthenticated();

  const qStatus = isAuthenticated ? `{ status: { not: { equals: "draft" } } }` : `{ status: { equals: "published" } }`;

  try {
    const req = await keystoneContext.query.Page.findMany({
      where: { AND: [{ slug: { equals: slug } }, { status: { not: { equals: "draft" } } }] },
      query: `
        title
        description
        slug
        status
        publishedAt
        author {
          name
        }
        content {
          document
        }
        posts(where: ${qStatus}) {
          title
          description
          author {
            name
          }
          publishedAt
          images {
            image {
              publicUrl
            }
            altText
          }
        }
      `,
    });

    const page = JSON.parse(JSON.stringify(req[0]));

    if (!page) {
      return notFound();
    }

    return page as PageData;
  } catch (e) {
    console.error(e);
    notFound();
  }
}
