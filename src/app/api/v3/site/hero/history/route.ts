import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { getSettingsHistory } from "@/lib/site/settings.service";

// GET - Get hero settings history (admin only)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const history = await getSettingsHistory(Math.min(limit, 50));

    return NextResponse.json({
      success: true,
      history: history.map((h) => ({
        id: h.id,
        createdAt: h.createdAt,
        snapshot: JSON.parse(h.snapshot),
      })),
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
