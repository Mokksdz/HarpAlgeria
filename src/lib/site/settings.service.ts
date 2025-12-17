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

    // Create history snapshot before update
    if (prev) {
      await tx.siteSettingHistory.create({
        data: {
          settingId: "default",
          snapshot: JSON.stringify(prev),
          userId,
        },
      });
    }

    // Update settings
    const updated = await tx.siteSetting.update({
      where: { id: "default" },
      data: {
        ...data,
        lastUpdatedById: userId || null,
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
