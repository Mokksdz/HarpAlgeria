// =============================================================================
// API Route: /api/accounting/models/[id]/costs
// Calcul des coûts et marges d'un modèle
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { computeCostPerUnit, simulatePrice } from "@/lib/accounting/services";

// GET - Calculer les coûts d'un modèle
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const costResult = await computeCostPerUnit(id);

    return NextResponse.json(costResult);
  } catch (error: any) {
    console.error("Error computing costs:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du calcul des coûts" },
      { status: 400 }
    );
  }
}

// POST - Simuler les coûts avec des paramètres modifiés
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { overrides, estimatedUnits, laborCost, packagingCost, marginTarget } = body;

    const simulation = await simulatePrice(id, {
      overrides,
      estimatedUnits,
      laborCost,
      packagingCost,
      marginTarget,
    });

    return NextResponse.json(simulation);
  } catch (error: any) {
    console.error("Error simulating costs:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la simulation" },
      { status: 400 }
    );
  }
}
