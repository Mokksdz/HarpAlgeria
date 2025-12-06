import { NextRequest, NextResponse } from "next/server";
import { getYalidineClient } from "@/lib/yalidine";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

// POST /api/shipping/yalidine/track - Suivre un ou plusieurs colis
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

        const client = getYalidineClient();
        
        // Récupérer les infos de tracking
        const result = await client.getParcels(trackingNumbers);

        return NextResponse.json({
            success: true,
            data: result.data,
            total: result.total_data
        });

    } catch (error) {
        return handleApiError(error);
    }
}

// GET /api/shipping/yalidine/track?tracking=xxx - Historique d'un colis
export async function GET(request: NextRequest) {
    try {
        await requireAdmin(request);
        
        const { searchParams } = new URL(request.url);
        const tracking = searchParams.get('tracking');

        if (!tracking) {
            return NextResponse.json(
                { error: "tracking requis" },
                { status: 400 }
            );
        }

        const client = getYalidineClient();
        const history = await client.getHistory(tracking);

        return NextResponse.json({
            success: true,
            tracking,
            history: history.data
        });

    } catch (error) {
        return handleApiError(error);
    }
}
