// =============================================================================
// HARP ACCOUNTING - PRODUCTION SERVICE
// Service complet pour la gestion de la production
// =============================================================================

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { BatchStatus, TxDirection, TxType } from "../constants";
import { createInventoryMovement, checkStockAvailability } from "./inventory.service";

// Types
export interface BatchCreateInput {
  modelId: string;
  plannedQty: number;
  plannedDate?: Date;
  laborCost?: number;
  overheadCost?: number;
  notes?: string;
  createdBy?: string;
}

export interface ConsumptionInput {
  inventoryItemId: string;
  quantity: number;
}

export interface BatchConsumptionPreview {
  batch: {
    id: string;
    batchNumber: string;
    model: { id: string; name: string; sku: string };
    plannedQty: number;
  };
  materials: Array<{
    inventoryItemId: string;
    name: string;
    sku: string;
    requiredQty: number;
    availableQty: number;
    shortage: number;
    unitCost: number;
    totalCost: number;
  }>;
  summary: {
    totalMaterialsCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    costPerUnit: number;
    canProduce: boolean;
    maxProducible: number;
  };
}

// =============================================================================
// GÉNÉRATION NUMÉROS
// =============================================================================

async function generateBatchNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LOT-${year}-`;

  const last = await prisma.productionBatch.findFirst({
    where: { batchNumber: { startsWith: prefix } },
    orderBy: { batchNumber: "desc" },
    select: { batchNumber: true },
  });

  let seq = 1;
  if (last?.batchNumber) {
    const lastSeq = parseInt(last.batchNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// =============================================================================
// CRÉATION LOT
// =============================================================================

/**
 * Crée un nouveau lot de production
 */
export async function createProductionBatch(input: BatchCreateInput): Promise<any> {
  return prisma.$transaction(async (tx) => {
    // Vérifier que le modèle existe
    const model = await tx.model.findUnique({
      where: { id: input.modelId },
      include: {
        bom: {
          include: { inventoryItem: true },
        },
      },
    });

    if (!model) {
      throw new Error("Modèle non trouvé");
    }

    // Générer le numéro de lot
    const batchNumber = await generateBatchNumber();

    // Calculer les coûts prévisionnels
    let materialsCost = 0;
    const consumptions = [];

    for (const bomItem of model.bom) {
      const requiredQty = Number(bomItem.quantity) * Number(bomItem.wasteFactor) * input.plannedQty;
      const itemCost = requiredQty * Number(bomItem.inventoryItem.averageCost);
      materialsCost += itemCost;

      consumptions.push({
        inventoryItemId: bomItem.inventoryItemId,
        plannedQty: requiredQty,
        actualQty: 0,
        unitCost: Number(bomItem.inventoryItem.averageCost),
        totalCost: itemCost,
      });
    }

    const laborCost = input.laborCost || Number(model.laborCost) * input.plannedQty;
    const overheadCost = input.overheadCost || 0;
    const totalCost = materialsCost + laborCost + overheadCost;
    const costPerUnit = input.plannedQty > 0 ? totalCost / input.plannedQty : 0;

    // Créer le lot
    const batch = await tx.productionBatch.create({
      data: {
        batchNumber,
        modelId: input.modelId,
        plannedQty: input.plannedQty,
        producedQty: 0,
        wasteQty: 0,
        status: BatchStatus.PLANNED,
        materialsCost,
        laborCost,
        overheadCost,
        totalCost,
        costPerUnit,
        plannedDate: input.plannedDate,
        notes: input.notes,
        createdBy: input.createdBy,
        consumptions: {
          create: consumptions,
        },
      },
      include: {
        model: true,
        consumptions: true,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "ProductionBatch",
        entityId: batch.id,
        after: JSON.stringify(batch),
        userId: input.createdBy,
      },
    });

    return batch;
  });
}

// =============================================================================
// PREVIEW CONSOMMATION
// =============================================================================

/**
 * Génère un aperçu de la consommation de matières pour un lot
 */
export async function previewConsumption(batchId: string): Promise<BatchConsumptionPreview> {
  const batch = await prisma.productionBatch.findUnique({
    where: { id: batchId },
    include: {
      model: {
        include: {
          bom: {
            include: { inventoryItem: true },
          },
        },
      },
      consumptions: true,
    },
  });

  if (!batch) {
    throw new Error("Lot non trouvé");
  }

  const materials = [];
  let totalMaterialsCost = 0;
  let canProduce = true;
  let maxProducible = batch.plannedQty;

  for (const bomItem of batch.model.bom) {
    const requiredQty = Number(bomItem.quantity) * Number(bomItem.wasteFactor) * batch.plannedQty;
    const inv = bomItem.inventoryItem;
    const shortage = Math.max(0, requiredQty - Number(inv.available));
    const totalCost = requiredQty * Number(inv.averageCost);

    if (shortage > 0) {
      canProduce = false;
      // Calculer combien on peut produire
      const possibleWithStock = Math.floor(
        Number(inv.available) / (Number(bomItem.quantity) * Number(bomItem.wasteFactor))
      );
      maxProducible = Math.min(maxProducible, possibleWithStock);
    }

    materials.push({
      inventoryItemId: inv.id,
      name: inv.name,
      sku: inv.sku,
      requiredQty,
      availableQty: Number(inv.available),
      shortage,
      unitCost: Number(inv.averageCost),
      totalCost,
    });

    totalMaterialsCost += totalCost;
  }

  const laborCost = Number(batch.laborCost);
  const overheadCost = Number(batch.overheadCost);
  const totalCost = totalMaterialsCost + laborCost + overheadCost;
  const costPerUnit = batch.plannedQty > 0 ? totalCost / batch.plannedQty : 0;

  return {
    batch: {
      id: batch.id,
      batchNumber: batch.batchNumber,
      model: {
        id: batch.model.id,
        name: batch.model.name,
        sku: batch.model.sku,
      },
      plannedQty: batch.plannedQty,
    },
    materials,
    summary: {
      totalMaterialsCost,
      laborCost,
      overheadCost,
      totalCost,
      costPerUnit,
      canProduce,
      maxProducible: Math.max(0, maxProducible),
    },
  };
}

// =============================================================================
// DÉMARRER PRODUCTION
// =============================================================================

/**
 * Démarre un lot de production
 */
export async function startBatch(batchId: string): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error("Lot non trouvé");
    }

    if (batch.status !== BatchStatus.PLANNED) {
      throw new Error("Seuls les lots planifiés peuvent être démarrés");
    }

    const updated = await tx.productionBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: { model: true },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "ProductionBatch",
        entityId: batchId,
        before: JSON.stringify({ status: batch.status }),
        after: JSON.stringify({ status: BatchStatus.IN_PROGRESS }),
      },
    });

    return updated;
  });
}

// =============================================================================
// CONSOMMER MATIÈRES
// =============================================================================

/**
 * Consomme les matières premières pour un lot de production
 * Déduit les quantités du stock selon la BOM
 */
export async function consumeProductionBatch(
  batchId: string,
  actualConsumptions?: ConsumptionInput[],
  createdBy?: string
): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id: batchId },
      include: {
        model: {
          include: {
            bom: {
              include: { inventoryItem: true },
            },
          },
        },
        consumptions: true,
      },
    });

    if (!batch) {
      throw new Error("Lot non trouvé");
    }

    if (batch.status === BatchStatus.PLANNED) {
      throw new Error("Le lot doit d'abord être démarré");
    }

    if (batch.status === BatchStatus.COMPLETED) {
      throw new Error("Le lot est déjà terminé");
    }

    // Déterminer les quantités à consommer
    const toConsume: Map<string, number> = new Map();

    if (actualConsumptions && actualConsumptions.length > 0) {
      // Consommations personnalisées
      for (const c of actualConsumptions) {
        toConsume.set(c.inventoryItemId, c.quantity);
      }
    } else {
      // Consommations selon BOM
      for (const bomItem of batch.model.bom) {
        const requiredQty = Number(bomItem.quantity) * Number(bomItem.wasteFactor) * batch.plannedQty;
        toConsume.set(bomItem.inventoryItemId, requiredQty);
      }
    }

    // Vérifier disponibilité
    const items = Array.from(toConsume.entries()).map(([id, qty]) => ({
      inventoryItemId: id,
      quantity: qty,
    }));

    const availability = await checkStockAvailability(items);
    if (!availability.available) {
      const shortages = availability.details
        .filter((d) => d.shortage > 0)
        .map((d) => `${d.name}: manque ${d.shortage}`)
        .join(", ");
      throw new Error(`Stock insuffisant: ${shortages}`);
    }

    // Consommer les matières
    let actualMaterialsCost = 0;

    for (const [inventoryItemId, quantity] of toConsume) {
      const inv = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      if (!inv) continue;

      // Créer le mouvement de sortie
      await createInventoryMovement(
        {
          inventoryItemId,
          direction: TxDirection.OUT,
          type: TxType.PRODUCTION,
          quantity,
          unitCost: Number(inv.averageCost),
          referenceType: "BATCH",
          referenceId: batch.id,
          notes: `Production lot ${batch.batchNumber}`,
          createdBy,
        },
        tx
      );

      actualMaterialsCost += quantity * Number(inv.averageCost);

      // Mettre à jour la consommation
      const consumption = batch.consumptions.find(
        (c) => c.inventoryItemId === inventoryItemId
      );
      if (consumption) {
        await tx.batchConsumption.update({
          where: { id: consumption.id },
          data: {
            actualQty: quantity,
            unitCost: Number(inv.averageCost),
            totalCost: quantity * Number(inv.averageCost),
          },
        });
      }
    }

    // Mettre à jour les coûts du lot
    const totalCost = actualMaterialsCost + Number(batch.laborCost) + Number(batch.overheadCost);
    const costPerUnit = batch.plannedQty > 0 ? totalCost / batch.plannedQty : 0;

    const updated = await tx.productionBatch.update({
      where: { id: batchId },
      data: {
        materialsCost: actualMaterialsCost,
        totalCost,
        costPerUnit,
      },
      include: {
        model: true,
        consumptions: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CONSUME",
        entity: "ProductionBatch",
        entityId: batchId,
        after: JSON.stringify({ materialsCost: actualMaterialsCost, items: Array.from(toConsume) }),
        userId: createdBy,
      },
    });

    return updated;
  });
}

// =============================================================================
// TERMINER PRODUCTION
// =============================================================================

/**
 * Termine un lot de production
 */
export async function completeBatch(
  batchId: string,
  producedQty: number,
  wasteQty?: number
): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id: batchId },
      include: { model: true },
    });

    if (!batch) {
      throw new Error("Lot non trouvé");
    }

    if (batch.status !== BatchStatus.IN_PROGRESS) {
      throw new Error("Seuls les lots en cours peuvent être terminés");
    }

    // Recalculer le coût par unité avec la quantité réelle
    const costPerUnit = producedQty > 0 ? Number(batch.totalCost) / producedQty : 0;

    const updated = await tx.productionBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.COMPLETED,
        producedQty,
        wasteQty: wasteQty || 0,
        costPerUnit,
        completedAt: new Date(),
      },
      include: { model: true },
    });

    // Mettre à jour le modèle
    await tx.model.update({
      where: { id: batch.modelId },
      data: {
        producedUnits: {
          increment: producedQty,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        action: "COMPLETE",
        entity: "ProductionBatch",
        entityId: batchId,
        after: JSON.stringify({
          producedQty,
          wasteQty,
          costPerUnit,
        }),
      },
    });

    return updated;
  });
}

// =============================================================================
// ANNULER PRODUCTION
// =============================================================================

/**
 * Annule un lot de production (remet le stock si consommé)
 */
export async function cancelBatch(batchId: string): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id: batchId },
      include: { consumptions: true },
    });

    if (!batch) {
      throw new Error("Lot non trouvé");
    }

    if (batch.status === BatchStatus.COMPLETED) {
      throw new Error("Impossible d'annuler un lot terminé");
    }

    // Si des matières ont été consommées, les remettre en stock
    for (const consumption of batch.consumptions) {
      if (Number(consumption.actualQty) > 0) {
        await createInventoryMovement(
          {
            inventoryItemId: consumption.inventoryItemId,
            direction: TxDirection.IN,
            type: TxType.ADJUSTMENT,
            quantity: Number(consumption.actualQty),
            unitCost: Number(consumption.unitCost),
            referenceType: "BATCH",
            referenceId: batch.id,
            reason: "Annulation lot production",
            notes: `Retour stock suite annulation lot ${batch.batchNumber}`,
          },
          tx
        );
      }
    }

    const updated = await tx.productionBatch.update({
      where: { id: batchId },
      data: { status: BatchStatus.CANCELLED },
    });

    await tx.auditLog.create({
      data: {
        action: "CANCEL",
        entity: "ProductionBatch",
        entityId: batchId,
        before: JSON.stringify({ status: batch.status }),
        after: JSON.stringify({ status: BatchStatus.CANCELLED }),
      },
    });

    return updated;
  });
}

// =============================================================================
// REQUÊTES
// =============================================================================

/**
 * Liste les lots de production
 */
export async function listBatches(filters: {
  status?: string;
  modelId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}): Promise<{ batches: any[]; total: number }> {
  const where: Prisma.ProductionBatchWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.modelId) {
    where.modelId = filters.modelId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [batches, total] = await Promise.all([
    prisma.productionBatch.findMany({
      where,
      include: {
        model: true,
        consumptions: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.productionBatch.count({ where }),
  ]);

  return { batches, total };
}

/**
 * Récupère un lot par ID
 */
export async function getBatchById(id: string): Promise<any> {
  return prisma.productionBatch.findUnique({
    where: { id },
    include: {
      model: {
        include: {
          bom: {
            include: { inventoryItem: true },
          },
        },
      },
      consumptions: true,
    },
  });
}
