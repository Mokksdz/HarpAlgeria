import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single model with full details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const model = await prisma.model.findUnique({
      where: { id },
      include: {
        bom: { include: { inventoryItem: true } },
        charges: true,
        collection: true,
      }
    });

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const estimatedUnits = model.estimatedUnits || 100;

    // Calculate detailed cost breakdown
    const fabricCost = model.bom
      .filter(item => item.inventoryItem.type === "FABRIC")
      .reduce((sum, item) => sum + (Number(item.quantity) * Number(item.wasteFactor) * (Number(item.inventoryItem.averageCost) || 0)), 0);

    const accessoryCost = model.bom
      .filter(item => item.inventoryItem.type === "ACCESSORY")
      .reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.inventoryItem.averageCost) || 0)), 0);

    const packagingBom = model.bom
      .filter(item => item.inventoryItem.type === "PACKAGING")
      .reduce((sum, item) => sum + (Number(item.quantity) * (Number(item.inventoryItem.averageCost) || 0)), 0);

    const packagingDirect = (Number(model.packagingBox) || 0) + (Number(model.packagingBag) || 0) +
      (Number(model.packagingLabel) || 0) + (Number(model.packagingTag) || 0) +
      (Number(model.packagingCard) || 0) + (Number(model.packagingOther) || 0);
    const packagingCost = packagingBom + packagingDirect;

    const chargesTotal = model.charges.reduce((sum, c) => sum + Number(c.amount), 0);
    const chargesPerUnit = chargesTotal / estimatedUnits;

    const totalCost = fabricCost + accessoryCost + packagingCost + 
      (Number(model.laborCost) || 0) + (Number(model.otherCost) || 0) + 
      (Number(model.returnMargin) || 150) + chargesPerUnit;

    return NextResponse.json({
      ...model,
      costBreakdown: {
        fabricCost: Math.round(fabricCost * 100) / 100,
        accessoryCost: Math.round(accessoryCost * 100) / 100,
        packagingCost: Math.round(packagingCost * 100) / 100,
        laborCost: Number(model.laborCost) || 0,
        otherCost: Number(model.otherCost) || 0,
        returnMargin: Number(model.returnMargin) || 150,
        chargesTotal,
        chargesPerUnit: Math.round(chargesPerUnit * 100) / 100,
        totalCostPerUnit: Math.round(totalCost * 100) / 100,
        margin: model.sellingPrice ? Math.round((Number(model.sellingPrice) - totalCost) * 100) / 100 : null,
        marginPercent: model.sellingPrice 
          ? Math.round(((Number(model.sellingPrice) - totalCost) / Number(model.sellingPrice) * 100) * 10) / 10
          : null,
        suggestedPrices: {
          margin30: Math.ceil((totalCost / 0.7) / 100) * 100,
          margin40: Math.ceil((totalCost / 0.6) / 100) * 100,
          margin50: Math.ceil((totalCost / 0.5) / 100) * 100,
        }
      }
    });
  } catch (error) {
    console.error("Error fetching model:", error);
    return NextResponse.json({ error: "Failed to fetch model" }, { status: 500 });
  }
}

// PUT update model
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const model = await prisma.model.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        image: data.image,
        sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : undefined,
        targetPrice: data.targetPrice ? parseFloat(data.targetPrice) : undefined,
        productId: data.productId,
        collectionId: data.collectionId,
      },
    });

    return NextResponse.json(model);
  } catch (error) {
    console.error("Error updating model:", error);
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}

// PATCH partial update model (for packaging, costs, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const updateData: Record<string, number | string | null | boolean> = {};
    
    // Packaging fields (new schema)
    if (data.packagingBox !== undefined) updateData.packagingBox = parseFloat(data.packagingBox) || 0;
    if (data.packagingBag !== undefined) updateData.packagingBag = parseFloat(data.packagingBag) || 0;
    if (data.packagingLabel !== undefined) updateData.packagingLabel = parseFloat(data.packagingLabel) || 0;
    if (data.packagingTag !== undefined) updateData.packagingTag = parseFloat(data.packagingTag) || 0;
    if (data.packagingCard !== undefined) updateData.packagingCard = parseFloat(data.packagingCard) || 0;
    if (data.packagingOther !== undefined) updateData.packagingOther = parseFloat(data.packagingOther) || 0;
    
    // Cost fields
    if (data.laborCost !== undefined) updateData.laborCost = parseFloat(data.laborCost) || 0;
    if (data.otherCost !== undefined) updateData.otherCost = parseFloat(data.otherCost) || 0;
    if (data.returnMargin !== undefined) updateData.returnMargin = parseFloat(data.returnMargin) || 150;
    if (data.sellingPrice !== undefined) updateData.sellingPrice = parseFloat(data.sellingPrice) || null;
    if (data.targetPrice !== undefined) updateData.targetPrice = parseFloat(data.targetPrice) || null;
    if (data.estimatedUnits !== undefined) updateData.estimatedUnits = parseInt(data.estimatedUnits) || 100;

    const model = await prisma.model.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(model);
  } catch (error) {
    console.error("Error patching model:", error);
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 });
  }
}

// DELETE model (soft delete by setting isActive to false)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.model.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting model:", error);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
