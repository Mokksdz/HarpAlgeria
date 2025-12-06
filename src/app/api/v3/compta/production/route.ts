import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";

const BatchCreateSchema = z.object({
  modelId: z.string().min(1, "Modèle requis"),
  plannedQty: z.number().int().positive("Quantité requise"),
  plannedDate: z.string().datetime().optional(),
  laborCost: z.number().min(0).default(0),
  overheadCost: z.number().min(0).default(0),
  notes: z.string().optional(),
});

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
    const parts = last.batchNumber.split("-");
    seq = parseInt(parts[parts.length - 1]) + 1;
  }
  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const modelId = searchParams.get("modelId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (modelId) where.modelId = modelId;

    const [items, total] = await Promise.all([
      prisma.productionBatch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          model: { select: { id: true, sku: true, name: true } },
          _count: { select: { consumptions: true } },
        },
      }),
      prisma.productionBatch.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const data = BatchCreateSchema.parse(body);

    // Check model exists
    const model = await prisma.model.findUnique({
      where: { id: data.modelId },
    });
    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle non trouvé" },
        { status: 404 },
      );
    }

    const batchNumber = await generateBatchNumber();

    const batch = await prisma.productionBatch.create({
      data: {
        batchNumber,
        modelId: data.modelId,
        plannedQty: data.plannedQty,
        producedQty: 0,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
        laborCost: data.laborCost,
        overheadCost: data.overheadCost,
        materialsCost: 0,
        totalCost: 0,
        status: "PLANNED",
        notes: data.notes,
      },
      include: { model: true },
    });

    return NextResponse.json({ success: true, batch }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: err.issues },
        { status: 400 },
      );
    }
    return handleApiError(err);
  }
}
