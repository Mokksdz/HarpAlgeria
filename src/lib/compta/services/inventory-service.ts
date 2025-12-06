/**
 * Inventory Service - HARP Comptabilité V3
 * Handles inventory operations: list, detail, transactions, adjustments, reconciliation
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateCUMP, calculateTotalValue } from '../accounting';
import type {
  InventoryItemCreateInput,
  InventoryAdjustmentInput,
  PaginatedResponse,
  ReconciliationMismatch,
} from '../schemas/purchase.schemas';

// =============================================================================
// TYPES
// =============================================================================

type InventoryItem = Prisma.InventoryItemGetPayload<object>;
type InventoryTransaction = Prisma.InventoryTransactionGetPayload<object>;

interface InventoryListFilters {
  type?: string;
  lowStock?: boolean;
  search?: string;
  isActive?: boolean;
}

interface InventoryDetail extends InventoryItem {
  transactions: InventoryTransaction[];
  supplier?: { id: string; name: string; code: string } | null;
}

// =============================================================================
// LIST & DETAIL
// =============================================================================

/**
 * Get paginated list of inventory items with optional filters
 */
export async function getInventoryList(
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
  filters: InventoryListFilters = {}
): Promise<PaginatedResponse<InventoryItem>> {
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.InventoryItemWhereInput = {};

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { sku: { contains: filters.search } },
      { name: { contains: filters.search } },
    ];
  }

  // Get items (lowStock filter applied in memory since `available` is computed)
  let items = await prisma.inventoryItem.findMany({
    where,
    take: pageSize * 2, // Fetch more for lowStock filtering
    skip: filters.lowStock ? 0 : skip,
    orderBy: { name: 'asc' },
  });

  // Apply lowStock filter in memory
  if (filters.lowStock) {
    items = items.filter((item) => {
      const available = Number(item.quantity) - Number(item.reserved);
      const threshold = Number(item.threshold ?? 10);
      return available <= threshold;
    });
    // Apply pagination after filtering
    items = items.slice(skip, skip + pageSize);
  }

  const total = await prisma.inventoryItem.count({ where });

  return {
    items,
    meta: {
      page,
      pageSize,
      total: filters.lowStock ? items.length : total,
      totalPages: Math.ceil((filters.lowStock ? items.length : total) / pageSize),
    },
  };
}

/**
 * Get inventory item detail with transactions and supplier
 */
