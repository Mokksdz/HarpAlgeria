/**
 * Zod Schemas for Production operations
 * Phase 2 - HARP Comptabilité V3
 */

import { z } from "zod";

// =============================================================================
// PRODUCTION BATCH SCHEMAS
// =============================================================================

/**
 * Schema for creating a new production batch
 */
export const CreateBatchSchema = z.object({
  modelId: z.string().min(1, "Modèle requis"),
  plannedQty: z.number().int().positive("Quantité doit être positive"),
  plannedDate: z.string().datetime().optional(),
  laborCost: z.number().min(0, "Coût MO invalide").default(0),
  overheadCost: z.number().min(0, "Frais atelier invalides").default(0),
  notes: z.string().optional(),
});

export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;

/**
 * Schema for updating a batch (status change, costs, etc.)
 */
export const UpdateBatchSchema = z.object({
  plannedQty: z.number().int().positive().optional(),
  plannedDate: z.string().datetime().optional(),
  laborCost: z.number().min(0).optional(),
  overheadCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"])
    .optional(),
});

export type UpdateBatchInput = z.infer<typeof UpdateBatchSchema>;

/**
 * Schema for completing a production batch
 */
export const CompleteBatchSchema = z.object({
  producedQty: z.number().int().nonnegative("Quantité produite doit être >= 0"),
  wasteQty: z
    .number()
    .int()
    .nonnegative("Quantité déchets doit être >= 0")
    .default(0),
  notes: z.string().optional(),
});

export type CompleteBatchInput = z.infer<typeof CompleteBatchSchema>;

// =============================================================================
// CONSUMPTION SCHEMAS
// =============================================================================

/**
 * Schema for a single consumption item
 */
export const ConsumptionItemSchema = z.object({
  inventoryItemId: z.string().min(1, "Article requis"),
  quantity: z.number().positive("Quantité doit être positive"),
});

/**
 * Schema for consuming materials (starting production)
 */
export const ConsumeSchema = z.object({
  consumptions: z.array(ConsumptionItemSchema).optional(),
  createSnapshot: z.boolean().default(true),
});

export type ConsumeInput = z.infer<typeof ConsumeSchema>;

// =============================================================================
// FILTER SCHEMAS
// =============================================================================

export const BatchFilterSchema = z.object({
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"])
    .optional(),
  modelId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type BatchFilterInput = z.infer<typeof BatchFilterSchema>;

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface BOMRequirement {
  inventoryItemId: string;
  sku: string;
  name: string;
  unit: string;
  bomQtyPerUnit: number;
  wasteFactor: number;
  required: number;
  available: number;
  shortage: number;
  unitCost: number;
  totalCost: number;
  canConsume: boolean;
}

export interface ConsumptionPreview {
  batchId: string;
  batchNumber: string;
  modelId: string;
  modelSku: string;
  modelName: string;
  plannedQty: number;
  requirements: BOMRequirement[];
  hasShortage: boolean;
  totalMaterialsCost: number;
  estimatedCostPerUnit: number;
  canProceed: boolean;
}

export interface ConsumptionResult {
  batchId: string;
  consumptions: Array<{
    inventoryItemId: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  totalMaterialsCost: number;
  status: string;
}

export interface BatchCostBreakdown {
  materialsCost: number;
  laborCost: number;
  overheadCost: number;
  otherCost: number;
  totalCost: number;
  costPerUnit: number;
}

export interface BatchSummary {
  id: string;
  batchNumber: string;
  model: {
    id: string;
    sku: string;
    name: string;
  };
  plannedQty: number;
  producedQty: number;
  wasteQty: number;
  status: string;
  materialsCost: number;
  totalCost: number;
  costPerUnit: number;
  createdAt: string;
}

export interface BatchDetail extends BatchSummary {
  laborCost: number;
  overheadCost: number;
  plannedDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  consumptions: Array<{
    id: string;
    inventoryItemId: string;
    sku: string;
    name: string;
    plannedQty: number;
    actualQty: number;
    unitCost: number;
    totalCost: number;
  }>;
  notes: string | null;
}
