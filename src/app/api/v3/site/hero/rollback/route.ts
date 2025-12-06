import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { rollbackSettings } from "@/lib/site/settings.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const rollbackSchema = z.object({
  historyId: z.string(),
});

// POST - Rollback to a previous version (admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    const { historyId } = rollbackSchema.parse(body);

    const { updated } = await rollbackSettings(historyId, admin.user.id);

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
