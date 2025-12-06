// =============================================================================
// API Route: /api/accounting/inventory/adjustment
// Créer un ajustement d'inventaire
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdjustment } from "@/lib/accounting/services";
import { z } from "zod";

// Schema de validation
const AdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1, "Article requis"),
  quantity: z.number(), // Positif = entrée, Négatif = sortie
  reason: z.string().min(1, "Raison requise"),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

// POST - Créer un ajustement
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation
    const validation = AdjustmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Données invalides",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { inventoryItemId, quantity, reason, notes, createdBy } = validation.data;

    // Créer l'ajustement
    const result = await createAdjustment(
      inventoryItemId,
      quantity,
      reason,
      notes,
      createdBy
    );

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      item: result.item,
      message: `Ajustement de ${quantity >= 0 ? '+' : ''}${quantity} effectué`,
    });
  } catch (error: any) {
    console.error("Error creating adjustment:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'ajustement" },
      { status: 400 }
    );
  }
}
