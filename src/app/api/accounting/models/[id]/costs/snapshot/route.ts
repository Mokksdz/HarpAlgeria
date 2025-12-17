// =============================================================================
// API Route: /api/accounting/models/[id]/costs/snapshot
// Créer un snapshot des coûts d'un modèle
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createCostSnapshot } from "@/lib/accounting/services";
import { prisma } from "@/lib/prisma";

// POST - Créer un snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const snapshot = await createCostSnapshot(id, body.batchId, body.createdBy);

    return NextResponse.json({
      success: true,
      snapshot,
      message: `Snapshot ${snapshot.snapshotNumber} créé avec succès`,
    });
  } catch (error: unknown) {
    console.error("Error creating snapshot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}

// GET - Lister les snapshots d'un modèle
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const snapshots = await prisma.costSnapshot.findMany({
      where: { modelId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des snapshots" },
      { status: 500 },
    );
  }
}
