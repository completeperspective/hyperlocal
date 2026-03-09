-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "recoveryPhrase" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT '',
    "baseUrl" TEXT NOT NULL DEFAULT '',
    "copyright" TEXT NOT NULL DEFAULT '',
    "metaTitle" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT NOT NULL DEFAULT '',
    "ogImage_id" TEXT,
    "ogImage_filesize" INTEGER,
    "ogImage_width" INTEGER,
    "ogImage_height" INTEGER,
    "ogImage_extension" TEXT,
    "robots" TEXT DEFAULT 'noindex, nofollow, noarchive, nosnippet',
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "allowSignup" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'We''ll be back shortly.',
    "gaTrackingId" TEXT NOT NULL DEFAULT '',
    "socialLinks" JSONB,
    "theme" TEXT,
    "homePage" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "lightMode" JSONB DEFAULT '{"card":"oklch(1 0 0)","info":"oklch(0.70 0.15 240)","ring":"oklch(0.708 0 0)","input":"oklch(0.922 0 0)","meta1":"oklch(0.646 0.222 41.116)","meta2":"oklch(0.6 0.118 184.704)","meta3":"oklch(0.398 0.07 227.392)","meta4":"oklch(0.828 0.189 84.429)","meta5":"oklch(0.769 0.188 70.08)","muted":"oklch(0.97 0 0)","accent":"oklch(0.7407 0.131 349.73)","border":"oklch(0.922 0 0)","popover":"oklch(1 0 0)","primary":"oklch(0.6558 0.2557 359.13)","sidebar":"oklch(0.985 0 0)","warning":"oklch(75% 0.183 55.934)","positive":"oklch(0.6868 0.1816 142.18)","secondary":"oklch(0.4487 0.1742 358.82)","background":"oklch(0.9665 0.0045 258.32)","foreground":"oklch(0.2225 0.0019 286.24)","destructive":"oklch(0.577 0.245 27.325)","sidebarRing":"oklch(0.708 0 0)","sidebarAccent":"oklch(0.97 0 0)","sidebarBorder":"oklch(0.922 0 0)","cardForeground":"oklch(0.2225 0.0019 286.24)","infoForeground":"oklch(0.2225 0.0019 286.24)","sidebarPrimary":"oklch(0.205 0 0)","mutedForeground":"oklch(0.556 0 0)","accentForeground":"oklch(0.2661 0.093 354.64)","popoverForeground":"oklch(0.2225 0.0019 286.24)","primaryForeground":"oklch(1 0 0)","sidebarForeground":"oklch(0.2225 0.0019 286.24)","warningForeground":"oklch(0.28 0.07 46)","positiveForeground":"oklch(0.9665 0.0045 258.32)","secondaryForeground":"oklch(1 0 0)","destructiveForeground":"oklch(1 0 0)","sidebarAccentForeground":"oklch(0.205 0 0)","sidebarPrimaryForeground":"oklch(0.985 0 0)"}',
    "darkMode" JSONB DEFAULT '{"card":"oklch(0.2545 0.0035 228.93)","info":"oklch(0.70 0.15 240)","ring":"oklch(0.556 0 0)","input":"oklch(1 0 0 / 15%)","meta1":"oklch(0.488 0.243 264.376)","meta2":"oklch(0.696 0.17 162.48)","meta3":"oklch(0.769 0.188 70.08)","meta4":"oklch(0.627 0.265 303.9)","meta5":"oklch(0.645 0.246 16.439)","muted":"oklch(0.2545 0.0035 228.93)","accent":"oklch(0.7407 0.131 349.73)","border":"oklch(1 0 0 / 10%)","popover":"oklch(0.2545 0.0035 228.93)","primary":"oklch(0.5844 0.228 8.91)","sidebar":"oklch(0.2545 0.0035 228.93)","warning":"oklch(75% 0.183 55.934)","positive":"oklch(0.6868 0.1816 142.18)","secondary":"oklch(0.3589 0.082 11.05)","background":"oklch(0.2225 0.0019 286.24)","foreground":"oklch(0.9665 0.0045 258.32)","destructive":"oklch(0.704 0.191 22.216)","sidebarRing":"oklch(0.439 0 0)","sidebarAccent":"oklch(0.269 0 0)","sidebarBorder":"oklch(1 0 0 / 10%)","cardForeground":"oklch(0.9665 0.0045 258.32)","infoForeground":"oklch(0.9665 0.0045 258.32)","sidebarPrimary":"oklch(0.488 0.243 264.376)","mutedForeground":"oklch(0.556 0 0)","accentForeground":"oklch(0.2661 0.093 354.64)","popoverForeground":"oklch(0.9665 0.0045 258.32)","primaryForeground":"oklch(1 0 0)","sidebarForeground":"oklch(0.9665 0.0045 258.32)","warningForeground":"oklch(0.99 0.02 95)","positiveForeground":"oklch(0.9665 0.0045 258.32)","secondaryForeground":"oklch(1 0 0)","destructiveForeground":"oklch(0.9665 0.0045 258.32)","sidebarAccentForeground":"oklch(0.985 0 0)","sidebarPrimaryForeground":"oklch(0.985 0 0)"}',
    "radius" TEXT NOT NULL DEFAULT '0.625rem',
    "fontPrimary" TEXT NOT NULL DEFAULT '''Lobster'', sans-serif',
    "fontSecondary" TEXT NOT NULL DEFAULT '''Open Sans'', sans-serif',

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "status" TEXT DEFAULT 'draft',
    "content" JSONB NOT NULL DEFAULT '[{"type":"paragraph","children":[{"text":""}]}]',
    "trustedHtml" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Settings_theme_idx" ON "Settings"("theme");

-- CreateIndex
CREATE INDEX "Settings_homePage_idx" ON "Settings"("homePage");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_owner_key" ON "Profile"("owner");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_image_key" ON "Profile"("image");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_theme_fkey" FOREIGN KEY ("theme") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_homePage_fkey" FOREIGN KEY ("homePage") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_owner_fkey" FOREIGN KEY ("owner") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_image_fkey" FOREIGN KEY ("image") REFERENCES "ProfileImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
