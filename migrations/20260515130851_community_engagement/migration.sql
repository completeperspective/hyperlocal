/*
  Warnings:

  - You are about to drop the column `homePage` on the `Settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mobile]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_homePage_fkey";

-- DropIndex
DROP INDEX "Settings_homePage_idx";

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "customCss" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hero" TEXT,
ADD COLUMN     "metaDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "metaTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "theme" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "contactPreference" TEXT DEFAULT 'email',
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "homePage",
ADD COLUMN     "receiverWalletAddress" TEXT,
ADD COLUMN     "rootCourse" TEXT,
ADD COLUMN     "rootPageIndex" TEXT,
ADD COLUMN     "transparentHeader" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "colorScheme" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobile" TEXT;

-- CreateTable
CREATE TABLE "Hero" (
    "id" TEXT NOT NULL,
    "heroEnabled" BOOLEAN NOT NULL DEFAULT false,
    "heroEyebrow" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT '',
    "heroTitleHighlight" TEXT NOT NULL DEFAULT '',
    "heroDescription" TEXT NOT NULL DEFAULT '',
    "heroCtaLabel" TEXT NOT NULL DEFAULT '',
    "heroCtaHref" TEXT NOT NULL DEFAULT '',
    "heroSecondaryLabel" TEXT NOT NULL DEFAULT '',
    "heroSecondaryHref" TEXT NOT NULL DEFAULT '',
    "heroStat1Value" TEXT NOT NULL DEFAULT '',
    "heroStat1Label" TEXT NOT NULL DEFAULT '',
    "heroStat2Value" TEXT NOT NULL DEFAULT '',
    "heroStat2Label" TEXT NOT NULL DEFAULT '',
    "heroStat3Value" TEXT NOT NULL DEFAULT '',
    "heroStat3Label" TEXT NOT NULL DEFAULT '',
    "heroImage" TEXT NOT NULL DEFAULT '',
    "heroImageBadgeTitle" TEXT NOT NULL DEFAULT '',
    "heroImageBadgeSubtitle" TEXT NOT NULL DEFAULT '',
    "heroBackgroundImage" TEXT NOT NULL DEFAULT '',
    "heroBackgroundImageMobile" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipTier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "priceInCents" INTEGER DEFAULT 0,
    "currency" TEXT DEFAULT 'usd',
    "paymentType" TEXT DEFAULT 'free',
    "recurringInterval" TEXT,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contentAccessPatterns" JSONB,

    CONSTRAINT "MembershipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMembership" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "tier" TEXT,
    "status" TEXT DEFAULT 'pending',
    "stripeCheckoutSessionId" TEXT,
    "stripeSubscriptionId" TEXT,
    "cryptoTxHash" TEXT,
    "paymentMethod" TEXT,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "metaTitle" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT NOT NULL DEFAULT '',
    "ogImage" TEXT,
    "content" JSONB NOT NULL DEFAULT '[{"type":"paragraph","children":[{"text":""}]}]',
    "trustedHtml" TEXT NOT NULL DEFAULT '',
    "customCss" TEXT NOT NULL DEFAULT '',
    "hero" TEXT,
    "theme" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER DEFAULT 0,
    "course" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "totalLessonsCompleted" INTEGER DEFAULT 0,
    "totalCoursesCompleted" INTEGER DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "learningPreferences" JSONB DEFAULT '{}',

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "learnerProfile" TEXT,
    "course" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'enrolled',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseLessonProgress" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "learnerProfile" TEXT,
    "course" TEXT,
    "page" TEXT,
    "viewCount" INTEGER DEFAULT 0,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageIndex" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "basePath" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "metaTitle" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT NOT NULL DEFAULT '',
    "ogImage" TEXT,
    "groupsLabel" TEXT NOT NULL DEFAULT 'Groups',
    "content" JSONB NOT NULL DEFAULT '[{"type":"paragraph","children":[{"text":""}]}]',
    "trustedHtml" TEXT NOT NULL DEFAULT '',
    "customCss" TEXT NOT NULL DEFAULT '',
    "hero" TEXT,
    "theme" TEXT,

    CONSTRAINT "PageIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER DEFAULT 0,
    "pageIndex" TEXT,

    CONSTRAINT "PageGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PageIndex_pages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PageGroup_pages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Course_pages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Chapter_pages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "UserMembership_user_idx" ON "UserMembership"("user");

-- CreateIndex
CREATE INDEX "UserMembership_tier_idx" ON "UserMembership"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_ogImage_idx" ON "Course"("ogImage");

-- CreateIndex
CREATE INDEX "Course_hero_idx" ON "Course"("hero");

-- CreateIndex
CREATE INDEX "Course_theme_idx" ON "Course"("theme");

-- CreateIndex
CREATE INDEX "Chapter_course_idx" ON "Chapter"("course");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_user_key" ON "LearnerProfile"("user");

-- CreateIndex
CREATE INDEX "CourseEnrollment_user_idx" ON "CourseEnrollment"("user");

-- CreateIndex
CREATE INDEX "CourseEnrollment_learnerProfile_idx" ON "CourseEnrollment"("learnerProfile");

-- CreateIndex
CREATE INDEX "CourseEnrollment_course_idx" ON "CourseEnrollment"("course");

-- CreateIndex
CREATE INDEX "CourseLessonProgress_user_idx" ON "CourseLessonProgress"("user");

-- CreateIndex
CREATE INDEX "CourseLessonProgress_learnerProfile_idx" ON "CourseLessonProgress"("learnerProfile");

-- CreateIndex
CREATE INDEX "CourseLessonProgress_course_idx" ON "CourseLessonProgress"("course");

-- CreateIndex
CREATE INDEX "CourseLessonProgress_page_idx" ON "CourseLessonProgress"("page");

-- CreateIndex
CREATE UNIQUE INDEX "PageIndex_slug_key" ON "PageIndex"("slug");

-- CreateIndex
CREATE INDEX "PageIndex_ogImage_idx" ON "PageIndex"("ogImage");

-- CreateIndex
CREATE INDEX "PageIndex_hero_idx" ON "PageIndex"("hero");

-- CreateIndex
CREATE INDEX "PageIndex_theme_idx" ON "PageIndex"("theme");

-- CreateIndex
CREATE INDEX "PageGroup_pageIndex_idx" ON "PageGroup"("pageIndex");

-- CreateIndex
CREATE UNIQUE INDEX "_PageIndex_pages_AB_unique" ON "_PageIndex_pages"("A", "B");

-- CreateIndex
CREATE INDEX "_PageIndex_pages_B_index" ON "_PageIndex_pages"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PageGroup_pages_AB_unique" ON "_PageGroup_pages"("A", "B");

-- CreateIndex
CREATE INDEX "_PageGroup_pages_B_index" ON "_PageGroup_pages"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Course_pages_AB_unique" ON "_Course_pages"("A", "B");

-- CreateIndex
CREATE INDEX "_Course_pages_B_index" ON "_Course_pages"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Chapter_pages_AB_unique" ON "_Chapter_pages"("A", "B");

-- CreateIndex
CREATE INDEX "_Chapter_pages_B_index" ON "_Chapter_pages"("B");

-- CreateIndex
CREATE INDEX "Page_ogImage_idx" ON "Page"("ogImage");

-- CreateIndex
CREATE INDEX "Page_hero_idx" ON "Page"("hero");

-- CreateIndex
CREATE INDEX "Page_theme_idx" ON "Page"("theme");

-- CreateIndex
CREATE INDEX "Settings_rootPageIndex_idx" ON "Settings"("rootPageIndex");

-- CreateIndex
CREATE INDEX "Settings_rootCourse_idx" ON "Settings"("rootCourse");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_rootPageIndex_fkey" FOREIGN KEY ("rootPageIndex") REFERENCES "PageIndex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_rootCourse_fkey" FOREIGN KEY ("rootCourse") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_ogImage_fkey" FOREIGN KEY ("ogImage") REFERENCES "OGImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_hero_fkey" FOREIGN KEY ("hero") REFERENCES "Hero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_theme_fkey" FOREIGN KEY ("theme") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMembership" ADD CONSTRAINT "UserMembership_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMembership" ADD CONSTRAINT "UserMembership_tier_fkey" FOREIGN KEY ("tier") REFERENCES "MembershipTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_ogImage_fkey" FOREIGN KEY ("ogImage") REFERENCES "OGImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_hero_fkey" FOREIGN KEY ("hero") REFERENCES "Hero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_theme_fkey" FOREIGN KEY ("theme") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_course_fkey" FOREIGN KEY ("course") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_learnerProfile_fkey" FOREIGN KEY ("learnerProfile") REFERENCES "LearnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_course_fkey" FOREIGN KEY ("course") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLessonProgress" ADD CONSTRAINT "CourseLessonProgress_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLessonProgress" ADD CONSTRAINT "CourseLessonProgress_learnerProfile_fkey" FOREIGN KEY ("learnerProfile") REFERENCES "LearnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLessonProgress" ADD CONSTRAINT "CourseLessonProgress_course_fkey" FOREIGN KEY ("course") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLessonProgress" ADD CONSTRAINT "CourseLessonProgress_page_fkey" FOREIGN KEY ("page") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageIndex" ADD CONSTRAINT "PageIndex_ogImage_fkey" FOREIGN KEY ("ogImage") REFERENCES "OGImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageIndex" ADD CONSTRAINT "PageIndex_hero_fkey" FOREIGN KEY ("hero") REFERENCES "Hero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageIndex" ADD CONSTRAINT "PageIndex_theme_fkey" FOREIGN KEY ("theme") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageGroup" ADD CONSTRAINT "PageGroup_pageIndex_fkey" FOREIGN KEY ("pageIndex") REFERENCES "PageIndex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageIndex_pages" ADD CONSTRAINT "_PageIndex_pages_A_fkey" FOREIGN KEY ("A") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageIndex_pages" ADD CONSTRAINT "_PageIndex_pages_B_fkey" FOREIGN KEY ("B") REFERENCES "PageIndex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageGroup_pages" ADD CONSTRAINT "_PageGroup_pages_A_fkey" FOREIGN KEY ("A") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageGroup_pages" ADD CONSTRAINT "_PageGroup_pages_B_fkey" FOREIGN KEY ("B") REFERENCES "PageGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Course_pages" ADD CONSTRAINT "_Course_pages_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Course_pages" ADD CONSTRAINT "_Course_pages_B_fkey" FOREIGN KEY ("B") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Chapter_pages" ADD CONSTRAINT "_Chapter_pages_A_fkey" FOREIGN KEY ("A") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Chapter_pages" ADD CONSTRAINT "_Chapter_pages_B_fkey" FOREIGN KEY ("B") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
