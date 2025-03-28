import { getContext } from "@keystone-6/core/context";
import { KeystoneContext } from "@keystone-6/core/types";
import * as PrismaModule from "@prisma/client";
import config from "@/keystone";
import type { TypeInfo } from ".keystone/types";
import { settings, pages, posts } from "./data";
import { prepareFile, deleteFile } from "@/cloudinary";
import { description } from "graphql-upload/GraphQLUpload.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deleteLists(lists: string[], context: KeystoneContext<any>) {
  for (let i = 0; i < lists.length; i++) {
    const existingItems = await context.sudo().db[lists[i]].findMany();
    for (const deleteItem of existingItems) {
      try {
        await context.sudo().db[lists[i]].deleteOne({
          where: { id: `${deleteItem.id}` },
        });
        console.log(`🗑️  Deleted ${lists[i]} ${deleteItem.id}`);
      } catch {
        console.log(`🚨 Error deleting ${lists[i]} ${deleteItem.id}`);
      }
    }
  }
}

async function seedPosts(context: KeystoneContext<TypeInfo>) {
  // const { cloudinary } = context;
  // const { cloudinaryConfig, prepareFile } = cloudinary;
  // const { cloudName, apiKey, apiSecret, folder } = cloudinaryConfig;
  for (const post of posts) {
    const { images, ...data } = post;
    try {
      console.log(`📸  Adding Post ${post.title}...`);
      const { id: newPostId } = await context.query.Post.createOne({
        // @ts-ignore - data.content is correct type
        data,
      });
      for (let i = 0; i < post.images.length; i++) {
        const newPostImage = post.images[i];
        console.log(`🌇  Adding post image ${newPostImage.altText}...`);
        const image = prepareFile(newPostImage.image);

        await context.graphql.run({
          query: `
            mutation($image: Upload!, $altText: String!, $postId: ID!, $title: String, $description: String) {
              createPostImage(data: {
                image: $image,
                altText: $altText,
                posts: { connect: { id: $postId } },
                title: $title,
                description: $description
              }) {
                id
              }
            }
          `,
          variables: {
            title: newPostImage.title,
            description: newPostImage.description,
            image: image,
            altText: newPostImage.altText,
            postId: newPostId,
          },
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}

async function deletePosts(context: KeystoneContext<TypeInfo>) {
  // DESTROY all Posts and PhotoGalleries
  const existingPostImages = await context.db.PostImage.findMany();
  for (const deleteImage of existingPostImages) {
    console.log(`🗑️  Deleting PostImage ${deleteImage.altText}...`);
    // remove physical file from the cloud
    try {
      await deleteFile(deleteImage.image as unknown as File);
      console.log("\tremoved from cloud");
    } catch (e) {
      console.error(e);
    }

    try {
      await context.db.PostImage.deleteOne({
        where: { id: `${deleteImage.id}` },
      });
      console.log("\tremoved from database");
    } catch (e) {
      console.error(e);
    }
  }
  const existingPosts = await context.db.Post.findMany();
  for (const deletePost of existingPosts) {
    console.log(`🗑️  Deleting photo gallery ${deletePost.title}...`);
    await context.db.Post.deleteOne({
      where: { id: `${deletePost.id}` },
    });
  }
}

export async function main() {
  const context: KeystoneContext<TypeInfo> = getContext(config, PrismaModule);

  console.log("🚨 Resetting database");

  // DESTROY all existing lists
  const lists = ["Theme", "Settings", "Page"];

  await deleteLists(lists, context);
  await deletePosts(context);

  console.log(`🌱 Inserting seed data`);

  // Settings is a singleton list - must be created first
  for (const data of settings) {
    await context.sudo().query.Settings.createOne({
      // @ts-ignore - content is correct type
      data,
    });
  }

  // CREATE posts
  await seedPosts(context);

  const postList = await context.query.Post.findMany();

  // CREATE app data
  let count = 0;
  for (const page of pages) {
    console.log(`📄 Adding Page ${page.title}...`);
    // Randomly assign a post to a page
    const randomPost = postList[count];

    await context.sudo().query.Page.createOne({
      // @ts-ignore - data.content is correct type
      data: {
        ...page,
        posts: {
          connect: {
            id: randomPost.id,
          },
        },
      },
    });

    count++;
  }

  console.log("\n");
  console.log(`✅ App seeded with demo data...`);
  console.log(`👋 Please start the process with \`pnpm dev\`\n\n`);
  process.exit();
}

main();
