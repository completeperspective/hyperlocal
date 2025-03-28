/*
  Warnings:

  - You are about to drop the column `altText` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "altText",
DROP COLUMN "image";

-- CreateTable
CREATE TABLE "PostImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "image" JSONB,
    "altText" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Post_images" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Post_images_AB_unique" ON "_Post_images"("A", "B");

-- CreateIndex
CREATE INDEX "_Post_images_B_index" ON "_Post_images"("B");

-- AddForeignKey
ALTER TABLE "_Post_images" ADD CONSTRAINT "_Post_images_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Post_images" ADD CONSTRAINT "_Post_images_B_fkey" FOREIGN KEY ("B") REFERENCES "PostImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
