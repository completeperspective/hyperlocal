-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "owner" TEXT,
    "nickname" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT 'Earth',
    "image" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "source" JSONB,
    "altText" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ProfileImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_owner_key" ON "Profile"("owner");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_image_key" ON "Profile"("image");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_owner_fkey" FOREIGN KEY ("owner") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_image_fkey" FOREIGN KEY ("image") REFERENCES "ProfileImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
