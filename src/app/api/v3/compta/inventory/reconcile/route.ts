/**
 * HARP Comptabilité V3 - Inventory Reconciliation Route
 * GET /api/v3/compta/inventory/reconcile - Run reconciliation or list results
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { reconcileInventory } from "@/lib/compta/services/inventory-service";

/**
 * GET /api/v3/compta/inventory/reconcile
 * Run reconciliation check and return mismatches
 * Compares sum(IN) - sum(OUT) from transactions with current inventory.quantity
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const mismatches = await reconcileInventory();

    // Calculate stats
    const totalItems = await prisma.inventoryItem.count({
      where: { isActive: true },
    });
    const stats = {
      totalItems,
      matched: totalItems - mismatches.length,
      mismatched: mismatches.length,
      criticalMismatches: mismatches.filter(
        (m) => Math.abs(m.variancePercent) > 10,
      ).length,
    };

    return NextResponse.json({
      success: true,
      mismatches,
      stats,
      message:
        mismatches.length === 0
          ? "Tous les articles sont réconciliés"
          : `${mismatches.length} écart(s) détecté(s)`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
