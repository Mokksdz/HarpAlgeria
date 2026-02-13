import { NextRequest, NextResponse } from "next/server";
import { getZRClient } from "@/lib/zrexpress";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

// POST /api/shipping/track - Suivre un ou plusieurs colis
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { trackingNumbers } = body;

    if (
      !trackingNumbers ||
      !Array.isArray(trackingNumbers) ||
      trackingNumbers.length === 0
    ) {
      return NextResponse.json(
        { error: "trackingNumbers est requis (tableau)" },
        { status: 400 },
      );
    }

    const client = getZRClient();

    // Fetch each parcel individually using the new API
    const results = await Promise.all(
      trackingNumbers.map(async (tn: string) => {
        try {
          // Bug #28: Try by tracking number first (tn may not be a UUID)
          const parcel = await client.getParcelByTracking(tn) || await client.getParcel(tn);
          return parcel ? { tracking: tn, found: true, ...parcel } : { tracking: tn, found: false };
        } catch {
          return { tracking: tn, found: false };
        }
      }),
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
