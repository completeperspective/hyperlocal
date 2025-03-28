import * as React from "react";
import { DocumentRenderer, DocumentRendererProps } from "@keystone-6/document-renderer";
import type { PageData } from "@/app/types";
import { Post } from "@/app/client/components/Post";

export function AppPage({ pageData }: { pageData: PageData }) {
  const renderers: DocumentRendererProps["renderers"] = {
    // Render heading blocks
    block: {
      heading({ level, children, textAlign }) {
        const Comp = `h${level}` as const;
        return (
          <Comp style={{ textAlign }} className="mb-4">
            {children}
          </Comp>
        );
      },
      blockquote(props) {
        return <blockquote className="text-primary dark:text-primary-dark mb-4" {...props} />;
      },
      paragraph(props) {
        return <p className="mb-4" {...props} />;
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
      <main className="gap-y-1 row-start-2 col-span-full md:col-start-2 md:col-span-1 pb-10">
        <section className="grid gap-4 grid-cols-4 md:grid-cols-8 lg:grid-cols-12">
          <div className="flex flex-col p-4 pt-8 pb-0 lg:p-16 lb:pb-0 gap-1 items-start col-span-4 md:col-start-2 lg:col-start-3 xl:col-start-4 lg:col-span-6">
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
                  image={post?.images[0]?.image?.publicUrl}
                  altText={post?.images[0]?.altText}
                />
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
