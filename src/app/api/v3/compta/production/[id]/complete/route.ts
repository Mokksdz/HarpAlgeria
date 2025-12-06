/**
 * HARP Comptabilité V3 - Production Complete Route
 * POST /api/v3/compta/production/[id]/complete - Complete a batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth-helpers';
import { z } from 'zod';
import { CompleteBatchSchema } from '@/lib/compta/schemas/production.schemas';
import { completeProductionBatch } from '@/lib/compta/services/production-service';

/**
 * POST /api/v3/compta/production/[id]/complete
 * Complete a production batch and calculate final costs
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const data = CompleteBatchSchema.parse(body);

    const userId = (session.user as { id?: string })?.id;
    const result = await completeProductionBatch(id, data, userId);

    return NextResponse.json({
      success: true,
      batch: result.batch,
      costs: result.costs,
      message: `Lot terminé: ${result.batch.producedQty} unités produites, coût/unité: ${result.costs.costPerUnit} DZD`,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation échouée', details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (err instanceof Error) {
      if (err.message.includes('non trouvé')) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 404 }
        );
      }
      if (err.message.includes('statut') || err.message.includes('dépasse')) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 422 }
        );
      }
    }
    return handleApiError(err);
  }
}
