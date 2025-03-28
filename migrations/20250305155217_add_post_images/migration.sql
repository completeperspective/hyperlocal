-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "altText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "image" JSONB;

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "copyrightText" TEXT NOT NULL DEFAULT '',
    "robots" TEXT NOT NULL DEFAULT 'noindex, nofollow, noarchive, nosnippet',
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "homePage" TEXT,
    "theme" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "colorPrimary" TEXT NOT NULL DEFAULT '',
    "colorPrimaryDark" TEXT NOT NULL DEFAULT '',
    "fontPrimary" TEXT NOT NULL DEFAULT '',
    "fontSecondary" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "author" TEXT,
    "content" JSONB NOT NULL DEFAULT '[{"type":"paragraph","children":[{"text":""}]}]',

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Page_posts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Settings_homePage_idx" ON "Settings"("homePage");

-- CreateIndex
CREATE INDEX "Settings_theme_idx" ON "Settings"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "Page_title_key" ON "Page"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_author_idx" ON "Page"("author");

-- CreateIndex
CREATE UNIQUE INDEX "_Page_posts_AB_unique" ON "_Page_posts"("A", "B");

-- CreateIndex
CREATE INDEX "_Page_posts_B_index" ON "_Page_posts"("B");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_homePage_fkey" FOREIGN KEY ("homePage") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_theme_fkey" FOREIGN KEY ("theme") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_author_fkey" FOREIGN KEY ("author") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Page_posts" ADD CONSTRAINT "_Page_posts_A_fkey" FOREIGN KEY ("A") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Page_posts" ADD CONSTRAINT "_Page_posts_B_fkey" FOREIGN KEY ("B") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
