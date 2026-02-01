import { NextRequest, NextResponse } from "next/server";
import { getYalidineClient } from "@/lib/yalidine";
import { getZRStopDesks } from "@/lib/zrexpress-stopdesks";

// GET /api/shipping/centers?wilaya_id=16&provider=yalidine — Public route for checkout
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wilayaId = searchParams.get("wilaya_id");
    const provider = searchParams.get("provider") || "yalidine";

    if (!wilayaId) {
      return NextResponse.json(
        { error: "wilaya_id est requis" },
        { status: 400 },
      );
    }

    if (provider === "zrexpress") {
      const stopDesks = getZRStopDesks(parseInt(wilayaId));
      return NextResponse.json(
        { data: stopDesks },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=86400, stale-while-revalidate=3600",
          },
        },
      );
    }

    // Default: Yalidine
    const client = getYalidineClient();
    const result = await client.getCenters(parseInt(wilayaId));

    return NextResponse.json(
      { data: result.data || [] },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching centers:", error);
    return NextResponse.json(
      { data: [], error: "Impossible de charger les centres" },
      { status: 500 },
    );
  }
}
