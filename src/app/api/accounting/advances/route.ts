import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Generate advance number
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
    const lastSeq = parseInt(last.advanceNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// GET list all advances
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");

    const where: { supplierId?: string; status?: string } = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    const advances = await prisma.supplierAdvance.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totals = {
      total: advances.reduce((sum, a) => sum + Number(a.amount), 0),
      used: advances.reduce((sum, a) => sum + Number(a.amountUsed), 0),
      available: advances.reduce(
        (sum, a) => sum + Number(a.amountRemaining),
        0,
      ),
    };

    // Map to expected format for UI
    const mappedAdvances = advances.map((a) => ({
      ...a,
      date: a.paymentDate,
      currency: "DZD",
    }));

    return NextResponse.json({ advances: mappedAdvances, totals });
  } catch (error) {
    console.error("Error fetching advances:", error);
    return NextResponse.json(
      { error: "Failed to fetch advances" },
      { status: 500 },
    );
  }
}

// POST create new advance
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.supplierId || !data.amount || data.amount <= 0) {
      return NextResponse.json(
        { error: "supplierId and amount are required" },
        { status: 400 },
      );
    }

    // Generate advance number
    const advanceNumber = await generateAdvanceNumber();

    const amount = parseFloat(data.amount);
    const advance = await prisma.supplierAdvance.create({
      data: {
        advanceNumber,
        supplierId: data.supplierId,
        amount,
        amountUsed: 0,
        amountRemaining: amount,
        status: "PENDING",
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "SupplierAdvance",
        entityId: advance.id,
        after: JSON.stringify(advance),
      },
    });

    return NextResponse.json(advance, { status: 201 });
  } catch (error) {
    console.error("Error creating advance:", error);
    return NextResponse.json(
      { error: "Failed to create advance" },
      { status: 500 },
    );
  }
}
