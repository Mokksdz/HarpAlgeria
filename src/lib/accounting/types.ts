// =============================================================================
// HARP ACCOUNTING - TYPES & ZOD SCHEMAS
// =============================================================================

import { z } from "zod";
import {
  InventoryType,
  InventoryUnit,
  PurchaseStatus,
  AdvanceStatus,
  ChargeCategory,
  ChargeScope,
  TxDirection,
  TxType,
  BatchStatus,
  PaymentMethod,
  Platform,
} from "./constants";

// =============================================================================
// ZOD SCHEMAS - SUPPLIER
// =============================================================================

export const SupplierCreateSchema = z.object({
  code: z.string().min(1, "Code requis"),
  name: z.string().min(1, "Nom requis"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Algérie"),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export const SupplierUpdateSchema = SupplierCreateSchema.partial();

// =============================================================================
// ZOD SCHEMAS - INVENTORY ITEM
// =============================================================================

export const InventoryItemCreateSchema = z.object({
  sku: z.string().min(1, "SKU requis"),
  name: z.string().min(1, "Nom requis"),
  type: z.enum([
    InventoryType.FABRIC,
    InventoryType.ACCESSORY,
    InventoryType.PACKAGING,
    InventoryType.FINISHED,
  ]),
  unit: z.enum([
    InventoryUnit.METER,
    InventoryUnit.ROLL,
    InventoryUnit.PIECE,
    InventoryUnit.KG,
    InventoryUnit.LITER,
  ]),
  quantity: z.number().min(0).default(0),
  averageCost: z.number().min(0).default(0),
  color: z.string().optional(),
  width: z.number().optional(),
  composition: z.string().optional(),
  location: z.string().optional(),
  threshold: z.number().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

export const InventoryItemUpdateSchema = InventoryItemCreateSchema.partial();

// =============================================================================
// ZOD SCHEMAS - PURCHASE
// =============================================================================

export const PurchaseItemSchema = z.object({
  inventoryItemId: z.string().min(1, "Article requis"),
  quantityOrdered: z.number().positive("Quantité requise"),
  unit: z.string().min(1, "Unité requise"),
  unitPrice: z.number().min(0, "Prix requis"),
  allocations: z
    .array(
      z.object({
        modelId: z.string(),
        quantity: z.number().positive(),
      }),
    )
    .optional(),
});

export const PurchaseCreateSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  taxAmount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  items: z.array(PurchaseItemSchema).min(1, "Au moins un article requis"),
  notes: z.string().optional(),
});

export const PurchaseReceiveSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantityReceived: z.number().min(0),
    }),
  ),
  receivedBy: z.string().optional(),
});

// =============================================================================
// ZOD SCHEMAS - SUPPLIER ADVANCE
// =============================================================================

export const AdvanceCreateSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
  amount: z.number().positive("Montant requis"),
  paymentDate: z.string().optional(),
  paymentMethod: z
    .enum([
      PaymentMethod.CASH,
      PaymentMethod.CHECK,
      PaymentMethod.TRANSFER,
      PaymentMethod.CCP,
    ])
    .optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const AdvanceApplySchema = z.object({
  purchaseId: z.string().min(1, "Achat requis"),
  amount: z.number().positive("Montant requis"),
});

// =============================================================================
// ZOD SCHEMAS - CHARGE
// =============================================================================

export const ChargeCreateSchema = z.object({
  category: z.enum([
    ChargeCategory.ATELIER,
    ChargeCategory.SHOOTING,
    ChargeCategory.ADS,
    ChargeCategory.INFLUENCER,
    ChargeCategory.TRANSPORT,
    ChargeCategory.LABOR,
    ChargeCategory.OTHER,
  ]),
  subcategory: z.string().optional(),
  description: z.string().min(1, "Description requise"),
  amount: z.number().positive("Montant requis"),
  date: z.string().optional(),
  scope: z
    .enum([ChargeScope.GLOBAL, ChargeScope.COLLECTION, ChargeScope.MODEL])
    .default(ChargeScope.GLOBAL),
  collectionId: z.string().optional(),
  modelId: z.string().optional(),
  vendor: z.string().optional(),
  invoiceRef: z.string().optional(),
  campaign: z.string().optional(),
  platform: z
    .enum([
      Platform.FACEBOOK,
      Platform.INSTAGRAM,
      Platform.TIKTOK,
      Platform.GOOGLE,
      Platform.OTHER,
    ])
    .optional(),
  notes: z.string().optional(),
});

export const ChargeAllocateSchema = z.object({
  chargeId: z.string().min(1),
  allocations: z
    .array(
      z.object({
        modelId: z.string(),
        amount: z.number().positive(),
        percent: z.number().min(0).max(100).optional(),
      }),
    )
    .min(1, "Au moins une allocation requise"),
});

// =============================================================================
// ZOD SCHEMAS - MODEL
// =============================================================================

export const BomItemSchema = z.object({
  inventoryItemId: z.string().min(1, "Article requis"),
  quantity: z.number().positive("Quantité requise"),
  wasteFactor: z.number().min(1).default(1.05),
  notes: z.string().optional(),
});

