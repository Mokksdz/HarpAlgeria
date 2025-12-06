/**
 * Production Service - HARP Comptabilité V3
 * Handles production batch operations: create, preview, consume, complete
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  CreateBatchInput,
  CompleteBatchInput,
  BOMRequirement,
  ConsumptionPreview,
  BatchCostBreakdown,
} from "../schemas/production.schemas";

// =============================================================================
// TYPES
// =============================================================================

type BatchWithModel = Prisma.ProductionBatchGetPayload<{
  include: {
    model: {
      include: {
        bom: { include: { inventoryItem: true } };
      };
    };
    consumptions: true;
  };
}>;

type BatchListItem = Prisma.ProductionBatchGetPayload<{
  include: {
    model: { select: { id: true; sku: true; name: true } };
    _count: { select: { consumptions: true } };
  };
}>;

interface BatchFilters {
  status?: string;
  modelId?: string;
  search?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate batch number: LOT-YYYY-XXXX
 */
async function generateBatchNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LOT-${year}-`;

  const lastBatch = await prisma.productionBatch.findFirst({
    where: { batchNumber: { startsWith: prefix } },
    orderBy: { batchNumber: "desc" },
    select: { batchNumber: true },
  });

  let nextNumber = 1;
  if (lastBatch) {
    const parts = lastBatch.batchNumber.split("-");
    nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Calculate BOM requirements for a batch
 * requiredQty = bom.quantity × wasteFactor × plannedQty
 */
export function calculateBOMRequirements(
  bom: Array<{
    quantity: number | { toNumber?(): number };
    wasteFactor: number | { toNumber?(): number };
    inventoryItem: {
      id: string;
      sku: string;
      name: string;
      unit: string;
      available: number | { toNumber?(): number };
      averageCost: number | { toNumber?(): number };
    };
  }>,
  plannedQty: number,
): BOMRequirement[] {
  return bom.map((item) => {
    const required =
      Math.round(
        Number(item.quantity) * Number(item.wasteFactor) * plannedQty * 100,
      ) / 100;
    const available = Number(item.inventoryItem.available);
    const shortage = Math.max(
      0,
      Math.round((required - available) * 100) / 100,
    );
    const unitCost = Number(item.inventoryItem.averageCost);
    const totalCost = Math.round(required * unitCost * 100) / 100;

    return {
      inventoryItemId: item.inventoryItem.id,
      sku: item.inventoryItem.sku,
      name: item.inventoryItem.name,
      unit: item.inventoryItem.unit,
      bomQtyPerUnit: Number(item.quantity),
      wasteFactor: Number(item.wasteFactor),
      required,
      available,
      shortage,
      unitCost,
      totalCost,
      canConsume: shortage === 0,
    };
  });
}

/**
 * Calculate batch cost breakdown
 */
export function calculateBatchCosts(
  batch: { materialsCost: number; laborCost: number; overheadCost: number },
  model: { otherCost: number },
  producedQty: number,
): BatchCostBreakdown {
  const materialsCost = batch.materialsCost;
  const laborCost = batch.laborCost;
  const overheadCost = batch.overheadCost;
  const otherCost = model.otherCost * producedQty;
  const totalCost = materialsCost + laborCost + overheadCost + otherCost;
  const costPerUnit =
    producedQty > 0 ? Math.round((totalCost / producedQty) * 100) / 100 : 0;

  return {
    materialsCost,
    laborCost,
    overheadCost,
    otherCost,
    totalCost,
    costPerUnit,
  };
}

// =============================================================================
// LIST & DETAIL
// =============================================================================

/**
 * Get paginated list of production batches
 */
export async function getProductionList(
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
  filters: BatchFilters = {},
): Promise<{
  items: BatchListItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductionBatchWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.modelId) {
    where.modelId = filters.modelId;
  }

  if (filters.search) {
    where.OR = [
      { batchNumber: { contains: filters.search } },
      { model: { name: { contains: filters.search } } },
      { model: { sku: { contains: filters.search } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.productionBatch.findMany({
      where,
      include: {
        model: { select: { id: true, sku: true, name: true } },
        _count: { select: { consumptions: true } },
      },
      take: pageSize,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.productionBatch.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get batch detail with model, BOM, and consumptions
 */
export async function getProductionDetail(
  batchId: string,
): Promise<BatchWithModel | null> {
  return prisma.productionBatch.findUnique({
    where: { id: batchId },
    include: {
      model: {
        include: {
          bom: { include: { inventoryItem: true } },
        },
      },
      consumptions: true,
    },
  });
}

// =============================================================================
// CREATE
// =============================================================================

/**
 * Create a new production batch in PLANNED status
 */
export async function createProductionBatch(
  data: CreateBatchInput,
): Promise<BatchWithModel> {
  // Verify model exists
  const model = await prisma.model.findUnique({
    where: { id: data.modelId },
  });

  if (!model) {
    throw new Error("Modèle non trouvé");
  }

  const batchNumber = await generateBatchNumber();

  // Calculate initial labor cost from model if not provided
  const laborCost = data.laborCost || Number(model.laborCost) * data.plannedQty;

  const batch = await prisma.productionBatch.create({
    data: {
      batchNumber,
      modelId: data.modelId,
      plannedQty: data.plannedQty,
      producedQty: 0,
      wasteQty: 0,
      plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
      laborCost,
      overheadCost: data.overheadCost || 0,
      materialsCost: 0,
      totalCost: 0,
      costPerUnit: 0,
      status: "PLANNED",
      notes: data.notes,
    },
    include: {
      model: {
        include: {
          bom: { include: { inventoryItem: true } },
        },
      },
      consumptions: true,
    },
  });

  return batch;
}

// =============================================================================
// PREVIEW CONSUMPTION
// =============================================================================

/**
 * Preview material requirements for a batch (non-destructive)
 */
export async function previewProductionConsumption(
  batchId: string,
): Promise<ConsumptionPreview> {
  const batch = await prisma.productionBatch.findUnique({
    where: { id: batchId },
    include: {
      model: {
        include: {
          bom: { include: { inventoryItem: true } },
        },
      },
    },
  });

  if (!batch) {
    throw new Error("Lot non trouvé");
  }

  if (batch.status !== "PLANNED") {
    throw new Error(`Lot en statut ${batch.status}, preview non disponible`);
  }

  const requirements = calculateBOMRequirements(
    batch.model.bom,
    batch.plannedQty,
  );
  const hasShortage = requirements.some((r) => r.shortage > 0);
  const totalMaterialsCost = requirements.reduce(
    (sum, r) => sum + r.totalCost,
    0,
  );
  const estimatedCostPerUnit =
    batch.plannedQty > 0
      ? Math.round((totalMaterialsCost / batch.plannedQty) * 100) / 100
      : 0;

  return {
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    modelId: batch.model.id,
    modelSku: batch.model.sku,
    modelName: batch.model.name,
    plannedQty: batch.plannedQty,
    requirements,
    hasShortage,
    totalMaterialsCost: Math.round(totalMaterialsCost * 100) / 100,
    estimatedCostPerUnit,
    canProceed: !hasShortage,
  };
}

// =============================================================================
// CONSUME MATERIALS (START PRODUCTION)
// =============================================================================

interface ConsumeResult {
  success: true;
  batch: BatchWithModel;
  totalMaterialsCost: number;
  consumptions: Array<{
    inventoryItemId: string;
    sku: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
}

/**
 * Consume materials and start production - TRANSACTIONAL
 * 1. Validate batch status = PLANNED
 * 2. Check stock availability
 * 3. Deduct from inventory
 * 4. Create InventoryTransactions (OUT)
 * 5. Create BatchConsumptions
 * 6. Update batch: status = IN_PROGRESS, startedAt, materialsCost
 */
export async function consumeProductionMaterials(
  batchId: string,
  userId?: string,
): Promise<ConsumeResult> {
  return prisma.$transaction(async (tx) => {
    // Get batch with BOM
    const batch = await tx.productionBatch.findUnique({
      where: { id: batchId },
      include: {
        model: {
          include: {
            bom: { include: { inventoryItem: true } },
          },
        },
      },
    });

    if (!batch) {
      throw new Error("Lot non trouvé");
    }

    if (batch.status !== "PLANNED") {
      throw new Error(`Impossible de démarrer: lot en statut ${batch.status}`);
    }

    // Calculate requirements
    const requirements = calculateBOMRequirements(
      batch.model.bom,
      batch.plannedQty,
    );

    // Validate all stock available
    const shortages = requirements.filter((r) => r.shortage > 0);
    if (shortages.length > 0) {
      const shortageList = shortages
        .map((s) => `${s.sku}: manque ${s.shortage}`)
        .join(", ");
      throw new Error(`Stock insuffisant: ${shortageList}`);
    }

    let totalMaterialsCost = 0;
    const consumptionRecords: Array<{
      inventoryItemId: string;
      sku: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }> = [];

    // Process each BOM item
    for (const req of requirements) {
      const invItem = await tx.inventoryItem.findUnique({
        where: { id: req.inventoryItemId },
      });

      if (!invItem) continue;

      const itemCost = req.required * req.unitCost;
      totalMaterialsCost += itemCost;

      // Create BatchConsumption
      await tx.batchConsumption.create({
        data: {
          batchId,
          inventoryItemId: req.inventoryItemId,
          plannedQty: req.required,
          actualQty: req.required,
          unitCost: req.unitCost,
          totalCost: itemCost,
        },
      });

      // Update inventory
      const newQty = Number(invItem.quantity) - req.required;
      const newAvailable = Number(invItem.available) - req.required;
      const newTotalValue = newQty * Number(invItem.averageCost);

      await tx.inventoryItem.update({
        where: { id: req.inventoryItemId },
        data: {
          quantity: newQty,
          available: newAvailable,
          totalValue: newTotalValue,
        },
      });

      // Create InventoryTransaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: req.inventoryItemId,
          direction: "OUT",
          type: "PRODUCTION",
          quantity: req.required,
          unitCost: req.unitCost,
          balanceBefore: Number(invItem.quantity),
          balanceAfter: newQty,
          valueBefore: Number(invItem.totalValue),
          valueAfter: newTotalValue,
          avgCostBefore: Number(invItem.averageCost),
          avgCostAfter: Number(invItem.averageCost),
          referenceType: "BATCH",
          referenceId: batchId,
          createdBy: userId,
        },
      });

      consumptionRecords.push({
        inventoryItemId: req.inventoryItemId,
        sku: req.sku,
        quantity: req.required,
        unitCost: req.unitCost,
        totalCost: itemCost,
      });
    }

    // Update batch
    const totalCost =
      totalMaterialsCost + Number(batch.laborCost) + Number(batch.overheadCost);
    await tx.productionBatch.update({
      where: { id: batchId },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
        materialsCost: totalMaterialsCost,
        totalCost,
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: "CONSUME",
        entity: "ProductionBatch",
        entityId: batchId,
        userId,
        before: JSON.stringify({ status: "PLANNED" }),
        after: JSON.stringify({
          status: "IN_PROGRESS",
          materialsCost: totalMaterialsCost,
          consumptions: consumptionRecords.length,
        }),
        metadata: JSON.stringify({
          batchNumber: batch.batchNumber,
          modelSku: batch.model.sku,
          plannedQty: batch.plannedQty,
        }),
      },
    });

    // Get updated batch
    const updatedBatch = await tx.productionBatch.findUnique({
      where: { id: batchId },
      include: {
        model: {
          include: {
            bom: { include: { inventoryItem: true } },
          },
        },
        consumptions: true,
      },
    });

    return {
      success: true as const,
      batch: updatedBatch!,
      totalMaterialsCost,
      consumptions: consumptionRecords,
    };
  });
}

// =============================================================================
// COMPLETE BATCH
// =============================================================================

interface CompleteResult {
  success: true;
  batch: BatchWithModel;
  costs: BatchCostBreakdown;
}

/**
 * Complete production batch - calculate final costs
 */
export async function completeProductionBatch(
  batchId: string,
  data: CompleteBatchInput,
  userId?: string,
): Promise<CompleteResult> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id: batchId },
      include: {
        model: true,
        consumptions: true,
      },
    });

    if (!batch) {
      throw new Error("Lot non trouvé");
    }

    if (batch.status !== "IN_PROGRESS") {
      throw new Error(`Impossible de terminer: lot en statut ${batch.status}`);
    }

    if (data.producedQty <= 0) {
      throw new Error("La quantité produite doit être supérieure à 0");
    }

    if (data.producedQty + data.wasteQty > batch.plannedQty * 1.1) {
      throw new Error(
        "Quantité produite + déchets dépasse la quantité planifiée (+ 10% tolérance)",
      );
    }

    // Calculate final costs
    const costs = calculateBatchCosts(
      {
        materialsCost: Number(batch.materialsCost),
        laborCost: Number(batch.laborCost),
        overheadCost: Number(batch.overheadCost),
      },
      { otherCost: Number(batch.model.otherCost) },
      data.producedQty,
    );

    // Update batch
    await tx.productionBatch.update({
      where: { id: batchId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        producedQty: data.producedQty,
        wasteQty: data.wasteQty,
        totalCost: costs.totalCost,
        costPerUnit: costs.costPerUnit,
        notes: data.notes
          ? `${batch.notes || ""}\n${data.notes}`.trim()
          : batch.notes,
      },
    });

    // Update model produced units
    await tx.model.update({
      where: { id: batch.modelId },
      data: {
        producedUnits: { increment: data.producedQty },
      },
    });

    // Create finished product inventory entry (if model has linked inventoryItem)
    if (batch.model.inventoryItemId) {
      const finishedItem = await tx.inventoryItem.findUnique({
        where: { id: batch.model.inventoryItemId },
      });

      if (finishedItem) {
        // Calculate new CUMP for finished product
        const oldQty = Number(finishedItem.quantity);
        const oldValue = Number(finishedItem.totalValue);
        const addedQty = data.producedQty;
        const addedValue = costs.costPerUnit * addedQty;
        const newQty = oldQty + addedQty;
        const newValue = oldValue + addedValue;
        const newCUMP = newQty > 0 ? newValue / newQty : costs.costPerUnit;

        await tx.inventoryItem.update({
          where: { id: batch.model.inventoryItemId },
          data: {
            quantity: newQty,
            available: Number(finishedItem.available) + addedQty,
            totalValue: newValue,
            averageCost: Math.round(newCUMP * 100) / 100,
            lastCost: costs.costPerUnit,
          },
        });

        // Create IN transaction for finished product
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: batch.model.inventoryItemId,
            direction: "IN",
            type: "PRODUCTION",
            quantity: addedQty,
            unitCost: costs.costPerUnit,
            balanceBefore: oldQty,
            balanceAfter: newQty,
            valueBefore: oldValue,
            valueAfter: newValue,
            avgCostBefore: finishedItem.averageCost,
            avgCostAfter: Math.round(newCUMP * 100) / 100,
            referenceType: "BATCH",
            referenceId: batchId,
            createdBy: userId,
          },
        });
      }
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: "COMPLETE",
        entity: "ProductionBatch",
        entityId: batchId,
        userId,
        before: JSON.stringify({
          status: "IN_PROGRESS",
          producedQty: 0,
        }),
        after: JSON.stringify({
          status: "COMPLETED",
          producedQty: data.producedQty,
          wasteQty: data.wasteQty,
          totalCost: costs.totalCost,
          costPerUnit: costs.costPerUnit,
        }),
      },
    });

    // Get final batch
    const updatedBatch = await tx.productionBatch.findUnique({
      where: { id: batchId },
      include: {
        model: {
          include: {
            bom: { include: { inventoryItem: true } },
          },
        },
        consumptions: true,
      },
    });

    return {
      success: true as const,
      batch: updatedBatch!,
      costs,
    };
  });
}

// =============================================================================
// CANCEL BATCH
// =============================================================================

/**
 * Cancel a planned batch (not yet started)
 */
export async function cancelProductionBatch(
  batchId: string,
  reason?: string,
  userId?: string,
): Promise<{ success: true }> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error("Lot non trouvé");
    }

    if (batch.status !== "PLANNED") {
      throw new Error("Seuls les lots planifiés peuvent être annulés");
    }

    await tx.productionBatch.update({
      where: { id: batchId },
      data: {
        status: "CANCELLED",
        notes: reason
          ? `${batch.notes || ""}\nAnnulé: ${reason}`.trim()
          : batch.notes,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CANCEL",
        entity: "ProductionBatch",
        entityId: batchId,
        userId,
        before: JSON.stringify({ status: "PLANNED" }),
        after: JSON.stringify({ status: "CANCELLED", reason }),
      },
    });

    return { success: true as const };
  });
}
