import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { updateHeroSettings, getSiteSettings } from "@/lib/site/settings.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const heroSchema = z.object({
  heroImageUrl: z.string().url().optional().nullable(),
  heroImagePublicId: z.string().optional().nullable(),
  heroMobileImageUrl: z.string().url().optional().nullable(),
  heroMobilePublicId: z.string().optional().nullable(),
  heroAltFr: z.string().optional().nullable(),
  heroAltAr: z.string().optional().nullable(),
  heroCaptionFr: z.string().optional().nullable(),
  heroCaptionAr: z.string().optional().nullable(),
  heroCtaTextFr: z.string().optional().nullable(),
  heroCtaTextAr: z.string().optional().nullable(),
  heroCtaUrl: z.string().optional().nullable(),
  heroOverlayOpacity: z.number().min(0).max(1).optional().nullable(),
  heroPreset: z.enum(["classic", "minimal", "glass", "centered"]).optional().nullable(),
  heroActive: z.boolean().optional(),
  heroScheduleStart: z.string().datetime().optional().nullable(),
  heroScheduleEnd: z.string().datetime().optional().nullable(),
  heroVariant: z.enum(["image", "video", "carousel"]).optional().nullable(),
  heroCarouselItems: z.string().optional().nullable()
});

// GET - Get current hero settings (admin)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

// PUT - Update hero settings (admin only)
export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    
    // Validate input
    const validated = heroSchema.parse(body);
    
    // Convert date strings to Date objects
    const data: any = { ...validated };
    if (validated.heroScheduleStart) {
      data.heroScheduleStart = new Date(validated.heroScheduleStart);
    }
    if (validated.heroScheduleEnd) {
      data.heroScheduleEnd = new Date(validated.heroScheduleEnd);
    }

    const { updated } = await updateHeroSettings(data, admin.user.id);

    // Revalidate homepage
    try {
      revalidatePath("/");
    } catch (e) {
      console.warn("Revalidate failed:", e);
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
