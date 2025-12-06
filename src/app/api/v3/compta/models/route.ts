import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";

const ModelCreateSchema = z.object({
  sku: z.string().min(1, "SKU requis"),
  name: z.string().min(1, "Nom requis"),
  collectionId: z.string().optional(),
  laborCost: z.number().min(0).default(0),
  otherCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).optional(),
  estimatedUnits: z.number().int().positive().default(100),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const collectionId = searchParams.get("collectionId");

    const where: Record<string, unknown> = {};
    if (collectionId) where.collectionId = collectionId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.model.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          collection: { select: { id: true, nameFr: true } },
          _count: { select: { bom: true, charges: true, batches: true } },
        },
      }),
      prisma.model.count({ where }),
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
    const data = ModelCreateSchema.parse(body);

    // Check SKU uniqueness
    const existing = await prisma.model.findUnique({
      where: { sku: data.sku },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Ce SKU existe déjà" },
        { status: 409 }
      );
    }

    const model = await prisma.model.create({
      data: {
        sku: data.sku,
        name: data.name,
        collectionId: data.collectionId || null,
        laborCost: data.laborCost,
        otherCost: data.otherCost,
        sellingPrice: data.sellingPrice,
        estimatedUnits: data.estimatedUnits,
        description: data.notes,
      },
      include: { collection: true },
    });

    return NextResponse.json({ success: true, model }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: err.issues },
        { status: 400 }
      );
    }
    return handleApiError(err);
  }
}
