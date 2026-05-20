-- CreateTable
CREATE TABLE "PageAttachment" (
    "id" TEXT NOT NULL,
    "page" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "cloudinaryUpload" JSONB,
    "filename" TEXT NOT NULL DEFAULT '',
    "publicId" TEXT NOT NULL DEFAULT '',
    "publicUrl" TEXT NOT NULL DEFAULT '',
    "mimeType" TEXT NOT NULL DEFAULT '',
    "format" TEXT NOT NULL DEFAULT '',
    "bytes" INTEGER,

    CONSTRAINT "PageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageAttachment_page_idx" ON "PageAttachment"("page");

-- AddForeignKey
ALTER TABLE "PageAttachment" ADD CONSTRAINT "PageAttachment_page_fkey" FOREIGN KEY ("page") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
