import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePagination, paginatedResponse } from "@/lib/pagination";

// GET all inventory items with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip } = parsePagination(searchParams);
    const type = searchParams.get("type");
    const lowStock = searchParams.get("lowStock") === "true";
    const search = searchParams.get("search");

    const where: {
      type?: string;
      OR?: Array<{ name?: { contains: string }; sku?: { contains: string } }>;
    } = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    // For low stock, we need to filter after fetching (SQLite limitation)
    if (lowStock) {
      // Get all items with threshold and filter
      let items = await prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { bomItems: true, purchaseItems: true },
          },
        },
      });

      items = items.filter(
        (item) => item.threshold !== null && item.quantity <= item.threshold,
      );

      const total = items.length;
      const paginatedItems = items.slice(skip, skip + pageSize);

      const itemsWithValue = paginatedItems.map((item) => ({
        ...item,
        totalValue: Number(item.quantity) * Number(item.averageCost),
      }));

      return NextResponse.json(
        paginatedResponse(itemsWithValue, page, pageSize, total),
      );
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { bomItems: true, purchaseItems: true },
          },
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Calculate total value for each item
    const itemsWithValue = items.map((item) => ({
      ...item,
      totalValue: Number(item.quantity) * Number(item.averageCost),
    }));

    return NextResponse.json(
      paginatedResponse(itemsWithValue, page, pageSize, total),
    );
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

// POST create new inventory item
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.sku || !data.name || !data.type || !data.unit) {
      return NextResponse.json(
        { error: "SKU, name, type and unit are required" },
        { status: 400 },
      );
    }

    // Check if SKU already exists
    const existing = await prisma.inventoryItem.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 400 },
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        sku: data.sku,
        name: data.name,
        type: data.type, // FABRIC | ACCESSORY | PACKAGING | FINISHED
        unit: data.unit, // METER | ROLL | PIECE
        quantity: data.quantity || 0,
        reserved: 0,
        available: data.quantity || 0,
        averageCost: data.averageCost || 0,
        lastCost: data.unitCost || data.lastCost || 0,
        totalValue: (data.quantity || 0) * (data.averageCost || 0),
        threshold: data.threshold,
        color: data.color,
        supplierId: data.supplierId,
        notes: data.notes,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 },
    );
  }
}
