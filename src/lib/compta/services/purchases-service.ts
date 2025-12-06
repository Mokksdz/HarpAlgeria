/**
 * Purchases Service - HARP Comptabilité V3
 * Handles purchase operations: create, preview receive, receive (transactional)
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  calculateCUMP,
  calculateTotalValue,
  determinePurchaseStatus,
} from "../accounting";
import { createInventoryTransaction } from "./inventory-service";
import type {
  PurchaseCreateInput,
  ReceivePurchaseInput,
  PreviewReceiveInput,
  PaginatedResponse,
  StockUpdate,
  ReceivePreviewResult,
} from "../schemas/purchase.schemas";

// =============================================================================
// TYPES
// =============================================================================

type Purchase = Prisma.PurchaseGetPayload<{
  include: {
    supplier: true;
    items: { include: { inventoryItem: true } };
  };
}>;

type PurchaseListItem = Prisma.PurchaseGetPayload<{
  include: {
    supplier: { select: { id: true; name: true; code: true } };
    _count: { select: { items: true } };
  };
}>;

interface PurchaseListFilters {
  status?: string;
  supplierId?: string;
  search?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate purchase number: ACH-YYYY-NNN
 */
async function generatePurchaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ACH-${year}-`;

  const lastPurchase = await prisma.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: "desc" },
    select: { purchaseNumber: true },
  });

  let nextNumber = 1;
  if (lastPurchase) {
    const lastNum = parseInt(lastPurchase.purchaseNumber.split("-")[2], 10);
    nextNumber = lastNum + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}

// =============================================================================
// LIST & DETAIL
// =============================================================================

/**
 * Get paginated list of purchases with optional filters
 */
export async function getPurchaseList(
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
  filters: PurchaseListFilters = {},
): Promise<PaginatedResponse<PurchaseListItem>> {
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.PurchaseWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters.search) {
    where.OR = [
      { purchaseNumber: { contains: filters.search } },
      { invoiceNumber: { contains: filters.search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        _count: { select: { items: true } },
      },
      take: pageSize,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchase.count({ where }),
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
 * Get purchase detail with items and inventory info
 */
export async function getPurchaseDetail(id: string): Promise<Purchase | null> {
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
}

// =============================================================================
// CREATE
// =============================================================================

/**
 * Create a new purchase in DRAFT status
 */
export async function createPurchase(
  data: PurchaseCreateInput,
): Promise<Purchase> {
  const purchaseNumber = await generatePurchaseNumber();

  // Calculate totals
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantityOrdered * item.unitPrice,
    0,
  );

  return prisma.purchase.create({
    data: {
      purchaseNumber,
      supplierId: data.supplierId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      notes: data.notes,
      subtotal,
      totalAmount: subtotal,
      amountDue: subtotal,
      status: "DRAFT",
      items: {
        create: data.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: 0,
          unit: "PIECE", // Will be updated from inventory item
          unitPrice: item.unitPrice,
          totalPrice: item.quantityOrdered * item.unitPrice,
        })),
      },
    },
    include: {
      supplier: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });
}

// =============================================================================
// PREVIEW RECEIVE
// =============================================================================

/**
 * Preview the impact of receiving a purchase (non-destructive)
 * Returns calculated CUMP changes without modifying database
 */
export async function previewReceivePurchase(
  purchaseId: string,
  data: PreviewReceiveInput,
): Promise<ReceivePreviewResult> {
  // Get purchase with items
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  if (!purchase) {
    throw new Error("Achat non trouvé");
  }

  if (purchase.status === "RECEIVED") {
    throw new Error("Cet achat a déjà été entièrement reçu");
  }

  if (purchase.status === "CANCELLED") {
    throw new Error("Cet achat est annulé");
  }

  const stockUpdates: StockUpdate[] = [];
  let totalValueIncrease = 0;

  for (const receiveItem of data.items) {
    const purchaseItem = purchase.items.find(
      (pi) => pi.id === receiveItem.purchaseItemId,
    );

    if (!purchaseItem) {
      throw new Error(`Article achat ${receiveItem.purchaseItemId} non trouvé`);
    }

    // Skip if no quantity to receive
    if (receiveItem.quantityReceived <= 0) {
      continue;
    }

    // Check remaining quantity
    const remaining =
      Number(purchaseItem.quantityOrdered) -
      Number(purchaseItem.quantityReceived);
    if (receiveItem.quantityReceived > remaining) {
      throw new Error(
        `Quantité reçue (${receiveItem.quantityReceived}) dépasse le restant (${remaining}) pour ${purchaseItem.inventoryItem.name}`,
      );
    }

    const item = purchaseItem.inventoryItem;

    // Calculate new CUMP
    const newCUMP = calculateCUMP(
      Number(item.quantity),
      Number(item.averageCost),
      receiveItem.quantityReceived,
      Number(purchaseItem.unitPrice),
    );

    const newQty = Number(item.quantity) + receiveItem.quantityReceived;
    const newValue = calculateTotalValue(newQty, newCUMP);
    const valueIncrease = newValue - Number(item.totalValue);
    totalValueIncrease += valueIncrease;

    stockUpdates.push({
      inventoryItemId: item.id,
      sku: item.sku,
      name: item.name,
      previousQty: Number(item.quantity),
      receivedQty: receiveItem.quantityReceived,
      newQty,
      previousCUMP: Number(item.averageCost),
      unitPrice: Number(purchaseItem.unitPrice),
      newCUMP,
      previousValue: Number(item.totalValue),
      newValue,
    });
  }

  return {
    purchaseId: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    stockUpdates,
    summary: {
      totalItemsToReceive: stockUpdates.length,
      totalValueIncrease,
    },
  };
}

// =============================================================================
// RECEIVE PURCHASE (TRANSACTIONAL)
// =============================================================================

interface ReceivePurchaseResult {
  success: true;
  purchase: Purchase;
  stockUpdates: StockUpdate[];
}

/**
 * Receive a purchase - transactional operation that:
 * 1. Updates inventory quantities and CUMP
 * 2. Creates InventoryTransactions
 * 3. Updates purchase status
 * 4. Creates AuditLog
 */
export async function receivePurchase(
  purchaseId: string,
  data: ReceivePurchaseInput,
  userId?: string,
): Promise<ReceivePurchaseResult> {
  return prisma.$transaction(async (tx) => {
    // Get purchase with items
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new Error("Achat non trouvé");
    }

    if (purchase.status === "RECEIVED") {
      throw new Error("Cet achat a déjà été entièrement reçu");
    }

    if (purchase.status === "CANCELLED") {
      throw new Error("Cet achat est annulé");
    }

    const stockUpdates: StockUpdate[] = [];
    const beforeSnapshot = {
      status: purchase.status,
      items: purchase.items.map((pi) => ({
        id: pi.id,
        quantityReceived: pi.quantityReceived,
      })),
    };

    // Process each item to receive
    for (const receiveItem of data.items) {
      const purchaseItem = purchase.items.find(
        (pi) => pi.id === receiveItem.purchaseItemId,
      );

      if (!purchaseItem) {
        throw new Error(
          `Article achat ${receiveItem.purchaseItemId} non trouvé`,
        );
      }

      // Skip if no quantity to receive
      if (receiveItem.quantityReceived <= 0) {
        continue;
      }

      // Validate remaining quantity
      const remaining =
        Number(purchaseItem.quantityOrdered) -
        Number(purchaseItem.quantityReceived);
      if (receiveItem.quantityReceived > remaining) {
        throw new Error(
          `Quantité reçue (${receiveItem.quantityReceived}) dépasse le restant (${remaining}) pour ${purchaseItem.inventoryItem.name}`,
        );
      }

      const item = purchaseItem.inventoryItem;

      // Calculate new CUMP
      const newCUMP = calculateCUMP(
        Number(item.quantity),
        Number(item.averageCost),
        receiveItem.quantityReceived,
        Number(purchaseItem.unitPrice),
      );

      const newQty = Number(item.quantity) + receiveItem.quantityReceived;
      const newAvailable = newQty - Number(item.reserved);
      const newValue = calculateTotalValue(newQty, newCUMP);

      // Update inventory item
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: newQty,
          available: newAvailable,
          averageCost: newCUMP,
          lastCost: Number(purchaseItem.unitPrice),
          totalValue: newValue,
          lastReceivedAt: new Date(),
        },
      });

      // Create inventory transaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          direction: "IN",
          type: "PURCHASE",
          quantity: receiveItem.quantityReceived,
          unitCost: Number(purchaseItem.unitPrice),
          balanceBefore: Number(item.quantity),
          balanceAfter: newQty,
          valueBefore: Number(item.totalValue),
          valueAfter: newValue,
          avgCostBefore: Number(item.averageCost),
          avgCostAfter: newCUMP,
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          createdBy: userId,
        },
      });

      // Update purchase item received quantity
      await tx.purchaseItem.update({
        where: { id: purchaseItem.id },
        data: {
          quantityReceived:
            Number(purchaseItem.quantityReceived) +
            receiveItem.quantityReceived,
        },
      });

      stockUpdates.push({
        inventoryItemId: item.id,
        sku: item.sku,
        name: item.name,
        previousQty: Number(item.quantity),
        receivedQty: receiveItem.quantityReceived,
        newQty,
        previousCUMP: Number(item.averageCost),
        unitPrice: Number(purchaseItem.unitPrice),
        newCUMP,
        previousValue: Number(item.totalValue),
        newValue,
      });
    }

    // Determine new purchase status
    const updatedItems = await tx.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });

    const newStatus = determinePurchaseStatus(updatedItems);
    const receivedDate = newStatus === "RECEIVED" ? new Date() : null;

    // Update purchase status
    const updatedPurchase = await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        status: newStatus,
        receivedDate,
        receivedBy: data.receivedBy,
      },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        action: "RECEIVE",
        entity: "Purchase",
        entityId: purchase.id,
        userId,
        before: JSON.stringify(beforeSnapshot),
        after: JSON.stringify({
          status: newStatus,
          receivedDate,
          items: updatedItems.map((pi) => ({
            id: pi.id,
            quantityReceived: pi.quantityReceived,
          })),
        }),
        metadata: JSON.stringify({
          stockUpdates: stockUpdates.map((su) => ({
            sku: su.sku,
            receivedQty: su.receivedQty,
            previousCUMP: su.previousCUMP,
            newCUMP: su.newCUMP,
          })),
          receivedBy: data.receivedBy,
        }),
      },
    });

    return {
      success: true as const,
      purchase: updatedPurchase,
      stockUpdates,
    };
  });
}
