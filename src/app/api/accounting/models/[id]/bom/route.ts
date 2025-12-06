import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET BOM for a model
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bom = await prisma.bomItem.findMany({
      where: { modelId: id },
      include: { inventoryItem: true },
      orderBy: { createdAt: "asc" }
    });

    // Add calculated cost per item
    const bomWithCosts = bom.map(item => ({
      ...item,
      costPerUnit: Number(item.quantity) * (Number(item.inventoryItem.averageCost) || 0)
    }));

    const totalMaterialCost = bomWithCosts.reduce((sum, item) => sum + item.costPerUnit, 0);

    return NextResponse.json({
      items: bomWithCosts,
      totalMaterialCost
    });
  } catch (error) {
    console.error("Error fetching BOM:", error);
    return NextResponse.json(
      { error: "Failed to fetch BOM" },
      { status: 500 }
    );
  }
}

// POST add item to BOM
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (!data.inventoryItemId || !data.quantity) {
      return NextResponse.json(
        { error: "Inventory item and quantity are required" },
        { status: 400 }
      );
    }

    // Check if item already in BOM
    const existing = await prisma.bomItem.findFirst({
      where: {
        modelId: id,
        inventoryItemId: data.inventoryItemId
      }
    });

    if (existing) {
      // Update quantity instead of creating duplicate
      const updated = await prisma.bomItem.update({
        where: { id: existing.id },
        data: { quantity: data.quantity, notes: data.notes },
        include: { inventoryItem: true }
      });
      return NextResponse.json(updated);
    }

    const bomItem = await prisma.bomItem.create({
      data: {
        modelId: id,
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        notes: data.notes,
      },
      include: { inventoryItem: true }
    });

    return NextResponse.json(bomItem, { status: 201 });
  } catch (error) {
    console.error("Error adding BOM item:", error);
    return NextResponse.json(
      { error: "Failed to add BOM item" },
      { status: 500 }
    );
  }
}

// DELETE remove item from BOM
export async function DELETE(
  req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const bomItemId = searchParams.get("bomItemId");

    if (!bomItemId) {
      return NextResponse.json(
        { error: "BOM item ID is required" },
        { status: 400 }
      );
    }

    await prisma.bomItem.delete({
      where: { id: bomItemId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting BOM item:", error);
    return NextResponse.json(
      { error: "Failed to delete BOM item" },
      { status: 500 }
    );
  }
}
