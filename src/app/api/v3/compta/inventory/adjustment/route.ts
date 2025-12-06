/**
 * HARP Comptabilité V3 - Inventory Adjustment Route
 * POST /api/v3/compta/inventory/adjustment - Apply inventory adjustment
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";
import { InventoryAdjustmentSchema } from "@/lib/compta/schemas/purchase.schemas";
import { applyAdjustment } from "@/lib/compta/services/inventory-service";

/**
 * POST /api/v3/compta/inventory/adjustment
 * Apply an inventory adjustment (ADD, REMOVE, SET)
 * Creates InventoryTransaction and AuditLog
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const body = await req.json();
    const data = InventoryAdjustmentSchema.parse(body);

    // Get user ID from session
    const userId = (session.user as { id?: string })?.id;

    const result = await applyAdjustment(data, userId);

    return NextResponse.json({
      success: true,
      item: result.item,
      transaction: result.transaction,
      message: `Ajustement ${data.adjustmentType} de ${data.quantity} enregistré`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: err.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    // Handle business logic errors
    if (
      err instanceof Error &&
      (err.message.includes("non trouvé") ||
        err.message.includes("insuffisant"))
    ) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 422 },
      );
    }
    return handleApiError(err);
  }
}
