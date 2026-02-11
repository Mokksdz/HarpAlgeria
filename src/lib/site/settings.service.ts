import { prisma } from "@/lib/prisma";

export interface HeroSettings {
  heroImageUrl?: string | null;
  heroImagePublicId?: string | null;
  heroMobileImageUrl?: string | null;
  heroMobilePublicId?: string | null;
  heroAltFr?: string | null;
  heroAltAr?: string | null;
  heroCaptionFr?: string | null;
  heroCaptionAr?: string | null;
  heroCtaTextFr?: string | null;
  heroCtaTextAr?: string | null;
  heroCtaUrl?: string | null;
  heroOverlayOpacity?: number | null;
  heroPreset?: string | null;
  heroActive?: boolean;
  heroScheduleStart?: Date | null;
  heroScheduleEnd?: Date | null;
  heroVariant?: string | null;
  heroCarouselItems?: string | null;
}

/**
 * Get or create default site settings
 */
export async function getSiteSettings() {
  let settings = await prisma.siteSetting.findUnique({
    where: { id: "default" },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.siteSetting.create({
      data: {
        id: "default",
        heroActive: true,
        heroOverlayOpacity: 0.35,
        heroPreset: "classic",
        heroVariant: "image",
      },
    });
  }

  return settings;
}

/**
 * Resolve userId: only use it as FK if it exists in the User table
 */
async function resolveUserId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId?: string,
): Promise<string | null> {
  if (!userId) return null;
  const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user ? userId : null;
}

/**
 * Update hero settings with audit trail
 */
export async function updateHeroSettings(data: HeroSettings, userId?: string) {
  return prisma.$transaction(async (tx) => {
    // Get previous settings
    const prev = await tx.siteSetting.findUnique({ where: { id: "default" } });

    // Ensure settings exist
    if (!prev) {
      await tx.siteSetting.create({
        data: { id: "default" },
      });
    }

    // Resolve userId for FK safety
    const safeUserId = await resolveUserId(tx, userId);

    // Create history snapshot before update
    if (prev) {
      await tx.siteSettingHistory.create({
        data: {
          settingId: "default",
          snapshot: JSON.stringify(prev),
          userId: userId || null,
        },
      });
    }

    // Update settings
    const updated = await tx.siteSetting.update({
      where: { id: "default" },
      data: {
        ...data,
        lastUpdatedById: safeUserId,
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: "UPDATE_HERO",
        entity: "SiteSetting",
        entityId: "default",
        userId: userId || null,
        before: prev ? JSON.stringify(prev) : null,
        after: JSON.stringify(updated),
      },
    });

    return { prev, updated };
  });
}

export interface FeaturedSettings {
  featuredImageUrl?: string | null;
  featuredImagePublicId?: string | null;
  featuredBadgeFr?: string | null;
  featuredBadgeAr?: string | null;
  featuredTitleFr?: string | null;
  featuredTitleAr?: string | null;
  featuredDescFr?: string | null;
  featuredDescAr?: string | null;
  featuredCtaUrl?: string | null;
}

/**
 * Update featured section settings with audit trail
 */
export async function updateFeaturedSettings(
  data: FeaturedSettings,
  userId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const prev = await tx.siteSetting.findUnique({
      where: { id: "default" },
    });

    if (!prev) {
      await tx.siteSetting.create({ data: { id: "default" } });
    }

    const safeUserId = await resolveUserId(tx, userId);

    if (prev) {
      await tx.siteSettingHistory.create({
        data: {
          settingId: "default",
          snapshot: JSON.stringify(prev),
          userId: userId || null,
        },
      });
    }

    const updated = await tx.siteSetting.update({
      where: { id: "default" },
      data: {
        ...data,
        lastUpdatedById: safeUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE_FEATURED",
        entity: "SiteSetting",
        entityId: "default",
        userId: userId || null,
        before: prev ? JSON.stringify(prev) : null,
        after: JSON.stringify(updated),
      },
    });

    return { prev, updated };
  });
}

