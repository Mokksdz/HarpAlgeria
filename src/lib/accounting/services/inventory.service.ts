// =============================================================================
// HARP ACCOUNTING - INVENTORY SERVICE
// Service complet pour la gestion des stocks avec CUMP
// =============================================================================

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { TxDirection, TxType } from "../constants";

// Types
export interface InventoryMovement {
  inventoryItemId: string;
  direction: "IN" | "OUT";
  type: string;
  quantity: number;
  unitCost: number;
  referenceType: string;
  referenceId: string;
  reason?: string;
  notes?: string;
  createdBy?: string;
}

export interface CUMPResult {
  newQuantity: number;
  newAverageCost: number;
  newTotalValue: number;
}

export interface ReconciliationItem {
  inventoryItemId: string;
  expectedQty: number;
  actualQty: number;
  variance: number;
  variancePercent: number;
  varianceValue: number;
  status: "OK" | "WARNING" | "CRITICAL";
}

// =============================================================================
// CUMP (Coût Unitaire Moyen Pondéré)
// =============================================================================

/**
 * Calcule le nouveau CUMP après une entrée de stock
 * Formule: (Ancien Stock × Ancien CUMP + Nouvelle Qté × Nouveau Prix) / (Ancien Stock + Nouvelle Qté)
 */
export function calculateCUMP(
  currentQty: number,
  currentAvgCost: number,
  incomingQty: number,
  incomingUnitCost: number,
): CUMPResult {
  const currentValue = currentQty * currentAvgCost;
  const incomingValue = incomingQty * incomingUnitCost;
  const newQuantity = currentQty + incomingQty;

  // Éviter division par zéro
  const newAverageCost =
    newQuantity > 0
      ? (currentValue + incomingValue) / newQuantity
      : incomingUnitCost;

  const newTotalValue = newQuantity * newAverageCost;

  return {
    newQuantity,
    newAverageCost: Math.round(newAverageCost * 100) / 100, // Arrondi 2 décimales
    newTotalValue: Math.round(newTotalValue * 100) / 100,
  };
}

// =============================================================================
// MOUVEMENTS DE STOCK
// =============================================================================

/**
 * Crée un mouvement de stock avec mise à jour automatique du CUMP et des soldes
 * Utilise une transaction Prisma pour garantir l'intégrité
 */
export async function createInventoryMovement(
  movement: InventoryMovement,
  tx?: Prisma.TransactionClient,
): Promise<{ transaction: any; item: any }> {
  const client = tx || prisma;

  // Récupérer l'article actuel
  const item = await client.inventoryItem.findUnique({
    where: { id: movement.inventoryItemId },
  });

  if (!item) {
    throw new Error(
      `Article inventaire non trouvé: ${movement.inventoryItemId}`,
    );
  }

  // Snapshots avant
  const balanceBefore = item.quantity;
  const valueBefore = item.totalValue;
  const avgCostBefore = item.averageCost;

  let balanceAfter: number;
  let avgCostAfter: number;
  let valueAfter: number;
  let availableAfter: number;

  if (movement.direction === TxDirection.IN) {
    // ENTRÉE: Recalculer le CUMP
    const cump = calculateCUMP(
      Number(item.quantity),
      Number(item.averageCost),
      movement.quantity,
      movement.unitCost,
    );
    balanceAfter = cump.newQuantity;
    avgCostAfter = cump.newAverageCost;
    valueAfter = cump.newTotalValue;
    availableAfter = Number(item.available) + movement.quantity;
  } else {
    // SORTIE: Garder le CUMP, réduire les quantités
    balanceAfter = Number(item.quantity) - movement.quantity;
    avgCostAfter = Number(item.averageCost);
    valueAfter = balanceAfter * avgCostAfter;

    // Pour les sorties de type RESERVE, ne pas réduire available (déjà fait)
    if (movement.type === TxType.RESERVE) {
      availableAfter = Number(item.available); // Déjà réduit par reserveStock
    } else if (movement.type === TxType.RELEASE) {
      availableAfter = Number(item.available); // Déjà augmenté par releaseStock
    } else {
      availableAfter = Number(item.available) - movement.quantity;
    }
  }

  // Validation: pas de stock négatif
  if (balanceAfter < 0) {
    throw new Error(
      `Stock insuffisant pour ${item.name}. Disponible: ${item.quantity}, Demandé: ${movement.quantity}`,
    );
  }

  // Créer la transaction
  const transaction = await client.inventoryTransaction.create({
    data: {
      inventoryItemId: movement.inventoryItemId,
      direction: movement.direction,
      type: movement.type,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      balanceBefore,
      balanceAfter,
      valueBefore,
      valueAfter,
      avgCostBefore,
      avgCostAfter,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      reason: movement.reason,
      notes: movement.notes,
      createdBy: movement.createdBy,
    },
  });

  // Mettre à jour l'article
  const updatedItem = await client.inventoryItem.update({
    where: { id: movement.inventoryItemId },
    data: {
      quantity: balanceAfter,
      available: Math.max(0, availableAfter),
      averageCost: avgCostAfter,
      totalValue: valueAfter,
      lastCost:
        movement.direction === TxDirection.IN
          ? movement.unitCost
          : item.lastCost,
      lastReceivedAt:
        movement.direction === TxDirection.IN
          ? new Date()
          : item.lastReceivedAt,
    },
  });

  return { transaction, item: updatedItem };
}

