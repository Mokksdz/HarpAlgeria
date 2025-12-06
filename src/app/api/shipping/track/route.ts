import { NextRequest, NextResponse } from "next/server";
import { getZRClient } from "@/lib/zrexpress";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

// POST /api/shipping/track - Suivre un ou plusieurs colis
export async function POST(request: NextRequest) {
    try {
        await requireAdmin(request);
        
        const body = await request.json();
        const { trackingNumbers } = body;

        if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
            return NextResponse.json(
                { error: "trackingNumbers est requis (tableau)" },
                { status: 400 }
            );
        }

        const client = getZRClient();
        const trackingInfo = await client.getTrackingInfo(trackingNumbers);

        return NextResponse.json({
            success: true,
            data: trackingInfo
        });
    } catch (error) {
        return handleApiError(error);
    }
}
