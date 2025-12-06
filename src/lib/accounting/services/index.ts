// =============================================================================
// HARP ACCOUNTING - SERVICES INDEX
// Point d'entrée unique pour tous les services métier
// =============================================================================

// Inventory Service
export {
  calculateCUMP,
  createInventoryMovement,
  reserveStock,
  releaseStock,
  shipOrderStock,
  cancelShipment,
  createAdjustment,
  reconcileInventory,
  getLowStockItems,
  getInventoryValuation,
  checkStockAvailability,
} from "./inventory.service";

// Purchase Service
export {
  createPurchase,
  orderPurchase,
  cancelPurchase,
  previewReceive,
  receivePurchase,
  listPurchases,
  getPurchaseById,
  getPurchaseStats,
} from "./purchase.service";

// Production Service
export {
  createProductionBatch,
  previewConsumption,
  startBatch,
  consumeProductionBatch,
  completeBatch,
  cancelBatch,
  listBatches,
  getBatchById,
} from "./production.service";

// Cost Service
export {
  computeCostPerUnit,
  simulatePrice,
  computeModelProfitability,
  computeCollectionProfitability,
  createCostSnapshot,
  getGlobalCostReport,
} from "./cost.service";

// Advance Service
export {
  createAdvance,
  applyAdvanceToPurchase,
  cancelAdvanceApplication,
  refundAdvance,
  listAdvances,
  getAdvanceById,
  getAvailableAdvancesForSupplier,
  getApplicableAdvancesForPurchase,
  getAdvanceStats,
} from "./advance.service";

// Service Types (prefixed to avoid conflicts with main types)
export type {
  InventoryMovement,
  CUMPResult,
  ReconciliationItem,
} from "./inventory.service";

export type {
  PurchaseItemInput,
  PurchaseCreateInput,
  ReceiveItemInput,
} from "./purchase.service";

// Re-export ReceivePreview with alias to avoid conflict
export type { ReceivePreview as ServiceReceivePreview } from "./purchase.service";

export type {
  BatchCreateInput,
  ConsumptionInput,
  BatchConsumptionPreview,
} from "./production.service";

// Re-export CostBreakdown and CostResult with aliases to avoid conflict
export type { 
  CostBreakdown as ServiceCostBreakdown,
  CostResult as ServiceCostResult,
  SimulationParams,
  ProfitabilityResult,
  CollectionProfitability,
} from "./cost.service";

export type {
  AdvanceCreateInput,
  AdvanceApplicationInput,
  AdvanceApplicationResult,
} from "./advance.service";