// =============================================================================
// RÉSERVATION / LIBÉRATION STOCK
// =============================================================================

/**
 * Réserve du stock pour une commande
 * Réduit 'available' sans toucher 'quantity'
 */
export async function reserveStock(
  inventoryItemId: string,
  quantity: number,
  orderId: string,
  tx?: Prisma.TransactionClient,
): Promise<any> {
  const client = tx || prisma;

  const item = await client.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!item) {
    throw new Error(`Article non trouvé: ${inventoryItemId}`);
  }

  if (Number(item.available) < quantity) {
    throw new Error(
      `Stock disponible insuffisant pour ${item.name}. Disponible: ${item.available}, Demandé: ${quantity}`,
    );
  }

  // Mettre à jour reserved et available
  const updatedItem = await client.inventoryItem.update({
    where: { id: inventoryItemId },
    data: {
      reserved: Number(item.reserved) + quantity,
      available: Number(item.available) - quantity,
    },
  });

  // Créer transaction de réservation
  await createInventoryMovement(
    {
      inventoryItemId,
      direction: "OUT",
      type: TxType.RESERVE,
      quantity,
      unitCost: Number(item.averageCost),
      referenceType: "ORDER",
      referenceId: orderId,
      notes: `Réservation pour commande ${orderId}`,
    },
    client,
  );

  return updatedItem;
}

/**
 * Libère du stock réservé (annulation commande)
 */
export async function releaseStock(
  inventoryItemId: string,
  quantity: number,
  orderId: string,
  tx?: Prisma.TransactionClient,
): Promise<any> {
  const client = tx || prisma;

  const item = await client.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!item) {
    throw new Error(`Article non trouvé: ${inventoryItemId}`);
  }

  if (Number(item.reserved) < quantity) {
    throw new Error(
      `Quantité réservée insuffisante pour ${item.name}. Réservé: ${item.reserved}, Demandé: ${quantity}`,
    );
  }

  // Mettre à jour reserved et available
  const updatedItem = await client.inventoryItem.update({
    where: { id: inventoryItemId },
    data: {
      reserved: Number(item.reserved) - quantity,
      available: Number(item.available) + quantity,
    },
  });

  // Créer transaction de libération
  await createInventoryMovement(
    {
      inventoryItemId,
      direction: "IN",
      type: TxType.RELEASE,
      quantity,
      unitCost: Number(item.averageCost),
      referenceType: "ORDER",
      referenceId: orderId,
      notes: `Libération pour commande ${orderId}`,
    },
    client,
  );

  return updatedItem;
}

// =============================================================================
// EXPÉDITION COMMANDE
// =============================================================================

/**
 * Expédie une commande - convertit stock réservé en sortie définitive
 */
export async function shipOrderStock(
  orderId: string,
  items: Array<{ inventoryItemId: string; quantity: number }>,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx || prisma;

  for (const item of items) {
    const invItem = await client.inventoryItem.findUnique({
      where: { id: item.inventoryItemId },
    });

    if (!invItem) {
      throw new Error(`Article non trouvé: ${item.inventoryItemId}`);
    }

    // Réduire la quantité totale et reserved
    await client.inventoryItem.update({
      where: { id: item.inventoryItemId },
      data: {
        quantity: Number(invItem.quantity) - item.quantity,
        reserved: Math.max(0, Number(invItem.reserved) - item.quantity),
        totalValue:
          (Number(invItem.quantity) - item.quantity) *
          Number(invItem.averageCost),
      },
    });

    // Créer transaction de vente
    await client.inventoryTransaction.create({
      data: {
        inventoryItemId: item.inventoryItemId,
        direction: TxDirection.OUT,
        type: TxType.SALE,
        quantity: item.quantity,
        unitCost: Number(invItem.averageCost),
        balanceBefore: Number(invItem.quantity),
        balanceAfter: Number(invItem.quantity) - item.quantity,
        valueBefore: Number(invItem.totalValue),
        valueAfter:
          (Number(invItem.quantity) - item.quantity) *
          Number(invItem.averageCost),
        avgCostBefore: Number(invItem.averageCost),
        avgCostAfter: Number(invItem.averageCost),
        referenceType: "ORDER",
        referenceId: orderId,
        notes: `Expédition commande ${orderId}`,
      },
    });
  }
}

/**
 * Annule une expédition - remet le stock
 */
export async function cancelShipment(
  orderId: string,
  items: Array<{ inventoryItemId: string; quantity: number }>,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx || prisma;

  for (const item of items) {
    await createInventoryMovement(
      {
        inventoryItemId: item.inventoryItemId,
        direction: "IN",
        type: TxType.ADJUSTMENT,
        quantity: item.quantity,
        unitCost: 0, // On récupère le CUMP existant
        referenceType: "ORDER",
        referenceId: orderId,
        reason: "Annulation expédition",
        notes: `Retour stock suite annulation expédition ${orderId}`,
      },
      client,
    );
  }
}

