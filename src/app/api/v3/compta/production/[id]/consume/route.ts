import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";
import {
  previewProductionConsumption,
  consumeProductionMaterials,
} from "@/lib/compta/services/production-service";

// GET: Preview consumption
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const preview = await previewProductionConsumption(id);

    return NextResponse.json({
      success: true,
      batch: {
        id: preview.batchId,
        batchNumber: preview.batchNumber,
        plannedQty: preview.plannedQty,
        status: "PLANNED",
      },
      model: {
        id: preview.modelId,
        sku: preview.modelSku,
        name: preview.modelName,
      },
      requirements: preview.requirements,
      hasShortage: preview.hasShortage,
      totalMaterialsCost: preview.totalMaterialsCost,
      canProceed: preview.canProceed,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("non trouvé")) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 404 }
        );
      }
      if (err.message.includes("statut")) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 422 }
        );
      }
    }
    return handleApiError(err);
  }
}

// POST: Execute consumption and start production
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const userId = (session.user as { id?: string })?.id;
    const result = await consumeProductionMaterials(id, userId);

    return NextResponse.json({
      success: true,
      batch: result.batch,
      totalMaterialsCost: result.totalMaterialsCost,
      consumptions: result.consumptions,
      message: "Production démarrée, matières consommées",
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("non trouvé")) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 404 }
        );
      }
      if (err.message.includes("statut") || err.message.includes("insuffisant")) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 422 }
        );
      }
    }
    return handleApiError(err);
  }
}
