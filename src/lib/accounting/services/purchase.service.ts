// =============================================================================
// HARP ACCOUNTING - PURCHASE SERVICE
// Service complet pour la gestion des achats fournisseurs
// =============================================================================

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PurchaseStatus, TxDirection, TxType } from "../constants";
import { createInventoryMovement, calculateCUMP } from "./inventory.service";

// Types
export interface PurchaseItemInput {
  inventoryItemId: string;
  quantityOrdered: number;
  unit: string;
  unitPrice: number;
  allocations?: Array<{ modelId: string; quantity: number }>;
}

export interface PurchaseCreateInput {
  supplierId: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  orderDate?: Date;
  expectedDate?: Date;
  taxAmount?: number;
  shippingCost?: number;
  items: PurchaseItemInput[];
  notes?: string;
}

export interface ReceiveItemInput {
  id: string; // PurchaseItem ID
  quantityReceived: number;
}

export interface ReceivePreview {
  purchase: {
    id: string;
    purchaseNumber: string;
    supplier: { id: string; name: string };
    totalAmount: number;
  };
  items: Array<{
    id: string;
    inventoryItem: { id: string; sku: string; name: string };
    quantityOrdered: number;
    quantityAlreadyReceived: number;
    quantityToReceive: number;
    unitPrice: number;
    current: { quantity: number; averageCost: number; totalValue: number };
    after: { quantity: number; averageCost: number; totalValue: number };
  }>;
  summary: {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
  };
}

// =============================================================================
// GÉNÉRATION NUMÉROS
// =============================================================================

