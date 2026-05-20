/*
  Warnings:

  - You are about to drop the column `ogImage_extension` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ogImage_filesize` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ogImage_height` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ogImage_id` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ogImage_width` on the `Settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[walletAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "ogImage_extension",
DROP COLUMN "ogImage_filesize",
DROP COLUMN "ogImage_height",
DROP COLUMN "ogImage_id",
DROP COLUMN "ogImage_width",
ADD COLUMN     "allowWeb3Auth" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "web3SignInMessage" TEXT NOT NULL DEFAULT 'Sign in with your wallet';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "walletAddress" TEXT;

-- CreateTable
CREATE TABLE "OGImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "source" JSONB,
    "altText" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "OGImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Settings_ogImage_idx" ON "Settings"("ogImage");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_ogImage_fkey" FOREIGN KEY ("ogImage") REFERENCES "OGImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
