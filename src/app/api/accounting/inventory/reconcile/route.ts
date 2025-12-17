// =============================================================================
// API Route: /api/accounting/inventory/reconcile
// Réconciliation d'inventaire
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileInventory } from "@/lib/accounting/services";
import { z } from "zod";

// Schema de validation
const ReconcileSchema = z.object({
  inventoryItemIds: z.array(z.string()).optional(),
});

// GET - Récupérer les dernières réconciliations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, string> = {};
    if (status) {
      where.status = status;
    }

    const reconciliations = await prisma.stockReconciliation.findMany({
      where,
      orderBy: { reconcileDate: "desc" },
      take: limit,
    });

    // Enrichir avec les données d'article
    const enriched = await Promise.all(
      reconciliations.map(async (rec) => {
        const item = await prisma.inventoryItem.findUnique({
          where: { id: rec.inventoryItemId },
          select: { id: true, sku: true, name: true },
        });
        return { ...rec, inventoryItem: item };
      }),
    );

    return NextResponse.json({
      reconciliations: enriched,
      total: enriched.length,
    });
  } catch (error) {
    console.error("Error fetching reconciliations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réconciliations" },
      { status: 500 },
    );
  }
}

// POST - Exécuter une réconciliation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validation
    const validation = ReconcileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { inventoryItemIds } = validation.data;

    // Exécuter la réconciliation
    const results = await reconcileInventory(inventoryItemIds);

    // Statistiques
    const stats = {
      total: results.length,
      ok: results.filter((r) => r.status === "OK").length,
      warning: results.filter((r) => r.status === "WARNING").length,
      critical: results.filter((r) => r.status === "CRITICAL").length,
    };

    return NextResponse.json({
      success: true,
      results,
      stats,
      message: `Réconciliation effectuée pour ${results.length} articles`,
    });
  } catch (error: unknown) {
    console.error("Error during reconciliation:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}

// PATCH - Mettre à jour le statut d'une réconciliation
export async function PATCH(req: NextRequest) {
  try {
    const { reconciliationId, status, notes, reviewedBy } = await req.json();

    if (!reconciliationId || !status) {
      return NextResponse.json(
        { error: "reconciliationId et status requis" },
        { status: 400 },
      );
    }

    const updated = await prisma.stockReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status,
        notes,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating reconciliation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}