async function generatePurchaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ACH-${year}-`;

  const last = await prisma.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: "desc" },
    select: { purchaseNumber: true },
  });

  let seq = 1;
  if (last?.purchaseNumber) {
    const lastSeq = parseInt(last.purchaseNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// =============================================================================
// CRÉATION ACHAT
// =============================================================================

/**
 * Crée un nouvel achat fournisseur
 */
export async function createPurchase(input: PurchaseCreateInput): Promise<any> {
  return prisma.$transaction(async (tx) => {
    // Générer le numéro d'achat
    const purchaseNumber = await generatePurchaseNumber();

    // Calculer les totaux
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.quantityOrdered * item.unitPrice,
      0,
    );
    const totalAmount =
      subtotal + (input.taxAmount || 0) + (input.shippingCost || 0);

    // Créer l'achat
    const purchase = await tx.purchase.create({
      data: {
        purchaseNumber,
        supplierId: input.supplierId,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        orderDate: input.orderDate || new Date(),
        expectedDate: input.expectedDate,
        subtotal,
        taxAmount: input.taxAmount || 0,
        shippingCost: input.shippingCost || 0,
        totalAmount,
        amountDue: totalAmount,
        status: PurchaseStatus.DRAFT,
        notes: input.notes,
        items: {
          create: input.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantityOrdered: item.quantityOrdered,
            quantityReceived: 0,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.quantityOrdered * item.unitPrice,
            allocations: item.allocations
              ? JSON.stringify(item.allocations)
              : null,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    // Créer log d'audit
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Purchase",
        entityId: purchase.id,
        after: JSON.stringify(purchase),
      },
    });

    return purchase;
  });
}

// =============================================================================
// MISE À JOUR STATUT
// =============================================================================

/**
 * Passe un achat en statut ORDERED (commandé)
 */
export async function orderPurchase(purchaseId: string): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new Error("Achat non trouvé");
    }

    if (purchase.status !== PurchaseStatus.DRAFT) {
      throw new Error("Seuls les achats en brouillon peuvent être commandés");
    }

    const updated = await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.ORDERED },
      include: { supplier: true, items: true },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Purchase",
        entityId: purchaseId,
        before: JSON.stringify({ status: purchase.status }),
        after: JSON.stringify({ status: updated.status }),
      },
    });

    return updated;
  });
}

/**
 * Annule un achat
 */
export async function cancelPurchase(purchaseId: string): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    });

    if (!purchase) {
      throw new Error("Achat non trouvé");
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new Error("Impossible d'annuler un achat déjà reçu");
    }

    const updated = await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: PurchaseStatus.CANCELLED },
    });

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Purchase",
        entityId: purchaseId,
        before: JSON.stringify({ status: purchase.status }),
        after: JSON.stringify({ status: PurchaseStatus.CANCELLED }),
      },
    });

    return updated;
  });
}

// =============================================================================
// PREVIEW RÉCEPTION
// =============================================================================

/**
 * Génère un aperçu de l'impact de la réception sur le stock
 */
export async function previewReceive(
  purchaseId: string,
): Promise<ReceivePreview> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      supplier: true,
      items: {
        include: { inventoryItem: true },
      },
    },
  });

  if (!purchase) {
    throw new Error("Achat non trouvé");
  }

  const previewItems = [];
  let totalQuantity = 0;
  let totalValue = 0;

  for (const item of purchase.items) {
    const inv = item.inventoryItem;
    const quantityToReceive =
      Number(item.quantityOrdered) - Number(item.quantityReceived);

    if (quantityToReceive <= 0) continue;

    // Calculer le nouveau CUMP
    const cump = calculateCUMP(
      Number(inv.quantity),
      Number(inv.averageCost),
      quantityToReceive,
      Number(item.unitPrice),
    );

    previewItems.push({
      id: item.id,
      inventoryItem: {
        id: inv.id,
        sku: inv.sku,
        name: inv.name,
      },
      quantityOrdered: Number(item.quantityOrdered),
      quantityAlreadyReceived: Number(item.quantityReceived),
      quantityToReceive,
      unitPrice: Number(item.unitPrice),
      current: {
        quantity: Number(inv.quantity),
        averageCost: Number(inv.averageCost),
        totalValue: Number(inv.totalValue),
      },
      after: {
        quantity: cump.newQuantity,
        averageCost: cump.newAverageCost,
        totalValue: cump.newTotalValue,
      },
    });

    totalQuantity += quantityToReceive;
    totalValue += quantityToReceive * Number(item.unitPrice);
  }

  return {
    purchase: {
      id: purchase.id,
      purchaseNumber: purchase.purchaseNumber,
      supplier: {
        id: purchase.supplier.id,
        name: purchase.supplier.name,
      },
      totalAmount: Number(purchase.totalAmount),
    },
    items: previewItems,
    summary: {
      totalItems: previewItems.length,
      totalQuantity,
      totalValue,
    },
  };
}

// =============================================================================
// RÉCEPTION ACHAT
// =============================================================================

/**
 * Réceptionne un achat - met à jour le stock avec CUMP
 */
export async function receivePurchase(
  purchaseId: string,
  items: ReceiveItemInput[],
  receivedBy?: string,
): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    if (!purchase) {
      throw new Error("Achat non trouvé");
    }

    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new Error("Impossible de réceptionner un achat annulé");
    }

    if (purchase.status === PurchaseStatus.RECEIVED) {
      throw new Error("Cet achat a déjà été entièrement réceptionné");
    }

    let anyReceived = false;

    for (const receiveItem of items) {
      const purchaseItem = purchase.items.find(
        (pi) => pi.id === receiveItem.id,
      );
      if (!purchaseItem) {
        throw new Error(`Article d'achat non trouvé: ${receiveItem.id}`);
      }

      const remainingToReceive =
        Number(purchaseItem.quantityOrdered) -
        Number(purchaseItem.quantityReceived);
      const qtyToReceive = Math.min(
        receiveItem.quantityReceived,
        remainingToReceive,
      );

      if (qtyToReceive <= 0) continue;

      anyReceived = true;

      // Mettre à jour la quantité reçue sur l'article d'achat
      await tx.purchaseItem.update({
        where: { id: purchaseItem.id },
        data: {
          quantityReceived:
            Number(purchaseItem.quantityReceived) + qtyToReceive,
        },
      });

      // Créer le mouvement de stock avec CUMP
      await createInventoryMovement(
        {
          inventoryItemId: purchaseItem.inventoryItemId,
          direction: TxDirection.IN,
          type: TxType.PURCHASE,
          quantity: qtyToReceive,
          unitCost: Number(purchaseItem.unitPrice),
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          notes: `Réception achat ${purchase.purchaseNumber} - ${purchase.supplier.name}`,
          createdBy: receivedBy,
        },
        tx,
      );

      // Vérifier si tout est reçu pour cet article
      const newReceived = Number(purchaseItem.quantityReceived) + qtyToReceive;
      if (newReceived < Number(purchaseItem.quantityOrdered)) {
        // Partial receive - continue processing
      }
    }

    // Vérifier si tous les articles sont reçus
    const updatedItems = await tx.purchaseItem.findMany({
      where: { purchaseId },
    });

    const fullyReceived = updatedItems.every(
      (item) => item.quantityReceived >= item.quantityOrdered,
    );

    // Mettre à jour le statut de l'achat
    const newStatus = fullyReceived
      ? PurchaseStatus.RECEIVED
      : anyReceived
        ? PurchaseStatus.PARTIAL
        : purchase.status;

    const updatedPurchase = await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: newStatus,
        receivedDate: fullyReceived ? new Date() : purchase.receivedDate,
        receivedBy: receivedBy || purchase.receivedBy,
      },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        action: "RECEIVE",
        entity: "Purchase",
        entityId: purchaseId,
        before: JSON.stringify({ status: purchase.status }),
        after: JSON.stringify({
          status: newStatus,
          itemsReceived: items,
        }),
        userId: receivedBy,
      },
    });

    return updatedPurchase;
  });
}

