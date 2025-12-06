/**
 * HARP Comptabilité V3 - Purchases Routes
 * GET /api/v3/compta/purchases - List purchases with pagination
 * POST /api/v3/compta/purchases - Create new purchase (DRAFT)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import { z } from "zod";
import {
  PurchaseCreateSchema,
  PaginationSchema,
  PurchaseFilterSchema,
} from "@/lib/compta/schemas/purchase.schemas";
import {
  getPurchaseList,
  createPurchase,
} from "@/lib/compta/services/purchases-service";

/**
 * GET /api/v3/compta/purchases
 * List purchases with pagination and filters
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
    const filters = PurchaseFilterSchema.parse({
      status: searchParams.get("status") ?? undefined,
      supplierId: searchParams.get("supplierId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const result = await getPurchaseList(pagination, filters);

    return NextResponse.json({
      success: true,
      ...result,
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
 * POST /api/v3/compta/purchases
 * Create a new purchase in DRAFT status
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = await req.json();
    const data = PurchaseCreateSchema.parse(body);

    const purchase = await createPurchase(data);

    return NextResponse.json({ success: true, purchase }, { status: 201 });
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
    return handleApiError(err);
  }
}
