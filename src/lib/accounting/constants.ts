// =============================================================================
// HARP ACCOUNTING - CONSTANTES & ENUMS
// =============================================================================

// Inventory Types
export const InventoryType = {
  FABRIC: "FABRIC",
  ACCESSORY: "ACCESSORY",
  PACKAGING: "PACKAGING",
  FINISHED: "FINISHED",
} as const;
export type InventoryTypeValue = typeof InventoryType[keyof typeof InventoryType];

// Inventory Units
export const InventoryUnit = {
  METER: "METER",
  ROLL: "ROLL",
  PIECE: "PIECE",
  KG: "KG",
  LITER: "LITER",
} as const;
export type InventoryUnitValue = typeof InventoryUnit[keyof typeof InventoryUnit];

// Purchase Status
export const PurchaseStatus = {
  DRAFT: "DRAFT",
  ORDERED: "ORDERED",
  PARTIAL: "PARTIAL",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const;
export type PurchaseStatusValue = typeof PurchaseStatus[keyof typeof PurchaseStatus];

// Supplier Advance Status
export const AdvanceStatus = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  APPLIED: "APPLIED",
  REFUNDED: "REFUNDED",
} as const;
export type AdvanceStatusValue = typeof AdvanceStatus[keyof typeof AdvanceStatus];

// Charge Categories
export const ChargeCategory = {
  ATELIER: "ATELIER",
  SHOOTING: "SHOOTING",
  ADS: "ADS",
  INFLUENCER: "INFLUENCER",
  TRANSPORT: "TRANSPORT",
  LABOR: "LABOR",
  OTHER: "OTHER",
} as const;
export type ChargeCategoryValue = typeof ChargeCategory[keyof typeof ChargeCategory];

// Charge Scope
export const ChargeScope = {
  GLOBAL: "GLOBAL",
  COLLECTION: "COLLECTION",
  MODEL: "MODEL",
} as const;
export type ChargeScopeValue = typeof ChargeScope[keyof typeof ChargeScope];

// Transaction Direction
export const TxDirection = {
  IN: "IN",
  OUT: "OUT",
} as const;
export type TxDirectionValue = typeof TxDirection[keyof typeof TxDirection];

// Transaction Types
export const TxType = {
  PURCHASE: "PURCHASE",
  PRODUCTION: "PRODUCTION",
  SALE: "SALE",
  ADJUSTMENT: "ADJUSTMENT",
  RESERVE: "RESERVE",
  RELEASE: "RELEASE",
  INITIAL: "INITIAL",
} as const;
export type TxTypeValue = typeof TxType[keyof typeof TxType];

// Production Batch Status
export const BatchStatus = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type BatchStatusValue = typeof BatchStatus[keyof typeof BatchStatus];

// Reconciliation Status
export const ReconcileStatus = {
  PENDING: "PENDING",
  REVIEWED: "REVIEWED",
  ADJUSTED: "ADJUSTED",
  IGNORED: "IGNORED",
} as const;
export type ReconcileStatusValue = typeof ReconcileStatus[keyof typeof ReconcileStatus];

// Payment Methods
export const PaymentMethod = {
  CASH: "CASH",
  CHECK: "CHECK",
  TRANSFER: "TRANSFER",
  CCP: "CCP",
} as const;
export type PaymentMethodValue = typeof PaymentMethod[keyof typeof PaymentMethod];

// Platforms (for marketing)
export const Platform = {
  FACEBOOK: "FACEBOOK",
  INSTAGRAM: "INSTAGRAM",
  TIKTOK: "TIKTOK",
  GOOGLE: "GOOGLE",
  OTHER: "OTHER",
} as const;
export type PlatformValue = typeof Platform[keyof typeof Platform];

// =============================================================================
// LABELS (pour l'UI)
// =============================================================================

export const InventoryTypeLabels: Record<InventoryTypeValue, string> = {
  FABRIC: "Tissu",
  ACCESSORY: "Accessoire",
  PACKAGING: "Packaging",
  FINISHED: "Produit fini",
};

export const InventoryUnitLabels: Record<InventoryUnitValue, string> = {
  METER: "Mètre",
  ROLL: "Rouleau",
  PIECE: "Pièce",
  KG: "Kilogramme",
  LITER: "Litre",
};

export const PurchaseStatusLabels: Record<PurchaseStatusValue, string> = {
  DRAFT: "Brouillon",
  ORDERED: "Commandé",
  PARTIAL: "Partiel",
  RECEIVED: "Reçu",
  CANCELLED: "Annulé",
};

export const AdvanceStatusLabels: Record<AdvanceStatusValue, string> = {
  PENDING: "En attente",
  PARTIAL: "Partiellement utilisé",
  APPLIED: "Totalement utilisé",
  REFUNDED: "Remboursé",
};

export const ChargeCategoryLabels: Record<ChargeCategoryValue, string> = {
  ATELIER: "Atelier",
  SHOOTING: "Shooting",
  ADS: "Publicité",
  INFLUENCER: "Influenceur",
  TRANSPORT: "Transport",
  LABOR: "Main d'œuvre",
  OTHER: "Autre",
};

export const ChargeScopeLabels: Record<ChargeScopeValue, string> = {
  GLOBAL: "Global",
  COLLECTION: "Collection",
  MODEL: "Modèle",
};

export const TxDirectionLabels: Record<TxDirectionValue, string> = {
  IN: "Entrée",
  OUT: "Sortie",
};

export const TxTypeLabels: Record<TxTypeValue, string> = {
  PURCHASE: "Achat",
  PRODUCTION: "Production",
  SALE: "Vente",
  ADJUSTMENT: "Ajustement",
  RESERVE: "Réservation",
  RELEASE: "Libération",
  INITIAL: "Stock initial",
};

export const BatchStatusLabels: Record<BatchStatusValue, string> = {
  PLANNED: "Planifié",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

// =============================================================================
// COULEURS STATUS
// =============================================================================

export const PurchaseStatusColors: Record<PurchaseStatusValue, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700" },
  ORDERED: { bg: "bg-blue-100", text: "text-blue-700" },
  PARTIAL: { bg: "bg-orange-100", text: "text-orange-700" },
  RECEIVED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

export const AdvanceStatusColors: Record<AdvanceStatusValue, { bg: string; text: string }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-700" },
  PARTIAL: { bg: "bg-blue-100", text: "text-blue-700" },
  APPLIED: { bg: "bg-green-100", text: "text-green-700" },
  REFUNDED: { bg: "bg-gray-100", text: "text-gray-700" },
};

export const BatchStatusColors: Record<BatchStatusValue, { bg: string; text: string }> = {
  PLANNED: { bg: "bg-gray-100", text: "text-gray-700" },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
};

// =============================================================================
// DEFAULTS
// =============================================================================

export const DEFAULTS = {
  MARGIN_TARGET: 40,        // 40% marge cible
  RETURN_MARGIN: 150,       // 150 DZD marge retours
  WASTE_FACTOR: 1.05,       // 5% perte matière
  ESTIMATED_UNITS: 100,     // Unités estimées par défaut
  CURRENCY: "DZD",
  LOW_STOCK_THRESHOLD: 10,
} as const;

// =============================================================================
// NUMBER SEQUENCES (pour génération numéros)
// =============================================================================

export const SEQUENCE_PREFIX = {
  PURCHASE: "ACH",
  ADVANCE: "AVA",
  CHARGE: "CHG",
  BATCH: "LOT",
  SNAPSHOT: "SNP",
  SUPPLIER: "FRN",
} as const;
