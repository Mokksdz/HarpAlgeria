// =============================================================================
// API Route: /api/accounting/advances/[id]/apply
// Appliquer une avance à un achat
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { applyAdvanceToPurchase } from "@/lib/accounting/services";
import { z } from "zod";

// Schema de validation
const ApplySchema = z.object({
  purchaseId: z.string().min(1, "ID achat requis"),
  amount: z.number().positive("Montant doit être positif"),
  appliedBy: z.string().optional(),
});

// POST - Appliquer l'avance à un achat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validation
    const validation = ApplySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { purchaseId, amount, appliedBy } = validation.data;

    // Appliquer l'avance
    const result = await applyAdvanceToPurchase({
      advanceId: id,
      purchaseId,
      amount,
      appliedBy,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `${amount} DZD appliqués de l'avance à l'achat`,
    });
  } catch (error: unknown) {
    console.error("Error applying advance:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" || "Erreur lors de l'application" },
      { status: 400 },
    );
  }
}
