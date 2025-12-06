import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const BomItemSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.number().positive(),
  wasteFactor: z.number().min(1).max(2).default(1.05),
  notes: z.string().optional(),
});

// GET: List BOM items for model
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
        bom: {
          include: { inventoryItem: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle non trouvé" },
        { status: 404 },
      );
    }

    // Calculate total BOM cost
    let totalCost = 0;
    const bomWithCosts = model.bom.map((item) => {
      const cost =
        Number(item.quantity) *
        Number(item.wasteFactor) *
        Number(item.inventoryItem.averageCost);
      totalCost += cost;
      return {
        ...item,
        unitCost: item.inventoryItem.averageCost,
        lineCost: Math.round(cost * 100) / 100,
      };
    });

    return NextResponse.json({
      success: true,
      modelId: id,
      modelName: model.name,
      bom: bomWithCosts,
      totalCost: Math.round(totalCost * 100) / 100,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// POST: Add item to BOM
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const data = BomItemSchema.parse(body);

    // Check model exists
    const model = await prisma.model.findUnique({ where: { id } });
    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle non trouvé" },
        { status: 404 },
      );
    }

    // Check inventory item exists
    const invItem = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });
    if (!invItem) {
      return NextResponse.json(
        { success: false, error: "Article inventaire non trouvé" },
        { status: 404 },
      );
    }

    // Check for duplicate
    const existing = await prisma.bomItem.findFirst({
      where: { modelId: id, inventoryItemId: data.inventoryItemId },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Cet article est déjà dans la nomenclature" },
        { status: 409 },
      );
    }

    const bomItem = await prisma.bomItem.create({
      data: {
        modelId: id,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        wasteFactor: data.wasteFactor,
        notes: data.notes,
      },
      include: { inventoryItem: true },
    });

    return NextResponse.json({ success: true, bomItem }, { status: 201 });
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

// DELETE: Remove item from BOM
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const bomItemId = searchParams.get("bomItemId");

    if (!bomItemId) {
      return NextResponse.json(
        { success: false, error: "bomItemId requis" },
        { status: 400 },
      );
    }

    await prisma.bomItem.delete({ where: { id: bomItemId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
