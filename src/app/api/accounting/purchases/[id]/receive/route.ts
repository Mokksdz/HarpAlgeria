// =============================================================================
// API Route: /api/accounting/purchases/[id]/receive
// Réceptionner un achat fournisseur
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { receivePurchase } from "@/lib/accounting/services";
import { z } from "zod";

// Schema de validation
const ReceiveSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "ID article requis"),
        quantityReceived: z.number().min(0, "Quantité >= 0"),
      }),
    )
    .min(1, "Au moins un article requis"),
  receivedBy: z.string().optional(),
});

// POST - Réceptionner l'achat
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validation
    const validation = ReceiveSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { items, receivedBy } = validation.data;

    // Réceptionner l'achat
    const result = await receivePurchase(id, items, receivedBy);

    return NextResponse.json({
      success: true,
      purchase: result,
      message: `Réception effectuée. Statut: ${result.status}`,
    });
  } catch (error: any) {
    console.error("Error receiving purchase:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la réception" },
      { status: 400 },
    );
  }
}