// =============================================================================
// AJUSTEMENT INVENTAIRE
// =============================================================================

/**
 * Crée un ajustement d'inventaire (correction manuelle)
 */
export async function createAdjustment(
  inventoryItemId: string,
  quantity: number, // Positif = entrée, Négatif = sortie
  reason: string,
  notes?: string,
  createdBy?: string,
): Promise<any> {
  const direction = quantity >= 0 ? TxDirection.IN : TxDirection.OUT;
  const absQuantity = Math.abs(quantity);

  const item = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!item) {
    throw new Error(`Article non trouvé: ${inventoryItemId}`);
  }

  return createInventoryMovement({
    inventoryItemId,
    direction,
    type: TxType.ADJUSTMENT,
    quantity: absQuantity,
    unitCost: Number(item.averageCost),
    referenceType: "ADJUSTMENT",
    referenceId: `ADJ-${Date.now()}`,
    reason,
    notes,
    createdBy,
  });
}

// =============================================================================
// RÉCONCILIATION
// =============================================================================

/**
 * Effectue une réconciliation d'inventaire
 * Compare les quantités attendues (calculées depuis transactions) avec les quantités actuelles
 */
export async function reconcileInventory(
  inventoryItemIds?: string[],
): Promise<ReconciliationItem[]> {
  const where = inventoryItemIds?.length
    ? { id: { in: inventoryItemIds } }
    : {};

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      transactions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const results: ReconciliationItem[] = [];

  for (const item of items) {
    // Calculer la quantité attendue depuis les transactions
    let expectedQty = 0;
    for (const tx of item.transactions) {
      if (tx.direction === TxDirection.IN) {
        expectedQty += Number(tx.quantity);
      } else {
        expectedQty -= Number(tx.quantity);
      }
    }

    const variance = Number(item.quantity) - expectedQty;
    const variancePercent =
      expectedQty !== 0
        ? (variance / expectedQty) * 100
        : variance !== 0
          ? 100
          : 0;
    const varianceValue = variance * Number(item.averageCost);

    let status: "OK" | "WARNING" | "CRITICAL" = "OK";
    if (Math.abs(variancePercent) > 10) {
      status = "CRITICAL";
    } else if (Math.abs(variancePercent) > 5) {
      status = "WARNING";
    }

    // Créer enregistrement de réconciliation
    await prisma.stockReconciliation.create({
      data: {
        inventoryItemId: item.id,
        expectedQty,
        actualQty: Number(item.quantity),
        variance,
        variancePercent,
        varianceValue,
        status: status === "OK" ? "REVIEWED" : "PENDING",
      },
    });

    results.push({
      inventoryItemId: item.id,
      expectedQty,
      actualQty: Number(item.quantity),
      variance,
      variancePercent,
      varianceValue,
      status,
    });
  }

  return results;
}

// =============================================================================
// UTILITAIRES
// =============================================================================

/**
 * Récupère les articles en stock bas
 */
export async function getLowStockItems(): Promise<any[]> {
  const items = await prisma.inventoryItem.findMany({
    where: {
      threshold: { not: null },
      isActive: true,
    },
    include: {
      supplier: true,
    },
  });

  return items.filter(
    (item) => item.threshold !== null && item.quantity <= item.threshold,
  );
}

/**
 * Calcule la valeur totale de l'inventaire
 */
export async function getInventoryValuation(): Promise<{
  totalValue: number;
  itemCount: number;
  byType: Record<string, number>;
}> {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
  });

  const byType: Record<string, number> = {};
  let totalValue = 0;

  for (const item of items) {
    totalValue += Number(item.totalValue);
    byType[item.type] = (byType[item.type] || 0) + Number(item.totalValue);
  }

  return {
    totalValue,
    itemCount: items.length,
    byType,
  };
}

/**
 * Vérifie la disponibilité du stock pour une liste d'articles
 */
export async function checkStockAvailability(
  items: Array<{ inventoryItemId: string; quantity: number }>,
): Promise<{
  available: boolean;
  details: Array<{
    inventoryItemId: string;
    name: string;
    requested: number;
    available: number;
    shortage: number;
  }>;
}> {
  const details = [];
  let allAvailable = true;

  for (const item of items) {
    const invItem = await prisma.inventoryItem.findUnique({
      where: { id: item.inventoryItemId },
    });

    if (!invItem) {
      details.push({
        inventoryItemId: item.inventoryItemId,
        name: "INCONNU",
        requested: item.quantity,
        available: 0,
        shortage: item.quantity,
      });
      allAvailable = false;
      continue;
    }

    const shortage = Math.max(0, item.quantity - Number(invItem.available));
    if (shortage > 0) {
      allAvailable = false;
    }

    details.push({
      inventoryItemId: item.inventoryItemId,
      name: invItem.name,
      requested: item.quantity,
      available: Number(invItem.available),
      shortage,
    });
  }

  return { available: allAvailable, details };
}
