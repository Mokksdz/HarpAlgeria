/**
 * Zod Schemas for Purchase & Inventory operations
 * Phase 1 - HARP Comptabilité V3
 */

import { z } from 'zod';

// =============================================================================
// PURCHASE SCHEMAS
// =============================================================================

/**
 * Schema for creating a new purchase item
 */
export const PurchaseItemCreateSchema = z.object({
  inventoryItemId: z.string().min(1, 'Article requis'),
  quantityOrdered: z.number().positive('Quantité doit être positive'),
  unitPrice: z.number().min(0, 'Prix unitaire invalide'),
});

/**
 * Schema for creating a new purchase
 */
export const PurchaseCreateSchema = z.object({
  supplierId: z.string().min(1, 'Fournisseur requis'),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().datetime().optional(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(PurchaseItemCreateSchema).min(1, 'Au moins un article requis'),
});

export type PurchaseCreateInput = z.infer<typeof PurchaseCreateSchema>;

/**
 * Schema for receiving a single purchase item
 */
export const ReceiveItemSchema = z.object({
  purchaseItemId: z.string().min(1, 'ID article achat requis'),
  quantityReceived: z.number().min(0, 'Quantité reçue doit être >= 0'),
});

/**
 * Schema for receiving a purchase
 */
export const ReceivePurchaseSchema = z.object({
  items: z.array(ReceiveItemSchema).min(1, 'Au moins un article à recevoir'),
  receivedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type ReceivePurchaseInput = z.infer<typeof ReceivePurchaseSchema>;

/**
 * Schema for previewing a purchase reception
 */
export const PreviewReceiveSchema = ReceivePurchaseSchema;
export type PreviewReceiveInput = z.infer<typeof PreviewReceiveSchema>;

// =============================================================================
// INVENTORY SCHEMAS
// =============================================================================

/**
 * Schema for creating a new inventory item
 */
export const InventoryItemCreateSchema = z.object({
  sku: z.string().min(1, 'SKU requis').max(50, 'SKU trop long'),
  name: z.string().min(1, 'Nom requis').max(200, 'Nom trop long'),
  type: z.enum(['FABRIC', 'ACCESSORY', 'PACKAGING', 'FINISHED', 'TRIM', 'LABEL'], {
    message: 'Type invalide',
  }),
  unit: z.enum(['METER', 'ROLL', 'PIECE', 'KG', 'LITER', 'SET'], {
    message: 'Unité invalide',
  }),
  quantity: z.number().min(0).optional().default(0),
  averageCost: z.number().min(0).optional().default(0),
  lastCost: z.number().min(0).optional().default(0),
  color: z.string().optional(),
  width: z.number().positive().optional(),
  composition: z.string().optional(),
  location: z.string().optional(),
  threshold: z.number().min(0).optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

export type InventoryItemCreateInput = z.infer<typeof InventoryItemCreateSchema>;

/**
 * Schema for inventory adjustment
 */
export const InventoryAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1, 'Article requis'),
  adjustmentType: z.enum(['ADD', 'REMOVE', 'SET'], {
    message: 'Type ajustement invalide (ADD, REMOVE, SET)',
  }),
  quantity: z.number().min(0, 'Quantité doit être >= 0'),
  reason: z.string().min(1, 'Raison requise').max(500, 'Raison trop longue'),
  notes: z.string().optional(),
});

export type InventoryAdjustmentInput = z.infer<typeof InventoryAdjustmentSchema>;

// =============================================================================
// PAGINATION SCHEMAS
// =============================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

// =============================================================================
// FILTER SCHEMAS
// =============================================================================

export const PurchaseFilterSchema = z.object({
  status: z.enum(['DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED']).optional(),
  supplierId: z.string().optional(),
  search: z.string().optional(),
});

export const InventoryFilterSchema = z.object({
  type: z.enum(['FABRIC', 'ACCESSORY', 'PACKAGING', 'FINISHED', 'TRIM', 'LABEL']).optional(),
  lowStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export interface StockUpdate {
  inventoryItemId: string;
  sku: string;
  name: string;
  previousQty: number;
  receivedQty: number;
  newQty: number;
  previousCUMP: number;
  unitPrice: number;
  newCUMP: number;
  previousValue: number;
  newValue: number;
}

export interface ReceivePreviewResult {
  purchaseId: string;
  purchaseNumber: string;
  stockUpdates: StockUpdate[];
  summary: {
    totalItemsToReceive: number;
    totalValueIncrease: number;
  };
}

export interface ReconciliationMismatch {
  inventoryItemId: string;
  sku: string;
  name: string;
  expectedQty: number;
  actualQty: number;
  variance: number;
  variancePercent: number;
}
