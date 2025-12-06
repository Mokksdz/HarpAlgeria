import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const BatchUpdateSchema = z.object({
  plannedQty: z.number().int().positive().optional(),
  plannedDate: z.string().datetime().optional(),
  laborCost: z.number().min(0).optional(),
  overheadCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const batch = await prisma.productionBatch.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            bom: { include: { inventoryItem: true } },
          },
        },
        consumptions: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Lot non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, batch });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const data = BatchUpdateSchema.parse(body);

    const existing = await prisma.productionBatch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Lot non trouvé" },
        { status: 404 }
      );
    }

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: "Impossible de modifier un lot terminé ou annulé" },
        { status: 422 }
      );
    }

    // Validate status transitions
    if (data.status) {
      const validTransitions: Record<string, string[]> = {
        PLANNED: ["CANCELLED"],
        IN_PROGRESS: ["ON_HOLD", "COMPLETED"],
        ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
      };
      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(data.status) && data.status !== existing.status) {
        return NextResponse.json(
          { success: false, error: `Transition ${existing.status} → ${data.status} non autorisée` },
          { status: 422 }
        );
      }
    }

    const batch = await prisma.productionBatch.update({
      where: { id },
      data: {
        plannedQty: data.plannedQty,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined,
        laborCost: data.laborCost,
        overheadCost: data.overheadCost,
        notes: data.notes,
        status: data.status,
      },
      include: { model: true },
    });

    return NextResponse.json({ success: true, batch });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: err.issues },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const batch = await prisma.productionBatch.findUnique({ where: { id } });
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Lot non trouvé" },
        { status: 404 }
      );
    }

    if (batch.status !== "PLANNED") {
      return NextResponse.json(
        { success: false, error: "Seuls les lots planifiés peuvent être supprimés" },
        { status: 422 }
      );
    }

    await prisma.productionBatch.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
