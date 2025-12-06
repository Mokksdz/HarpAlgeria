import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { generateCloudinarySignature } from "@/lib/site/settings.service";

// GET - Generate Cloudinary signature for client-side upload
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "harp/hero";

    const signData = generateCloudinarySignature(folder);

    return NextResponse.json(signData);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