export const ModelCreateSchema = z.object({
  sku: z.string().min(1, "SKU requis"),
  name: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  image: z.string().optional(),
  productId: z.string().optional(),
  collectionId: z.string().optional(),
  targetPrice: z.number().optional(),
  sellingPrice: z.number().optional(),
  estimatedUnits: z.number().int().positive().default(100),
  laborCost: z.number().min(0).default(0),
  packagingCost: z.number().min(0).default(0),
  otherCost: z.number().min(0).default(0),
  returnMargin: z.number().min(0).default(150),
  packagingBox: z.number().min(0).default(0),
  packagingBag: z.number().min(0).default(0),
  packagingLabel: z.number().min(0).default(0),
  packagingTag: z.number().min(0).default(0),
  packagingCard: z.number().min(0).default(0),
  packagingOther: z.number().min(0).default(0),
  bom: z.array(BomItemSchema).optional(),
});

export const ModelUpdateSchema = ModelCreateSchema.partial();

export const CostSimulationSchema = z.object({
  overrides: z.record(z.string(), z.number()).optional(), // { itemId: newCost }
  estimatedUnits: z.number().int().positive().optional(),
  laborCost: z.number().min(0).optional(),
  packagingCost: z.number().min(0).optional(),
});

// =============================================================================
// ZOD SCHEMAS - ADJUSTMENT
// =============================================================================

export const AdjustmentCreateSchema = z.object({
  inventoryItemId: z.string().min(1, "Article requis"),
  quantity: z.number(), // Peut être négatif
  reason: z.string().min(1, "Raison requise"),
  notes: z.string().optional(),
});

// =============================================================================
// RESULT TYPES
// =============================================================================

export interface CostBreakdown {
  // Matières
  fabricCost: number;
  accessoryCost: number;
  packagingCost: number;
  materialsCost: number;

  // Production
  laborCost: number;
  atelierCost: number;
  productionCost: number;

  // Marketing
  adsCost: number;
  shootingCost: number;
  influencerCost: number;
  marketingCost: number;

  // Autres
  transportCost: number;
  otherCost: number;
  returnMargin: number;

  // Total
  totalCost: number;
}

export interface CostResult {
  model: {
    id: string;
    sku: string;
    name: string;
    estimatedUnits: number;
  };
  breakdown: CostBreakdown;
  totalCost: number;
  suggestedPrices: {
    margin30: number;
    margin40: number;
    margin50: number;
  };
  currentPrice: number | null;
  currentMargin: number | null;
  currentMarginPercent: number | null;
}

export interface ReceivePreview {
  purchase: {
    id: string;
    purchaseNumber: string;
    supplier: string;
    totalAmount: number;
  };
  items: Array<{
    id: string;
    inventoryItem: {
      id: string;
      sku: string;
      name: string;
    };
    quantityOrdered: number;
    quantityToReceive: number;
    unitPrice: number;
    current: {
      quantity: number;
      averageCost: number;
      totalValue: number;
    };
    after: {
      quantity: number;
      averageCost: number;
      totalValue: number;
    };
  }>;
  summary: {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    impactOnStock: number;
  };
}

export interface AllocationResult {
  itemId: string;
  totalQuantity: number;
  allocations: Array<{
    modelId: string;
    modelName: string;
    quantity: number;
    percent: number;
  }>;
  unallocated: number;
}

export interface ReconciliationResult {
  itemId: string;
  itemSku: string;
  itemName: string;
  expectedQty: number;
  actualQty: number;
  variance: number;
  variancePercent: number;
  status: "OK" | "WARNING" | "ERROR";
}

// =============================================================================
// PAGINATION
// =============================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =============================================================================
// FILTERS
// =============================================================================

export const PurchaseFilterSchema = z.object({
  status: z
    .enum([
      PurchaseStatus.DRAFT,
      PurchaseStatus.ORDERED,
      PurchaseStatus.PARTIAL,
      PurchaseStatus.RECEIVED,
      PurchaseStatus.CANCELLED,
    ])
    .optional(),
  supplierId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export const ChargeFilterSchema = z.object({
  category: z
    .enum([
      ChargeCategory.ATELIER,
      ChargeCategory.SHOOTING,
      ChargeCategory.ADS,
      ChargeCategory.INFLUENCER,
      ChargeCategory.TRANSPORT,
      ChargeCategory.LABOR,
      ChargeCategory.OTHER,
    ])
    .optional(),
  scope: z
    .enum([ChargeScope.GLOBAL, ChargeScope.COLLECTION, ChargeScope.MODEL])
    .optional(),
  modelId: z.string().optional(),
  collectionId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const TransactionFilterSchema = z.object({
  inventoryItemId: z.string().optional(),
  direction: z.enum([TxDirection.IN, TxDirection.OUT]).optional(),
  type: z
    .enum([
      TxType.PURCHASE,
      TxType.PRODUCTION,
      TxType.SALE,
      TxType.ADJUSTMENT,
      TxType.RESERVE,
      TxType.RELEASE,
      TxType.INITIAL,
    ])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
