import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site/settings.service";

// GET - Public endpoint to get site settings (cacheable)
export async function GET() {
  try {
    const settings = await getSiteSettings();
    
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (error: any) {
    console.error("Site settings error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
