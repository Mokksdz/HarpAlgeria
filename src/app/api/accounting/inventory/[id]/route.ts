import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single inventory item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        bomItems: {
          include: { model: true },
        },
        purchaseItems: {
          include: { purchase: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 },
    );
  }
}

// PUT update inventory item
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        unit: data.unit,
        threshold: data.threshold,
        color: data.color,
        supplier: data.supplier,
        notes: data.notes,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 },
    );
  }
}

// DELETE inventory item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if item is used in any BOM
    const bomCount = await prisma.bomItem.count({
      where: { inventoryItemId: id },
    });

    if (bomCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete: item is used in Bill of Materials" },
        { status: 400 },
      );
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 },
    );
  }
}
