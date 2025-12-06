// =============================================================================
// HARP ACCOUNTING - ADVANCE SERVICE
// Service complet pour la gestion des avances fournisseurs
// =============================================================================

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AdvanceStatus, PurchaseStatus } from "../constants";

// Types
export interface AdvanceCreateInput {
  supplierId: string;
  amount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
}

export interface AdvanceApplicationInput {
  advanceId: string;
  purchaseId: string;
  amount: number;
  appliedBy?: string;
}

export interface AdvanceApplicationResult {
  advance: any;
  purchase: any;
  applicationRecord: any;
}

// =============================================================================
// GÉNÉRATION NUMÉROS
// =============================================================================

async function generateAdvanceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AVA-${year}-`;

  const last = await prisma.supplierAdvance.findFirst({
    where: { advanceNumber: { startsWith: prefix } },
    orderBy: { advanceNumber: "desc" },
    select: { advanceNumber: true },
  });

  let seq = 1;
  if (last?.advanceNumber) {
    const lastSeq = parseInt(last.advanceNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

// =============================================================================
// CRÉATION AVANCE
// =============================================================================

/**
 * Crée une nouvelle avance fournisseur
 */
export async function createAdvance(input: AdvanceCreateInput): Promise<any> {
  return prisma.$transaction(async (tx) => {
    // Vérifier que le fournisseur existe
    const supplier = await tx.supplier.findUnique({
      where: { id: input.supplierId },
    });

    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }

    // Générer le numéro d'avance
    const advanceNumber = await generateAdvanceNumber();

    // Créer l'avance
    const advance = await tx.supplierAdvance.create({
      data: {
        advanceNumber,
        supplierId: input.supplierId,
        amount: input.amount,
        amountUsed: 0,
        amountRemaining: input.amount,
        paymentDate: input.paymentDate || new Date(),
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        status: AdvanceStatus.PENDING,
        notes: input.notes,
      },
      include: {
        supplier: true,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entity: "SupplierAdvance",
        entityId: advance.id,
        after: JSON.stringify(advance),
        userId: input.createdBy,
      },
    });

    return advance;
  });
}

// =============================================================================
// APPLICATION AVANCE À UN ACHAT
// =============================================================================

/**
 * Applique une avance à un achat fournisseur
 */
export async function applyAdvanceToPurchase(
  input: AdvanceApplicationInput
): Promise<AdvanceApplicationResult> {
  return prisma.$transaction(async (tx) => {
    // Récupérer l'avance
    const advance = await tx.supplierAdvance.findUnique({
      where: { id: input.advanceId },
      include: { supplier: true },
    });

    if (!advance) {
      throw new Error("Avance non trouvée");
    }

    // Récupérer l'achat
    const purchase = await tx.purchase.findUnique({
      where: { id: input.purchaseId },
      include: { supplier: true },
    });

    if (!purchase) {
      throw new Error("Achat non trouvé");
    }

    // Vérifications
    if (advance.supplierId !== purchase.supplierId) {
      throw new Error("L'avance et l'achat doivent être du même fournisseur");
    }

    if (advance.status === AdvanceStatus.APPLIED) {
      throw new Error("Cette avance a déjà été entièrement utilisée");
    }

    if (advance.status === AdvanceStatus.REFUNDED) {
      throw new Error("Cette avance a été remboursée");
    }

    if (Number(advance.amountRemaining) < input.amount) {
      throw new Error(
        `Montant demandé (${input.amount}) supérieur au solde disponible (${advance.amountRemaining})`
      );
    }

    if (input.amount > Number(purchase.amountDue)) {
      throw new Error(
        `Montant demandé (${input.amount}) supérieur au montant dû (${purchase.amountDue})`
      );
    }

    // Créer l'enregistrement d'application
    const applicationRecord = await tx.purchaseAdvance.create({
      data: {
        purchaseId: input.purchaseId,
        advanceId: input.advanceId,
        amount: input.amount,
        appliedBy: input.appliedBy,
      },
    });

    // Mettre à jour l'avance
    const newAmountUsed = Number(advance.amountUsed) + input.amount;
    const newAmountRemaining = Number(advance.amount) - newAmountUsed;
    
    let newStatus: string = AdvanceStatus.PARTIAL;
    if (newAmountRemaining <= 0) {
      newStatus = AdvanceStatus.APPLIED;
    }

    const updatedAdvance = await tx.supplierAdvance.update({
      where: { id: input.advanceId },
      data: {
        amountUsed: newAmountUsed,
        amountRemaining: newAmountRemaining,
        status: newStatus,
      },
      include: { supplier: true },
    });

    // Mettre à jour l'achat
    const newAdvanceApplied = Number(purchase.advanceApplied) + input.amount;
    const newAmountDue = Number(purchase.totalAmount) - newAdvanceApplied;

    const updatedPurchase = await tx.purchase.update({
      where: { id: input.purchaseId },
      data: {
        advanceApplied: newAdvanceApplied,
        amountDue: newAmountDue,
      },
      include: { supplier: true },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        action: "APPLY_ADVANCE",
        entity: "PurchaseAdvance",
        entityId: applicationRecord.id,
        after: JSON.stringify({
          advanceId: input.advanceId,
          purchaseId: input.purchaseId,
          amount: input.amount,
        }),
        userId: input.appliedBy,
      },
    });

    return {
      advance: updatedAdvance,
      purchase: updatedPurchase,
      applicationRecord,
    };
  });
}

// =============================================================================
// ANNULATION APPLICATION
// =============================================================================

/**
 * Annule l'application d'une avance à un achat
 */
export async function cancelAdvanceApplication(
  purchaseAdvanceId: string,
  cancelledBy?: string
): Promise<AdvanceApplicationResult> {
  return prisma.$transaction(async (tx) => {
    const application = await tx.purchaseAdvance.findUnique({
      where: { id: purchaseAdvanceId },
      include: {
        advance: true,
        purchase: true,
      },
    });

    if (!application) {
      throw new Error("Application non trouvée");
    }

    const { advance, purchase, amount } = application;

    // Supprimer l'application
    await tx.purchaseAdvance.delete({
      where: { id: purchaseAdvanceId },
    });

    // Restaurer l'avance
    const newAmountUsed = Number(advance.amountUsed) - Number(amount);
    const newAmountRemaining = Number(advance.amount) - newAmountUsed;
    
    let newStatus: string = AdvanceStatus.PENDING;
    if (newAmountUsed > 0) {
      newStatus = AdvanceStatus.PARTIAL;
    }

    const updatedAdvance = await tx.supplierAdvance.update({
      where: { id: advance.id },
      data: {
        amountUsed: newAmountUsed,
        amountRemaining: newAmountRemaining,
        status: newStatus,
      },
    });

    // Restaurer l'achat
    const newAdvanceApplied = Number(purchase.advanceApplied) - Number(amount);
    const newAmountDue = Number(purchase.totalAmount) - newAdvanceApplied;

    const updatedPurchase = await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        advanceApplied: newAdvanceApplied,
        amountDue: newAmountDue,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        action: "CANCEL_ADVANCE_APPLICATION",
        entity: "PurchaseAdvance",
        entityId: purchaseAdvanceId,
        before: JSON.stringify(application),
        userId: cancelledBy,
      },
    });

    return {
      advance: updatedAdvance,
      purchase: updatedPurchase,
      applicationRecord: null,
    };
  });
}

// =============================================================================
// REMBOURSEMENT AVANCE
// =============================================================================

/**
 * Marque une avance comme remboursée
 */
export async function refundAdvance(
  advanceId: string,
  refundedBy?: string
): Promise<any> {
  return prisma.$transaction(async (tx) => {
    const advance = await tx.supplierAdvance.findUnique({
      where: { id: advanceId },
      include: { applications: true },
    });

    if (!advance) {
      throw new Error("Avance non trouvée");
    }

    if (Number(advance.amountUsed) > 0) {
      throw new Error(
        "Cette avance a déjà été partiellement utilisée. Annulez d'abord les applications."
      );
    }

    const updated = await tx.supplierAdvance.update({
      where: { id: advanceId },
      data: {
        status: AdvanceStatus.REFUNDED,
        amountRemaining: 0,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "REFUND",
        entity: "SupplierAdvance",
        entityId: advanceId,
        before: JSON.stringify({ status: advance.status }),
        after: JSON.stringify({ status: AdvanceStatus.REFUNDED }),
        userId: refundedBy,
      },
    });

    return updated;
  });
}

// =============================================================================
// REQUÊTES
// =============================================================================

/**
 * Liste les avances avec filtres
 */
export async function listAdvances(filters: {
  supplierId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}): Promise<{ advances: any[]; total: number }> {
  const where: Prisma.SupplierAdvanceWhereInput = {};

  if (filters.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.paymentDate = {};
    if (filters.dateFrom) where.paymentDate.gte = filters.dateFrom;
    if (filters.dateTo) where.paymentDate.lte = filters.dateTo;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [advances, total] = await Promise.all([
    prisma.supplierAdvance.findMany({
      where,
      include: {
        supplier: true,
        applications: {
          include: { purchase: true },
        },
      },
      orderBy: { paymentDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.supplierAdvance.count({ where }),
  ]);

  return { advances, total };
}

/**
 * Récupère une avance par ID
 */
export async function getAdvanceById(id: string): Promise<any> {
  return prisma.supplierAdvance.findUnique({
    where: { id },
    include: {
      supplier: true,
      applications: {
        include: {
          purchase: true,
        },
      },
    },
  });
}

/**
 * Récupère les avances disponibles pour un fournisseur
 */
export async function getAvailableAdvancesForSupplier(
  supplierId: string
): Promise<any[]> {
  return prisma.supplierAdvance.findMany({
    where: {
      supplierId,
      status: {
        in: [AdvanceStatus.PENDING, AdvanceStatus.PARTIAL],
      },
      amountRemaining: { gt: 0 },
    },
    include: { supplier: true },
    orderBy: { paymentDate: "asc" },
  });
}

/**
 * Récupère les avances applicables à un achat
 */
export async function getApplicableAdvancesForPurchase(
  purchaseId: string
): Promise<any[]> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) {
    throw new Error("Achat non trouvé");
  }

  return getAvailableAdvancesForSupplier(purchase.supplierId);
}

/**
 * Statistiques des avances
 */
export async function getAdvanceStats(supplierId?: string): Promise<{
  totalAdvances: number;
  totalAmount: number;
  totalUsed: number;
  totalAvailable: number;
  byStatus: Record<string, number>;
}> {
  const where: Prisma.SupplierAdvanceWhereInput = supplierId 
    ? { supplierId } 
    : {};

  const advances = await prisma.supplierAdvance.findMany({ where });

  const byStatus: Record<string, number> = {};
  let totalAmount = 0;
  let totalUsed = 0;
  let totalAvailable = 0;

  for (const adv of advances) {
    byStatus[adv.status] = (byStatus[adv.status] || 0) + 1;
    totalAmount += Number(adv.amount);
    totalUsed += Number(adv.amountUsed);
    totalAvailable += Number(adv.amountRemaining);
  }

  return {
    totalAdvances: advances.length,
    totalAmount,
    totalUsed,
    totalAvailable,
    byStatus,
  };
}