export interface AboutSettings {
  aboutImage1Url?: string | null;
  aboutImage2Url?: string | null;
  aboutImage3Url?: string | null;
  aboutHeroTitle?: string | null;
  aboutHeroSubtitle?: string | null;
  aboutStoryTitle?: string | null;
  aboutStoryP1?: string | null;
  aboutStoryP2?: string | null;
  aboutStoryP3?: string | null;
  aboutQuote?: string | null;
  aboutQuoteAuthor?: string | null;
}

/**
 * Update about page settings with audit trail
 */
export async function updateAboutSettings(
  data: AboutSettings,
  userId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const prev = await tx.siteSetting.findUnique({
      where: { id: "default" },
    });

    if (!prev) {
      await tx.siteSetting.create({ data: { id: "default" } });
    }

    const safeUserId = await resolveUserId(tx, userId);

    if (prev) {
      await tx.siteSettingHistory.create({
        data: {
          settingId: "default",
          snapshot: JSON.stringify(prev),
          userId: userId || null,
        },
      });
    }

    const updated = await tx.siteSetting.update({
      where: { id: "default" },
      data: {
        ...data,
        lastUpdatedById: safeUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE_ABOUT",
        entity: "SiteSetting",
        entityId: "default",
        userId: userId || null,
        before: prev ? JSON.stringify(prev) : null,
        after: JSON.stringify(updated),
      },
    });

    return { prev, updated };
  });
}

/**
 * Update homepage collection IDs with audit trail
 */
export async function updateHomepageCollections(
  collectionIds: string[],
  userId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const prev = await tx.siteSetting.findUnique({
      where: { id: "default" },
    });

    if (!prev) {
      await tx.siteSetting.create({ data: { id: "default" } });
    }

    const safeUserId = await resolveUserId(tx, userId);

    if (prev) {
      await tx.siteSettingHistory.create({
        data: {
          settingId: "default",
          snapshot: JSON.stringify(prev),
          userId: userId || null,
        },
      });
    }

    const updated = await tx.siteSetting.update({
      where: { id: "default" },
      data: {
        homepageCollectionIds: JSON.stringify(collectionIds),
        lastUpdatedById: safeUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE_HOMEPAGE_COLLECTIONS",
        entity: "SiteSetting",
        entityId: "default",
        userId: userId || null,
        before: prev
          ? JSON.stringify({
              homepageCollectionIds: prev.homepageCollectionIds,
            })
          : null,
        after: JSON.stringify({
          homepageCollectionIds: updated.homepageCollectionIds,
        }),
      },
    });

    return { prev, updated };
  });
}

/**
 * Get settings history for rollback
 */
export async function getSettingsHistory(limit = 10) {
  return prisma.siteSettingHistory.findMany({
    where: { settingId: "default" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Rollback to a previous version
 */
export async function rollbackSettings(historyId: string, userId?: string) {
  const history = await prisma.siteSettingHistory.findUnique({
    where: { id: historyId },
  });

  if (!history) {
    throw new Error("History not found");
  }

  const snapshot = JSON.parse(history.snapshot);

  // Remove fields that shouldn't be restored
  delete snapshot.id;
  delete snapshot.createdAt;
  delete snapshot.updatedAt;
  delete snapshot.lastUpdatedById;

  return updateHeroSettings(snapshot, userId);
}

/**
 * Check if hero should be displayed (considering schedule)
 */
export function isHeroActive(settings: any): boolean {
  if (!settings?.heroActive) return false;

  const now = new Date();

  if (
    settings.heroScheduleStart &&
    new Date(settings.heroScheduleStart) > now
  ) {
    return false;
  }

  if (settings.heroScheduleEnd && new Date(settings.heroScheduleEnd) < now) {
    return false;
  }

  return true;
}

/**
 * Generate Cloudinary signature for client-side upload
 */
export function generateCloudinarySignature(folder: string = "harp/hero") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Create signature string
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

  // Create SHA1 hash using dynamic import workaround
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto");
  const signature = crypto
    .createHash("sha1")
    .update(signatureString)
    .digest("hex");

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  };
}
