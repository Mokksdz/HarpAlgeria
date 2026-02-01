import { NextRequest, NextResponse } from "next/server";
import { getYalidineClient } from "@/lib/yalidine";

// GET /api/shipping/communes?wilaya_id=16 — Public route for checkout
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wilayaId = searchParams.get("wilaya_id");

    if (!wilayaId) {
      return NextResponse.json(
        { error: "wilaya_id est requis" },
        { status: 400 },
      );
    }

    const client = getYalidineClient();
    const result = await client.getCommunes(parseInt(wilayaId));

    return NextResponse.json(
      { data: result.data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching communes:", error);
    return NextResponse.json(
      { data: [], error: "Impossible de charger les communes" },
      { status: 500 },
    );
  }
}
