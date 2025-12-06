import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BomItemWithInventory {
  id: string;
  quantity: number | { toNumber(): number };
  wasteFactor: number | { toNumber(): number };
  inventoryItem: {
    type: string;
    averageCost: number | { toNumber(): number } | null;
  };
}

interface ChargeItem {
  amount: number | { toNumber(): number };
  category: string;
}

// GET all models with cost calculation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const models = await prisma.model.findMany({
      where,
      include: {
        bom: {
          include: { inventoryItem: true }
        },
        charges: true,
        collection: true,
      },
      orderBy: { createdAt: "desc" }
    });

    // Calculate cost per unit for each model
    const modelsWithCost = models.map((model) => {
      const estimatedUnits = model.estimatedUnits || 100;

      // Fabric costs from BOM (type FABRIC)
      const fabricCost = model.bom
        .filter((b: BomItemWithInventory) => b.inventoryItem.type === "FABRIC")
        .reduce((sum: number, item: BomItemWithInventory) => 
          sum + (Number(item.quantity) * Number(item.wasteFactor) * (Number(item.inventoryItem.averageCost) || 0)), 0);

      // Accessory costs from BOM (type ACCESSORY)
      const accessoryCost = model.bom
        .filter((b: BomItemWithInventory) => b.inventoryItem.type === "ACCESSORY")
        .reduce((sum: number, item: BomItemWithInventory) => 
          sum + (Number(item.quantity) * (Number(item.inventoryItem.averageCost) || 0)), 0);

      // Packaging costs from BOM (type PACKAGING) + direct packaging
      const packagingBom = model.bom
        .filter((b: BomItemWithInventory) => b.inventoryItem.type === "PACKAGING")
        .reduce((sum: number, item: BomItemWithInventory) => 
          sum + (Number(item.quantity) * (Number(item.inventoryItem.averageCost) || 0)), 0);

      const packagingDirect = (Number(model.packagingBox) || 0) + (Number(model.packagingBag) || 0) + 
        (Number(model.packagingLabel) || 0) + (Number(model.packagingTag) || 0) + 
        (Number(model.packagingCard) || 0) + (Number(model.packagingOther) || 0);
      const packagingCost = packagingBom + packagingDirect;

      // Direct costs per unit from model config
      const laborCost = Number(model.laborCost) || 0;
      const otherCost = Number(model.otherCost) || 0;
      const returnMargin = Number(model.returnMargin) || 150;

      // Charges per unit (from Charge model)
      const chargesTotal = model.charges.reduce((sum: number, c: ChargeItem) => sum + Number(c.amount), 0);
      const chargesPerUnit = chargesTotal / estimatedUnits;

      const materialCost = fabricCost + accessoryCost + packagingCost;
      const totalCost = materialCost + laborCost + otherCost + returnMargin + chargesPerUnit;

      return {
        ...model,
        calculatedCost: {
          fabricCost: Math.round(fabricCost * 100) / 100,
          accessoryCost: Math.round(accessoryCost * 100) / 100,
          packagingCost: Math.round(packagingCost * 100) / 100,
          materialCost: Math.round(materialCost * 100) / 100,
          laborCost,
          otherCost,
          returnMargin,
          chargesTotal,
          chargesPerUnit: Math.round(chargesPerUnit * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          margin: model.sellingPrice ? Number(model.sellingPrice) - totalCost : null,
          marginPercent: model.sellingPrice 
            ? Math.round(((Number(model.sellingPrice) - totalCost) / Number(model.sellingPrice) * 100) * 10) / 10 
            : null,
          suggestedPrices: {
            margin30: Math.ceil((totalCost / 0.7) / 100) * 100,
            margin40: Math.ceil((totalCost / 0.6) / 100) * 100,
            margin50: Math.ceil((totalCost / 0.5) / 100) * 100,
          },
        }
      };
    });

    return NextResponse.json(modelsWithCost);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

// POST create new model
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.sku || !data.name) {
      return NextResponse.json(
        { error: "SKU and name are required" },
        { status: 400 }
      );
    }

    // Check if SKU exists
    const existing = await prisma.model.findUnique({
      where: { sku: data.sku }
    });

    if (existing) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 }
      );
    }

    const model = await prisma.model.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        image: data.image,
        collectionId: data.collectionId || null,
        productId: data.productId || null,
        estimatedUnits: data.estimatedUnits ? parseInt(data.estimatedUnits) : 100,
        targetPrice: data.targetPrice ? parseFloat(data.targetPrice) : null,
        sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
        laborCost: data.laborCost ? parseFloat(data.laborCost) : 0,
        otherCost: data.otherCost ? parseFloat(data.otherCost) : 0,
        returnMargin: data.returnMargin !== undefined ? parseFloat(data.returnMargin) : 150,
        packagingBox: data.packagingBox ? parseFloat(data.packagingBox) : 0,
        packagingBag: data.packagingBag ? parseFloat(data.packagingBag) : 0,
        packagingLabel: data.packagingLabel ? parseFloat(data.packagingLabel) : 0,
        packagingTag: data.packagingTag ? parseFloat(data.packagingTag) : 0,
        packagingCard: data.packagingCard ? parseFloat(data.packagingCard) : 0,
        packagingOther: data.packagingOther ? parseFloat(data.packagingOther) : 0,
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("Error creating model:", error);
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 }
    );
  }
}
