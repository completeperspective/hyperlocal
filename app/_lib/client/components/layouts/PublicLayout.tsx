"use client";
import * as React from "react";
import { css, Global } from "@emotion/react";
import type { AppSettings, PageData } from "@/app/types";
import { redirect } from "next/navigation";
import { getPage } from "@/app/_lib/server/actions/getPage";
import { DocumentRenderer, DocumentRendererProps } from "@keystone-6/document-renderer";
import { Post } from "../Post";

export function PublicLayout({
  children,
  settings,
  pageData,
}: {
  children: React.ReactNode;
  settings: AppSettings;
  pageData: PageData;
}) {
  if (settings.isPrivate) return children;

  const renderers: DocumentRendererProps["renderers"] = {
    // Render heading blocks
    block: {
      heading({ level, children, textAlign }) {
        const Comp = `h${level}` as const;
        return <Comp style={{ textAlign }}>{children}</Comp>;
      },
      blockquote(props) {
        return <blockquote className="text-primary dark:text-primary-dark mb-4" {...props} />;
      },
    },

    // Render inline relationships
    inline: {
      relationship({ relationship, data }) {
        // If there is more than one inline relationship defined on the document
        // field we need to handle each of them separately by checking the `relationship` argument.
        // It is good practice to include this check even if you only have a single inline relationship.
        if (relationship === "mention") {
          if (data === null || data.data === undefined) {
            // data can be null if the content writer inserted a mention but didn't select an author to mention.
            // data.data can be undefined if the logged in user does not have permission to read the linked item
            // or if the linked item no longer exists.
            return <span>[unknown author]</span>;
          } else {
            // If the data exists then we render the mention as a link to the author's bio.
            // We have access to `id` an `name` fields here because we named them in the
            // `selection` config argument.
            return <p>{data.data.name}</p>;
          }
        }
        return null;
      },
    },
  };

  const publishedDate = pageData?.publishedAt
    ? new Date(pageData.publishedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <>
      <main
        suppressHydrationWarning={true}
        className="gap-y-1 row-start-2 col-span-full md:col-start-2 md:col-span-1 pb-10"
      >
        <section className="grid gap-4 grid-cols-4 md:grid-cols-8 lg:grid-cols-12">
          <div className="flex flex-col p-4 lg:p-16 gap-1 items-start col-span-4 md:col-start-2 lg:col-start-3 xl:col-start-4 lg:col-span-6">
            <header className="my-4 lg:mb-6">
              <h1>{pageData?.title}</h1>

              {/* {pageData?.publishedAt && (
                <span className="text-gray-600 text-xs font-mono">
                  published <time dateTime={publishedDate}>{publishedDate}</time>
                </span>
              )} */}
            </header>
            {pageData?.description && (
              <section className="mb-4 lg:mb-6">
                <p>{pageData.description}</p>
              </section>
            )}
            {pageData.content?.document && (
              <section className="mb-4 lg:mb-6">
                <DocumentRenderer document={pageData.content.document} renderers={renderers} />
              </section>
            )}
          </div>
          <div className="flex flex-col gap-1 items-center col-span-4 md:col-start-3 lg:col-start-4 lg:col-span-6">
            {pageData.posts.map((post, index) => {
              const published = post?.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString()
                : new Date().toLocaleDateString();
              return (
                <Post
                  key={`post-${index}`}
                  title={post.title}
                  description={post.description}
                  author={post.author.name}
                  publishedAt={published}
                />
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
