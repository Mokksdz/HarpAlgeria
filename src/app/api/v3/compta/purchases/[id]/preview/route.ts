/**
 * HARP Comptabilité V3 - Purchase Preview Route
 * POST /api/v3/compta/purchases/[id]/preview - Preview CUMP impact (non-destructive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth-helpers';
import { z } from 'zod';
import { PreviewReceiveSchema } from '@/lib/compta/schemas/purchase.schemas';
import { previewReceivePurchase } from '@/lib/compta/services/purchases-service';

/**
 * POST /api/v3/compta/purchases/[id]/preview
 * Preview the impact of receiving a purchase without modifying the database
 * Returns calculated CUMP changes for each item
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const body = await req.json();
    const data = PreviewReceiveSchema.parse(body);

    const preview = await previewReceivePurchase(id, data);

    return NextResponse.json({
      success: true,
      ...preview,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation échouée', details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return handleApiError(err);
  }
}
