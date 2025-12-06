import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Generate charge number
async function generateChargeNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CHG-${year}-`;
  
  const last = await prisma.charge.findFirst({
    where: { chargeNumber: { startsWith: prefix } },
    orderBy: { chargeNumber: "desc" },
    select: { chargeNumber: true },
  });

  let seq = 1;
  if (last?.chargeNumber) {
    const lastSeq = parseInt(last.chargeNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// GET list all charges
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const modelId = searchParams.get("modelId");
    const collectionId = searchParams.get("collectionId");

    const where: { category?: string; modelId?: string; collectionId?: string } = {};
    if (category) where.category = category;
    if (modelId) where.modelId = modelId;
    if (collectionId) where.collectionId = collectionId;

    const charges = await prisma.charge.findMany({
      where,
      include: {
        model: { select: { id: true, name: true } },
        collection: { select: { id: true, nameFr: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to expected format
    const mappedCharges = charges.map(c => ({
      ...c,
      currency: "DZD",
    }));

    // Calculate totals by category
    const byCategory = charges.reduce((acc: Record<string, number>, c) => {
      acc[c.category] = (acc[c.category] || 0) + Number(c.amount);
      return acc;
    }, {});

    return NextResponse.json({ 
      charges: mappedCharges, 
      byCategory,
      total: charges.reduce((sum, c) => sum + Number(c.amount), 0),
    });
  } catch (error) {
    console.error("Error fetching charges:", error);
    return NextResponse.json(
      { error: "Failed to fetch charges" },
      { status: 500 }
    );
  }
}

// POST create new charge
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.category || !data.description || !data.amount) {
      return NextResponse.json(
        { error: "category, description, and amount are required" },
        { status: 400 }
      );
    }

    // Generate charge number
    const chargeNumber = await generateChargeNumber();

    // Determine scope
    let scope = "GLOBAL";
    if (data.modelId) scope = "MODEL";
    else if (data.collectionId) scope = "COLLECTION";

    const charge = await prisma.charge.create({
      data: {
        chargeNumber,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        amount: parseFloat(data.amount),
        currency: data.currency || "DZD",
        date: data.date ? new Date(data.date) : new Date(),
        scope,
        modelId: data.modelId || null,
        collectionId: data.collectionId || null,
        vendor: data.vendor,
        invoiceRef: data.invoiceRef || data.reference,
        campaign: data.campaign,
        notes: data.notes,
      },
      include: {
        model: { select: { id: true, name: true } },
        collection: { select: { id: true, nameFr: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Charge",
        entityId: charge.id,
        after: JSON.stringify(charge),
      },
    });

    return NextResponse.json(charge, { status: 201 });
  } catch (error) {
    console.error("Error creating charge:", error);
    return NextResponse.json(
      { error: "Failed to create charge" },
      { status: 500 }
    );
  }
}
