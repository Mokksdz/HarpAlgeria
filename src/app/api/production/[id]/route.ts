// =============================================================================
// API Route: /api/production/[id]
// CRUD pour un lot de production individuel
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getBatchById,
  startBatch,
  completeBatch,
  cancelBatch,
} from "@/lib/accounting/services";

// GET - Récupérer un lot par ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const batch = await getBatchById(id);

    if (!batch) {
      return NextResponse.json({ error: "Lot non trouvé" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du lot" },
      { status: 500 },
    );
  }
}

// PUT - Mettre à jour un lot (planifié uniquement)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.productionBatch.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lot non trouvé" }, { status: 404 });
    }

    if (existing.status !== "PLANNED") {
      return NextResponse.json(
        { error: "Seuls les lots planifiés peuvent être modifiés" },
        { status: 400 },
      );
    }

    const batch = await prisma.productionBatch.update({
      where: { id },
      data: {
        plannedQty: data.plannedQty,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined,
        laborCost: data.laborCost,
        overheadCost: data.overheadCost,
        notes: data.notes,
      },
      include: {
        model: true,
        consumptions: true,
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error updating batch:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}

// PATCH - Actions sur le lot (start, complete, cancel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { action, producedQty, wasteQty } = await req.json();

    let result;

    switch (action) {
      case "start":
        result = await startBatch(id);
        break;
      case "complete":
        if (producedQty === undefined) {
          return NextResponse.json(
            { error: "producedQty requis pour terminer le lot" },
            { status: 400 },
          );
        }
        result = await completeBatch(id, producedQty, wasteQty);
        break;
      case "cancel":
        result = await cancelBatch(id);
        break;
      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error patching batch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" || "Erreur lors de l'action" },
      { status: 400 },
    );
  }
}

// DELETE - Supprimer un lot (planifié uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.productionBatch.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lot non trouvé" }, { status: 404 });
    }

    if (existing.status !== "PLANNED") {
      return NextResponse.json(
        { error: "Seuls les lots planifiés peuvent être supprimés" },
        { status: 400 },
      );
    }

    await prisma.productionBatch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
