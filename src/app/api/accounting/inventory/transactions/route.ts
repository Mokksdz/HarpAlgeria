import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET list inventory transactions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inventoryItemId = searchParams.get("inventoryItemId");
    const direction = searchParams.get("direction");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: {
      inventoryItemId?: string;
      direction?: string;
      type?: string;
    } = {};
    
    if (inventoryItemId) where.inventoryItemId = inventoryItemId;
    if (direction) where.direction = direction;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          inventoryItem: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
