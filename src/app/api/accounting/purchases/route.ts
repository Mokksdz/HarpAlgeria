import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all purchases
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate)
        (where.orderDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate)
        (where.orderDate as Record<string, Date>).lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        include: {
          supplier: true,
          items: { include: { inventoryItem: true } },
        },
        orderBy: { orderDate: "desc" },
      }),
      prisma.purchase.count({ where }),
    ]);

    return NextResponse.json({
      items: purchases,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 },
    );
  }
}

// Generate purchase number
async function generatePurchaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ACH-${year}-`;

  const last = await prisma.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: "desc" },
    select: { purchaseNumber: true },
  });

  let seq = 1;
  if (last?.purchaseNumber) {
    const lastSeq = parseInt(last.purchaseNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// POST create new purchase (DRAFT status - no stock update yet)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 },
      );
    }

    // Calculate subtotal and total
    const subtotal = data.items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0,
    );
    const taxAmount = data.taxAmount || 0;
    const shippingCost = data.shippingCost || 0;
    const totalAmount = subtotal + taxAmount + shippingCost;

    // Generate purchase number
    const purchaseNumber = await generatePurchaseNumber();

    // Determine initial status
    const autoReceive = data.autoReceive === true;
    const status = autoReceive ? "RECEIVED" : "DRAFT";

    // Create purchase with items
    const purchase = await prisma.purchase.create({
      data: {
        purchaseNumber,
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        subtotal,
        taxAmount,
        shippingCost,
        totalAmount,
        amountDue: totalAmount,
        currency: data.currency || "DZD",
        status,
        notes: data.notes,
        items: {
          create: data.items.map(
            (item: {
              inventoryItemId: string;
              quantity: number;
              unitPrice: number;
              unit?: string;
            }) => ({
              inventoryItemId: item.inventoryItemId,
              quantityOrdered: item.quantity,
              quantityReceived: autoReceive ? item.quantity : 0,
              unit: item.unit || "PIECE",
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            }),
          ),
        },
      },
      include: {
        items: { include: { inventoryItem: true } },
        supplier: true,
      },
    });

    // If autoReceive, update inventory immediately
    if (autoReceive) {
      await receiveInventory(purchase);
    }

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 },
    );
  }
}

// Helper function to receive inventory
async function receiveInventory(purchase: {
  id: string;
  purchaseNumber: string;
  items: Array<{
    inventoryItemId: string;
    quantityOrdered: number | { toNumber?(): number };
    unitPrice: number | { toNumber?(): number };
  }>;
}) {
  for (const item of purchase.items) {
    const inv = await prisma.inventoryItem.findUnique({
      where: { id: item.inventoryItemId },
    });

    if (inv) {
      const currentQty = Number(inv.quantity) || 0;
      const currentAvg = Number(inv.averageCost) || 0;
      const qty = Number(item.quantityOrdered);
      const price = Number(item.unitPrice);
      const newQty = currentQty + qty;
      const newAvg =
        newQty > 0 ? (currentQty * currentAvg + qty * price) / newQty : price;
      const newValue = newQty * newAvg;

      await prisma.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          quantity: newQty,
          available: newQty - (Number(inv.reserved) || 0),
          averageCost: newAvg,
          lastCost: price,
          totalValue: newValue,
          lastReceivedAt: new Date(),
        },
      });

      // Create inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: item.inventoryItemId,
          direction: "IN",
          type: "PURCHASE",
          quantity: qty,
          unitCost: price,
          balanceBefore: currentQty,
          balanceAfter: newQty,
          valueBefore: currentQty * currentAvg,
          valueAfter: newValue,
          avgCostBefore: currentAvg,
          avgCostAfter: newAvg,
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          notes: `Réception ${purchase.purchaseNumber}`,
        },
      });
    }
  }
}
