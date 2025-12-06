import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const ModelUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  collectionId: z.string().nullable().optional(),
  laborCost: z.number().min(0).optional(),
  otherCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  estimatedUnits: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const model = await prisma.model.findUnique({
      where: { id },
      include: {
        collection: true,
        bom: {
          include: { inventoryItem: true },
          orderBy: { createdAt: "asc" },
        },
        charges: { orderBy: { createdAt: "desc" } },
        batches: { take: 10, orderBy: { createdAt: "desc" } },
        snapshots: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const data = ModelUpdateSchema.parse(body);

    const model = await prisma.model.update({
      where: { id },
      data,
      include: { collection: true },
    });

    return NextResponse.json({ success: true, model });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: err.issues },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    // Check for dependencies
    const model = await prisma.model.findUnique({
      where: { id },
      include: {
        _count: { select: { batches: true } },
      },
    });

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle non trouvé" },
        { status: 404 },
      );
    }

    if (model._count.batches > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de supprimer un modèle avec des lots de production",
        },
        { status: 422 },
      );
    }

    await prisma.$transaction([
      prisma.bomItem.deleteMany({ where: { modelId: id } }),
      prisma.charge.deleteMany({ where: { modelId: id } }),
      prisma.costSnapshot.deleteMany({ where: { modelId: id } }),
      prisma.model.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
