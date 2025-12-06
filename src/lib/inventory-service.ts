import { prisma } from "@/lib/prisma";

// Type constants (SQLite doesn't support enums)
export const TxDirection = {
  IN: "IN",
  OUT: "OUT",
} as const;

export const TxType = {
  PURCHASE: "PURCHASE",
  PRODUCTION: "PRODUCTION",
  ADJUSTMENT: "ADJUSTMENT",
  SALE: "SALE",
  RESERVE: "RESERVE",
  RELEASE: "RELEASE",
  INITIAL: "INITIAL",
  CORRECTION: "CORRECTION",
} as const;

export const PurchaseStatus = {
  DRAFT: "DRAFT",
  ORDERED: "ORDERED",
  PARTIAL: "PARTIAL",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const;

export const ProductionBatchStatus = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;

export type TxDirectionType = (typeof TxDirection)[keyof typeof TxDirection];
export type TxTypeType = (typeof TxType)[keyof typeof TxType];

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  action: string,
  entity: string,
  entityId: string,
  changes?: { before?: unknown; after?: unknown },
  userId?: string,
  userEmail?: string,
) {
  return prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      userId,
      userEmail,
      before: changes?.before ? JSON.stringify(changes.before) : null,
      after: changes?.after ? JSON.stringify(changes.after) : null,
    },
  });
}

// ============================================================================
// INVENTORY ITEM UTILITIES
// ============================================================================

/**
 * Get low stock items (quantity <= threshold)
 */
export async function getLowStockItems() {
  const items = await prisma.inventoryItem.findMany({
    where: { threshold: { not: null } },
  });
  return items.filter(
    (item) => item.threshold !== null && item.quantity <= item.threshold,
  );
}

/**
 * Get inventory valuation
 */
export async function getInventoryValuation() {
  const items = await prisma.inventoryItem.findMany();
  return items.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.averageCost),
    0,
  );
}

/**
 * Create inventory transaction with proper balance tracking
 */
export async function createInventoryTransaction(
  inventoryItemId: string,
  direction: TxDirectionType,
  type: TxTypeType,
  quantity: number,
  unitCost: number,
  referenceType: string,
  referenceId: string,
  notes?: string,
) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: inventoryItemId },
  });

  if (!item) {
    throw new Error(`Inventory item ${inventoryItemId} not found`);
  }

  const balanceBefore = Number(item.quantity);
  const balanceAfter =
    direction === TxDirection.IN
      ? balanceBefore + quantity
      : balanceBefore - quantity;

  const valueBefore = Number(item.totalValue);
  const valueAfter = balanceAfter * Number(item.averageCost);

  return prisma.inventoryTransaction.create({
    data: {
      inventoryItemId,
      direction,
      type,
      quantity,
      unitCost,
      balanceBefore,
      balanceAfter,
      valueBefore,
      valueAfter,
      avgCostBefore: Number(item.averageCost),
      avgCostAfter: Number(item.averageCost),
      referenceType,
      referenceId,
      notes,
    },
  });
}
