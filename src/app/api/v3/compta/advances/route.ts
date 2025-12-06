import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";

const AdvanceCreateSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
  amount: z.number().positive("Montant requis"),
  paymentMethod: z.enum(["CASH", "CHECK", "TRANSFER", "CCP", "CARD"]),
  paymentDate: z.string().datetime(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

async function generateAdvanceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AVA-${year}-`;
  const last = await prisma.supplierAdvance.findFirst({
    where: { advanceNumber: { startsWith: prefix } },
    orderBy: { advanceNumber: "desc" },
    select: { advanceNumber: true },
  });
  let seq = 1;
  if (last?.advanceNumber) {
    const parts = last.advanceNumber.split("-");
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
    const supplierId = searchParams.get("supplierId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const [items, total] = await Promise.all([
      prisma.supplierAdvance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.supplierAdvance.count({ where }),
    ]);

    // Stats
    const stats = await prisma.supplierAdvance.aggregate({
      _sum: { amount: true, amountUsed: true },
    });

    return NextResponse.json({
      success: true,
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        totalAdvances: stats._sum.amount || 0,
        totalUsed: stats._sum.amountUsed || 0,
        totalRemaining: Number(stats._sum.amount || 0) - Number(stats._sum.amountUsed || 0),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const data = AdvanceCreateSchema.parse(body);

    const advanceNumber = await generateAdvanceNumber();

    const advance = await prisma.supplierAdvance.create({
      data: {
        advanceNumber,
        supplierId: data.supplierId,
        amount: data.amount,
        amountUsed: 0,
        amountRemaining: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        reference: data.reference,
        notes: data.notes,
        status: "PENDING",
      },
      include: { supplier: true },
    });

    return NextResponse.json({ success: true, advance }, { status: 201 });
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
