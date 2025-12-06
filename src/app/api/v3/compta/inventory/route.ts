/**
 * HARP Comptabilité V3 - Inventory Routes
 * GET /api/v3/compta/inventory - List inventory items with pagination
 * POST /api/v3/compta/inventory - Create new inventory item
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  InventoryItemCreateSchema,
  PaginationSchema,
  InventoryFilterSchema,
} from "@/lib/compta/schemas/purchase.schemas";
import {
  getInventoryList,
  createInventoryItem,
} from "@/lib/compta/services/inventory-service";

/**
 * GET /api/v3/compta/inventory
 * List inventory items with pagination and filters
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);

    // Parse pagination
    const pagination = PaginationSchema.parse({
      page: searchParams.get("page") ?? 1,
      pageSize: searchParams.get("pageSize") ?? searchParams.get("limit") ?? 20,
    });

    // Parse filters
    const filters = InventoryFilterSchema.parse({
      type: searchParams.get("type") ?? undefined,
      lowStock: searchParams.get("lowStock") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      isActive: searchParams.get("isActive") ?? undefined,
    });

    const result = await getInventoryList(pagination, filters);

    // Calculate totals
    const stats = await prisma.inventoryItem.aggregate({
      where: { isActive: true },
      _sum: { totalValue: true, quantity: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      ...result,
      stats: {
        totalValue: stats._sum.totalValue ?? 0,
        totalQuantity: stats._sum.quantity ?? 0,
        totalItems: stats._count,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres invalides",
          details: err.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    return handleApiError(err);
  }
}

/**
 * POST /api/v3/compta/inventory
 * Create a new inventory item
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const data = InventoryItemCreateSchema.parse(body);

    const item = await createInventoryItem(data);

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: err.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    // Handle duplicate SKU error
    if (err instanceof Error && err.message.includes("existe déjà")) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 409 },
      );
    }
    return handleApiError(err);
  }
}