export async function getInventoryDetail(id: string): Promise<InventoryDetail | null> {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      supplier: {
        select: { id: true, name: true, code: true },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  return item;
}

// =============================================================================
// CREATE
// =============================================================================

/**
 * Create a new inventory item
 */
export async function createInventoryItem(
  data: InventoryItemCreateInput
): Promise<InventoryItem> {
  // Check SKU uniqueness
  const existing = await prisma.inventoryItem.findUnique({
    where: { sku: data.sku },
  });

  if (existing) {
    throw new Error(`SKU "${data.sku}" existe déjà`);
  }

  const totalValue = calculateTotalValue(data.quantity ?? 0, data.averageCost ?? 0);
  const available = (data.quantity ?? 0); // No reserved initially

  const item = await prisma.inventoryItem.create({
    data: {
      sku: data.sku,
      name: data.name,
      type: data.type,
      unit: data.unit,
      quantity: data.quantity ?? 0,
      reserved: 0,
      available,
      averageCost: data.averageCost ?? 0,
      lastCost: data.lastCost ?? 0,
      totalValue,
      color: data.color,
      width: data.width,
      composition: data.composition,
      location: data.location,
      threshold: data.threshold,
      supplierId: data.supplierId,
      notes: data.notes,
      isActive: true,
    },
  });

  // Create initial transaction if quantity > 0
  if ((data.quantity ?? 0) > 0) {
    await createInventoryTransaction({
      inventoryItemId: item.id,
      direction: 'IN',
      type: 'ADJUSTMENT',
      quantity: data.quantity!,
      unitCost: data.averageCost ?? 0,
      reason: 'Stock initial',
      balanceBefore: 0,
      balanceAfter: data.quantity!,
    });
  }

  return item;
}

// =============================================================================
// TRANSACTIONS
// =============================================================================

interface CreateTransactionParams {
  inventoryItemId: string;
  direction: 'IN' | 'OUT';
  type: 'PURCHASE' | 'PRODUCTION' | 'SALE' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE';
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  balanceBefore: number;
  balanceAfter: number;
  valueBefore?: number;
  valueAfter?: number;
  avgCostBefore?: number;
  avgCostAfter?: number;
  notes?: string;
  createdBy?: string;
}

/**
 * Create an inventory transaction record
 */
export async function createInventoryTransaction(
  params: CreateTransactionParams,
  tx?: Prisma.TransactionClient
): Promise<InventoryTransaction> {
  const client = tx ?? prisma;

  const totalCost = params.quantity * (params.unitCost ?? 0);

  return client.inventoryTransaction.create({
    data: {
      inventoryItemId: params.inventoryItemId,
      direction: params.direction,
      type: params.type,
      quantity: params.quantity,
      unitCost: params.unitCost,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
      valueBefore: params.valueBefore,
      valueAfter: params.valueAfter,
      avgCostBefore: params.avgCostBefore,
      avgCostAfter: params.avgCostAfter,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      reason: params.reason,
      notes: params.notes,
      createdBy: params.createdBy,
    },
  });
}

// =============================================================================
// ADJUSTMENTS
// =============================================================================

/**
 * Apply an inventory adjustment
 */
export async function applyAdjustment(
  data: InventoryAdjustmentInput,
  userId?: string
): Promise<{ item: InventoryItem; transaction: InventoryTransaction }> {
  return prisma.$transaction(async (tx) => {
    // Get current item
    const item = await tx.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });

    if (!item) {
      throw new Error('Article non trouvé');
    }

    // Calculate new quantity
    let newQuantity: number;
    let adjustedQty: number;
    let direction: 'IN' | 'OUT';

    switch (data.adjustmentType) {
      case 'ADD':
        newQuantity = Number(item.quantity) + data.quantity;
        adjustedQty = data.quantity;
        direction = 'IN';
        break;
      case 'REMOVE':
        newQuantity = Number(item.quantity) - data.quantity;
        adjustedQty = data.quantity;
        direction = 'OUT';
        if (newQuantity < 0) {
          throw new Error(`Stock insuffisant: ${item.quantity} disponible, ${data.quantity} demandé`);
        }
        break;
      case 'SET':
        adjustedQty = Math.abs(data.quantity - Number(item.quantity));
        direction = data.quantity >= Number(item.quantity) ? 'IN' : 'OUT';
        newQuantity = data.quantity;
        break;
      default:
        throw new Error('Type ajustement invalide');
    }

    const newAvailable = newQuantity - Number(item.reserved);
    const newTotalValue = calculateTotalValue(newQuantity, Number(item.averageCost));

    // Update item
    const updatedItem = await tx.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        quantity: newQuantity,
        available: newAvailable,
        totalValue: newTotalValue,
      },
    });

    // Create transaction
    const transaction = await createInventoryTransaction(
      {
        inventoryItemId: item.id,
        direction,
        type: 'ADJUSTMENT',
        quantity: adjustedQty,
        unitCost: Number(item.averageCost),
        balanceBefore: Number(item.quantity),
        balanceAfter: newQuantity,
        valueBefore: Number(item.totalValue),
        valueAfter: newTotalValue,
        reason: data.reason,
        notes: data.notes,
        createdBy: userId,
      },
      tx
    );

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: 'ADJUSTMENT',
        entity: 'InventoryItem',
        entityId: item.id,
        userId,
        before: JSON.stringify({
          quantity: item.quantity,
          totalValue: item.totalValue,
        }),
        after: JSON.stringify({
          quantity: newQuantity,
          totalValue: newTotalValue,
        }),
        metadata: JSON.stringify({
          adjustmentType: data.adjustmentType,
          adjustedQty,
          reason: data.reason,
        }),
      },
    });

    return { item: updatedItem, transaction };
  });
}

// =============================================================================
// RECONCILIATION
// =============================================================================

/**
 * Reconcile inventory by comparing transaction sums with current quantities
 * Returns array of mismatches
 */
export async function reconcileInventory(): Promise<ReconciliationMismatch[]> {
  // Get all active inventory items
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    select: {
      id: true,
      sku: true,
      name: true,
      quantity: true,
    },
  });

  const mismatches: ReconciliationMismatch[] = [];

  for (const item of items) {
    // Sum all IN transactions
    const inSum = await prisma.inventoryTransaction.aggregate({
      where: {
        inventoryItemId: item.id,
        direction: 'IN',
      },
      _sum: {
        quantity: true,
      },
    });

    // Sum all OUT transactions
    const outSum = await prisma.inventoryTransaction.aggregate({
      where: {
        inventoryItemId: item.id,
        direction: 'OUT',
      },
      _sum: {
        quantity: true,
      },
    });

    const totalIn = Number(inSum._sum.quantity ?? 0);
    const totalOut = Number(outSum._sum.quantity ?? 0);
    const expectedQty = totalIn - totalOut;
    const actualQty = Number(item.quantity);
    const variance = actualQty - expectedQty;

    // Report mismatch if variance is significant (> 0.01 to handle float precision)
    if (Math.abs(variance) > 0.01) {
      mismatches.push({
        inventoryItemId: item.id,
        sku: item.sku,
        name: item.name,
        expectedQty,
        actualQty,
        variance,
        variancePercent: expectedQty !== 0 ? (variance / expectedQty) * 100 : 100,
      });
    }
  }

  return mismatches;
}
