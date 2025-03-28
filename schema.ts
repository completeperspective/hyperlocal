import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";
import { checkbox, password, relationship, select, text, timestamp } from "@keystone-6/core/fields";
import { document } from "@keystone-6/fields-document";
import { cloudinaryImage } from "@keystone-6/cloudinary";
import { cloudinaryConfig } from "./cloudinary";

import type { Lists } from ".keystone/types";

/* WARNING: This example allows read/write access to all schemas. */
export const lists = {
  Settings: list({
    access: allowAll,
    isSingleton: true,
    fields: {
      // Think SEO here
      title: text(),
      description: text(),
      copyrightText: text(),
      robots: text({
        defaultValue: "noindex, nofollow, noarchive, nosnippet",
        label: "Robots Meta Tag",
        ui: {
          description: "ex: noindex, nofollow, noarchive, nosnippet",
        },
      }),
      // Think social media here
      isPrivate: checkbox({
        label: "App is Private",
        defaultValue: true,
        ui: {
          description: "All content requires a membership to view",
        },
      }),
      homePage: relationship({
        ref: "Page",
        label: "Landing Page",
        ui: {
          description: "Page to display at the root url",
        },
      }),
      // Think branding here
      theme: relationship({ ref: "Theme" }),
    },
    graphql: {
      plural: "ManySettings",
    },
  }),
  Theme: list({
    access: allowAll,
    fields: {
      name: text(),
      colorPrimary: text(), // hex
      colorPrimaryDark: text(), // hex
      fontPrimary: text(), // font-family
      fontSecondary: text(), // font-family
    },
  }),
  User: list({
    access: allowAll,
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
      password: password({ validation: { isRequired: true } }),
      posts: relationship({ ref: "Post.author", many: true }),
      pages: relationship({ ref: "Page.author", many: true }),
      isAdmin: checkbox({ defaultValue: false }),
    },
  }),
  Page: list({
    access: allowAll,
    fields: {
      title: text({ isIndexed: "unique" }),
      slug: text({
        isIndexed: "unique",
        isFilterable: true,
        hooks: {
          resolveInput: ({ resolvedData }) => {
            if (resolvedData?.title) {
              return String(resolvedData?.title)
                ?.toLowerCase()
                .replace("'", "")
                .replace(/[^a-z0-9]+/g, "-");
            }
          },
        },
        ui: {
          // readonly
          //createView: { fieldMode: "hidden" },
          //itemView: { fieldMode: "read" },
        },
      }),
      description: text(),
      publishedAt: timestamp(),
      status: select({
        options: [
          { label: "Membership", value: "membership" },
          { label: "Published", value: "published" },
          { label: "Draft", value: "draft" },
        ],
        defaultValue: "draft",
        ui: { displayMode: "segmented-control" },
      }),
      author: relationship({
        ref: "User.pages",
        ui: {
          displayMode: "cards",
          cardFields: ["name", "email"],
          inlineEdit: { fields: ["name", "email"] },
          linkToItem: true,
          inlineCreate: { fields: ["name", "email"] },
          inlineConnect: true,
        },
      }),
      content: document({
        formatting: true,
        links: true,
        dividers: true,
        layouts: [
          [1, 1],
          [1, 1, 1],
          [2, 1],
          [1, 2],
          [1, 2, 1],
        ],
      }),
      posts: relationship({ ref: "Post", many: true }),
    },
  }),
  Post: list({
    access: allowAll,
    fields: {
      title: text(),
      description: text(),
      publishedAt: timestamp(),
      status: select({
        options: [
          { label: "Membership", value: "membership" },
          { label: "Published", value: "published" },
          { label: "Draft", value: "draft" },
        ],
        defaultValue: "draft",
        ui: { displayMode: "segmented-control" },
      }),
      author: relationship({
        ref: "User.posts",
        ui: {
          displayMode: "cards",
          cardFields: ["name", "email"],
          inlineEdit: { fields: ["name", "email"] },
          linkToItem: true,
          inlineCreate: { fields: ["name", "email"] },
          inlineConnect: true,
        },
      }),
      content: document({
        formatting: true,
        links: true,
        dividers: true,
        layouts: [
          [1, 1],
          [1, 1, 1],
          [2, 1],
          [1, 2],
          [1, 2, 1],
        ],
      }),
      images: relationship({ ref: "PostImage.posts", many: true }),
    },
  }),
  PostImage: list({
    access: allowAll,
    fields: {
      title: text(),
      description: text({
        ui: {
          displayMode: "textarea",
        },
      }),
      image: cloudinaryImage({
        cloudinary: cloudinaryConfig,
        label: "Source",
      }),
      altText: text(),
      posts: relationship({ ref: "Post.images", many: true }),
    },
  }),
} satisfies Lists;
