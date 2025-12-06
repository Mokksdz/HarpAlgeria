// =============================================================================
// API Route: /api/production/[id]/consume
// Consommer les matières premières pour un lot de production
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { consumeProductionBatch, previewConsumption } from "@/lib/accounting/services";
import { z } from "zod";

// Schema de validation
const ConsumeSchema = z.object({
  consumptions: z.array(z.object({
    inventoryItemId: z.string().min(1),
    quantity: z.number().positive(),
  })).optional(),
  createdBy: z.string().optional(),
});

// GET - Prévisualiser la consommation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const preview = await previewConsumption(id);

    return NextResponse.json(preview);
  } catch (error: any) {
    console.error("Error generating consumption preview:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la prévisualisation" },
      { status: 400 }
    );
  }
}

// POST - Consommer les matières
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validation
    const validation = ConsumeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Données invalides",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { consumptions, createdBy } = validation.data;

    // Consommer les matières
    const result = await consumeProductionBatch(id, consumptions, createdBy);

    return NextResponse.json({
      success: true,
      batch: result,
      message: "Matières consommées avec succès",
    });
  } catch (error: any) {
    console.error("Error consuming materials:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la consommation" },
      { status: 400 }
    );
  }
}
