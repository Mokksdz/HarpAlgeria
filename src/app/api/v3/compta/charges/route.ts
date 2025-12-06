import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";

const ChargeCreateSchema = z.object({
  category: z.enum([
    "ATELIER",
    "SHOOTING",
    "ADS",
    "INFLUENCER",
    "TRANSPORT",
    "LABOR",
    "RENT",
    "UTILITIES",
    "PACKAGING",
    "SAMPLES",
    "OTHER",
  ]),
  scope: z.enum(["GLOBAL", "COLLECTION", "MODEL"]),
  amount: z.number().positive("Montant requis"),
  description: z.string().optional(),
  modelId: z.string().optional(),
  collectionId: z.string().optional(),
  date: z.string().datetime().optional(),
  platform: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const scope = searchParams.get("scope");
    const modelId = searchParams.get("modelId");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (scope) where.scope = scope;
    if (modelId) where.modelId = modelId;

    const [items, total] = await Promise.all([
      prisma.charge.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          model: { select: { id: true, sku: true, name: true } },
        },
      }),
      prisma.charge.count({ where }),
    ]);

    // Stats by category
    const stats = await prisma.charge.groupBy({
      by: ["category"],
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const data = ChargeCreateSchema.parse(body);

    // Validate scope requirements
    if (data.scope === "MODEL" && !data.modelId) {
      return NextResponse.json(
        { success: false, error: "modelId requis pour scope MODEL" },
        { status: 400 },
      );
    }
    if (data.scope === "COLLECTION" && !data.collectionId) {
      return NextResponse.json(
        { success: false, error: "collectionId requis pour scope COLLECTION" },
        { status: 400 },
      );
    }

    // Generate charge number
    const year = new Date().getFullYear();
    const prefix = `CHG-${year}-`;
    const last = await prisma.charge.findFirst({
      where: { chargeNumber: { startsWith: prefix } },
      orderBy: { chargeNumber: "desc" },
      select: { chargeNumber: true },
    });
    let seq = 1;
    if (last?.chargeNumber) {
      const parts = last.chargeNumber.split("-");
      seq = parseInt(parts[parts.length - 1]) + 1;
    }
    const chargeNumber = `${prefix}${seq.toString().padStart(4, "0")}`;

    const charge = await prisma.charge.create({
      data: {
        chargeNumber,
        category: data.category,
        scope: data.scope,
        amount: data.amount,
        description: data.description || "",
        modelId: data.modelId || null,
        collectionId: data.collectionId || null,
        date: data.date ? new Date(data.date) : new Date(),
        platform: data.platform,
        notes: data.notes,
      },
      include: { model: true },
    });

    return NextResponse.json({ success: true, charge }, { status: 201 });
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
