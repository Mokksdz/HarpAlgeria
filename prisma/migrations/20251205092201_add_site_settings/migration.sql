-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "heroImageUrl" TEXT,
    "heroImagePublicId" TEXT,
    "heroMobileImageUrl" TEXT,
    "heroMobilePublicId" TEXT,
    "heroAltFr" TEXT,
    "heroAltAr" TEXT,
    "heroCaptionFr" TEXT,
    "heroCaptionAr" TEXT,
    "heroCtaTextFr" TEXT,
    "heroCtaTextAr" TEXT,
    "heroCtaUrl" TEXT,
    "heroOverlayOpacity" REAL DEFAULT 0.35,
    "heroPreset" TEXT DEFAULT 'classic',
    "heroActive" BOOLEAN NOT NULL DEFAULT true,
    "heroScheduleStart" DATETIME,
    "heroScheduleEnd" DATETIME,
    "heroVariant" TEXT DEFAULT 'image',
    "heroCarouselItems" TEXT,
    "lastUpdatedById" TEXT,
    CONSTRAINT "SiteSetting_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSettingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settingId" TEXT NOT NULL DEFAULT 'default',
    "snapshot" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SiteSettingHistory_settingId_idx" ON "SiteSettingHistory"("settingId");

-- CreateIndex
CREATE INDEX "SiteSettingHistory_createdAt_idx" ON "SiteSettingHistory"("createdAt");
