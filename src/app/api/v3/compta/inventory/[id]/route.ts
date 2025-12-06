/**
 * HARP Comptabilité V3 - Inventory Item Routes
 * GET /api/v3/compta/inventory/[id] - Get item detail with transactions
 * PUT /api/v3/compta/inventory/[id] - Update item metadata
 * DELETE /api/v3/compta/inventory/[id] - Soft delete item
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";
import { getInventoryDetail } from "@/lib/compta/services/inventory-service";

const InventoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z
    .enum(["FABRIC", "ACCESSORY", "PACKAGING", "FINISHED", "TRIM", "LABEL"])
    .optional(),
  unit: z.enum(["METER", "ROLL", "PIECE", "KG", "LITER", "SET"]).optional(),
  minStock: z.number().min(0).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const item = await getInventoryDetail(id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, item });
  } catch (err) {
    return handleApiError(err);
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
    const data = InventoryUpdateSchema.parse(body);

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 },
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: err.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 },
      );
    }

    if (Number(item.quantity) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de supprimer un article avec du stock",
        },
        { status: 422 },
      );
    }

    // Soft delete by setting isActive = false
    await prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Article désactivé" });
  } catch (err) {
    return handleApiError(err);
  }
}
