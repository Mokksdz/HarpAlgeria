// =============================================================================
// API Route: /api/accounting/purchases/[id]/preview
// Prévisualiser l'impact d'une réception sur le stock
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { previewReceive } from "@/lib/accounting/services";

// GET - Prévisualiser la réception
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const preview = await previewReceive(id);

    return NextResponse.json(preview);
  } catch (error: unknown) {
    console.error("Error generating receive preview:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}
