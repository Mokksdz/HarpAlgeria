import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import {
  runDailyBirthdayGrant,
  LOYALTY_RULES,
} from "@/lib/loyalty/services/loyalty.service";

// POST - Run birthday grant job manually (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    // Running birthday grant job
    const result = await runDailyBirthdayGrant();

    return NextResponse.json({
      success: true,
      message: `Job terminé. ${result.processed} utilisateur(s) traité(s).`,
      pointsPerUser: LOYALTY_RULES.BIRTHDAY_BONUS,
      ...result,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

// GET - Get info about birthday system
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    return NextResponse.json({
      birthdayBonus: LOYALTY_RULES.BIRTHDAY_BONUS,
      description:
        "Points attribués automatiquement le jour de l'anniversaire de chaque utilisateur",
      endpoint: "/api/v3/admin/birthday",
      method: "POST to run manually",
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