// =============================================================================
// REQUÊTES
// =============================================================================

/**
 * Liste les achats avec filtres
 */
export async function listPurchases(filters: {
  status?: string;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ purchases: any[]; total: number }> {
  const where: Prisma.PurchaseWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.orderDate = {};
    if (filters.dateFrom) {
      where.orderDate.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.orderDate.lte = filters.dateTo;
    }
  }

  if (filters.search) {
    where.OR = [
      { purchaseNumber: { contains: filters.search } },
      { invoiceNumber: { contains: filters.search } },
      { supplier: { name: { contains: filters.search } } },
    ];
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true },
        },
        advances: {
          include: { advance: true },
        },
      },
      orderBy: { orderDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return { purchases, total };
}

/**
 * Récupère un achat par ID
 */
export async function getPurchaseById(id: string): Promise<any> {
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: { inventoryItem: true },
      },
      advances: {
        include: { advance: true },
      },
    },
  });
}

/**
 * Statistiques achats
 */
export async function getPurchaseStats(period?: {
  from: Date;
  to: Date;
}): Promise<{
  total: number;
  totalAmount: number;
  byStatus: Record<string, number>;
  bySupplier: Array<{
    supplierId: string;
    supplierName: string;
    total: number;
  }>;
}> {
  const where: Prisma.PurchaseWhereInput = {};

  if (period) {
    where.orderDate = {
      gte: period.from,
      lte: period.to,
    };
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { supplier: true },
  });

  const byStatus: Record<string, number> = {};
  const bySupplierMap: Record<string, { name: string; total: number }> = {};
  let totalAmount = 0;

  for (const p of purchases) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    totalAmount += Number(p.totalAmount);

    if (!bySupplierMap[p.supplierId]) {
      bySupplierMap[p.supplierId] = { name: p.supplier.name, total: 0 };
    }
    bySupplierMap[p.supplierId].total += Number(p.totalAmount);
  }

  const bySupplier = Object.entries(bySupplierMap)
    .map(([id, data]) => ({
      supplierId: id,
      supplierName: data.name,
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    total: purchases.length,
    totalAmount,
    byStatus,
    bySupplier,
  };
}
