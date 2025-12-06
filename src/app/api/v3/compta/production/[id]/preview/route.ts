/**
 * HARP Comptabilité V3 - Production Preview Route
 * GET /api/v3/compta/production/[id]/preview - Preview BOM requirements
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { previewProductionConsumption } from "@/lib/compta/services/production-service";

/**
 * GET /api/v3/compta/production/[id]/preview
 * Preview material requirements for a batch (non-destructive)
 * Returns BOM requirements with stock availability check
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const preview = await previewProductionConsumption(id);

    return NextResponse.json({
      success: true,
      ...preview,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("non trouvé")) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 404 },
        );
      }
      if (err.message.includes("statut")) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 422 },
        );
      }
    }
    return handleApiError(err);
  }
}
