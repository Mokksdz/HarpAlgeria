import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Generate batch number
async function generateBatchNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LOT-${year}-`;
  
  const last = await prisma.productionBatch.findFirst({
    where: { batchNumber: { startsWith: prefix } },
    orderBy: { batchNumber: "desc" },
    select: { batchNumber: true },
  });

  let seq = 1;
  if (last?.batchNumber) {
    const lastSeq = parseInt(last.batchNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// GET all production batches
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const modelId = searchParams.get("modelId");

    const where: { status?: string; modelId?: string } = {};
    if (status) where.status = status;
    if (modelId) where.modelId = modelId;

    const batches = await prisma.productionBatch.findMany({
      where,
      include: {
        model: {
          include: {
            bom: {
              include: { inventoryItem: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Add material requirements check for each batch
    const batchesWithAvailability = await Promise.all(
      batches.map(async (batch) => {
        const availability = await checkMaterialAvailability(
          batch.modelId,
          batch.plannedQty
        );
        return { ...batch, availability };
      })
    );

    return NextResponse.json(batchesWithAvailability);
  } catch (error) {
    console.error("Error fetching production batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch production batches" },
      { status: 500 }
    );
  }
}

// POST create new production batch
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const plannedQty = data.plannedQty || data.batchSize;
    if (!data.modelId || !plannedQty || plannedQty < 1) {
      return NextResponse.json(
        { error: "modelId and plannedQty are required" },
        { status: 400 }
      );
    }

    // Check if model exists
    const model = await prisma.model.findUnique({
      where: { id: data.modelId },
      include: {
        bom: { include: { inventoryItem: true } }
      }
    });

    if (!model) {
      return NextResponse.json(
        { error: "Model not found" },
        { status: 404 }
      );
    }

    // Check material availability
    const availability = await checkMaterialAvailability(
      data.modelId,
      plannedQty
    );

    if (!availability.canProduce && !data.allowInsufficient) {
      return NextResponse.json(
        { 
          error: "Insufficient materials",
          details: availability.shortages
        },
        { status: 400 }
      );
    }

    // Generate batch number
    const batchNumber = await generateBatchNumber();

    // Create the batch
    const batch = await prisma.productionBatch.create({
      data: {
        batchNumber,
        modelId: data.modelId,
        plannedQty,
        status: data.status || "PLANNED",
        laborCost: data.laborCost || 0,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
        notes: data.notes
      },
      include: {
        model: {
          include: { bom: { include: { inventoryItem: true } } }
        }
      }
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Error creating production batch:", error);
    return NextResponse.json(
      { error: "Failed to create production batch" },
      { status: 500 }
    );
  }
}

// Helper: Check material availability for a model batch
async function checkMaterialAvailability(modelId: string, plannedQty: number) {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: {
      bom: { include: { inventoryItem: true } }
    }
  });

  if (!model || !model.bom) {
    return { canProduce: false, shortages: [], materials: [] };
  }

  const materials: Array<{
    inventoryItemId: string;
    name: string;
    sku: string;
    required: number;
    available: number;
    sufficient: boolean;
  }> = [];

  const shortages: Array<{
    inventoryItemId: string;
    name: string;
    required: number;
    available: number;
    shortage: number;
  }> = [];

  for (const bomItem of model.bom) {
    const required = Number(bomItem.quantity) * Number(bomItem.wasteFactor) * plannedQty;
    const available = Number(bomItem.inventoryItem.available);
    const sufficient = available >= required;

    materials.push({
      inventoryItemId: bomItem.inventoryItemId,
      name: bomItem.inventoryItem.name,
      sku: bomItem.inventoryItem.sku,
      required: Math.round(required * 100) / 100,
      available: Number(available),
      sufficient
    });

    if (!sufficient) {
      shortages.push({
        inventoryItemId: bomItem.inventoryItemId,
        name: bomItem.inventoryItem.name,
        required: Math.round(required * 100) / 100,
        available: Number(available),
        shortage: Math.round((required - available) * 100) / 100
      });
    }
  }

  return {
    canProduce: shortages.length === 0,
    shortages,
    materials
  };
}
