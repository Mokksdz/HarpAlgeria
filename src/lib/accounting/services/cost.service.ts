// =============================================================================
// HARP ACCOUNTING - COST SERVICE
// Service complet pour le calcul des coûts et marges
// =============================================================================

import { prisma } from "@/lib/prisma";
import { ChargeScope } from "../constants";

// Types
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
    producedUnits: number;
  };
  breakdown: CostBreakdown;
  totalCost: number;
  costPerUnit: number;
  suggestedPrices: {
    margin30: number;
    margin40: number;
    margin50: number;
  };
  currentPrice: number | null;
  currentMargin: number | null;
  currentMarginPercent: number | null;
}

export interface SimulationParams {
  overrides?: Record<string, number>; // { inventoryItemId: newUnitCost }
  estimatedUnits?: number;
  laborCost?: number;
  packagingCost?: number;
  marginTarget?: number;
}

export interface ProfitabilityResult {
  modelId: string;
  modelName: string;
  modelSku: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  unitsSold: number;
  avgSellingPrice: number;
  avgCostPerUnit: number;
  status: "PROFITABLE" | "BREAK_EVEN" | "LOSS";
}

export interface CollectionProfitability {
  collectionId: string;
  collectionName: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  modelCount: number;
  models: ProfitabilityResult[];
}

// =============================================================================
// CALCUL COÛT PAR MODÈLE
// =============================================================================

/**
 * Calcule le coût de revient complet d'un modèle
 */
export async function computeCostPerUnit(modelId: string): Promise<CostResult> {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: {
      bom: {
        include: { inventoryItem: true },
      },
      charges: true,
      collection: true,
    },
  });

  if (!model) {
    throw new Error("Modèle non trouvé");
  }

  const units = model.estimatedUnits || 100;

  // === COÛTS MATIÈRES ===
  let fabricCost = 0;
  let accessoryCost = 0;

  for (const bomItem of model.bom) {
    const itemCost = Number(bomItem.quantity) * Number(bomItem.wasteFactor) * Number(bomItem.inventoryItem.averageCost);
    
    if (bomItem.inventoryItem.type === "FABRIC") {
      fabricCost += itemCost;
    } else {
      accessoryCost += itemCost;
    }
  }

  // Packaging détaillé
  const packagingCost = 
    Number(model.packagingBox) + 
    Number(model.packagingBag) + 
    Number(model.packagingLabel) + 
    Number(model.packagingTag) + 
    Number(model.packagingCard) + 
    Number(model.packagingOther);

  const materialsCost = fabricCost + accessoryCost + packagingCost;

  // === COÛTS PRODUCTION ===
  const laborCost = Number(model.laborCost);
  
  // Charges atelier allouées à ce modèle
  const atelierCharges = model.charges.filter(
    c => c.category === "ATELIER" && c.scope === ChargeScope.MODEL
  );
  const atelierCost = atelierCharges.reduce((sum, c) => sum + Number(c.amount), 0) / units;
  
  const productionCost = laborCost + atelierCost;

  // === COÛTS MARKETING ===
  // Charges directes au modèle
  const modelCharges = model.charges.filter(c => c.scope === ChargeScope.MODEL);
  
  const adsCost = modelCharges
    .filter(c => c.category === "ADS")
    .reduce((sum, c) => sum + Number(c.amount), 0) / units;

  const shootingCost = modelCharges
    .filter(c => c.category === "SHOOTING")
    .reduce((sum, c) => sum + Number(c.amount), 0) / units;

  const influencerCost = modelCharges
    .filter(c => c.category === "INFLUENCER")
    .reduce((sum, c) => sum + Number(c.amount), 0) / units;

  const marketingCost = adsCost + shootingCost + influencerCost;

  // === AUTRES COÛTS ===
  const transportCost = modelCharges
    .filter(c => c.category === "TRANSPORT")
    .reduce((sum, c) => sum + Number(c.amount), 0) / units;

  const otherCost = Number(model.otherCost) + modelCharges
    .filter(c => c.category === "OTHER")
    .reduce((sum, c) => sum + Number(c.amount), 0) / units;

  const returnMargin = Number(model.returnMargin) / units;

  // === TOTAL ===
  const totalCost = materialsCost + productionCost + marketingCost + transportCost + otherCost + returnMargin;

  // === PRIX SUGGÉRÉS ===
  const suggestedPrices = {
    margin30: Math.round(totalCost / 0.70),
    margin40: Math.round(totalCost / 0.60),
    margin50: Math.round(totalCost / 0.50),
  };

  // === MARGE ACTUELLE ===
  const currentPrice = model.sellingPrice;
  let currentMargin: number | null = null;
  let currentMarginPercent: number | null = null;

  if (currentPrice && Number(currentPrice) > 0) {
    currentMargin = Number(currentPrice) - totalCost;
    currentMarginPercent = (currentMargin / Number(currentPrice)) * 100;
  }

  const breakdown: CostBreakdown = {
    fabricCost,
    accessoryCost,
    packagingCost,
    materialsCost,
    laborCost,
    atelierCost,
    productionCost,
    adsCost,
    shootingCost,
    influencerCost,
    marketingCost,
    transportCost,
    otherCost,
    returnMargin,
    totalCost,
  };

  return {
    model: {
      id: model.id,
      sku: model.sku,
      name: model.name,
      estimatedUnits: units,
      producedUnits: model.producedUnits,
    },
    breakdown,
    totalCost,
    costPerUnit: totalCost,
    suggestedPrices,
    currentPrice: currentPrice ? Number(currentPrice) : null,
    currentMargin,
    currentMarginPercent,
  };
}

// =============================================================================
// SIMULATION DE PRIX
// =============================================================================

/**
 * Simule le coût avec des paramètres modifiés
 */
export async function simulatePrice(
  modelId: string,
  params: SimulationParams
): Promise<CostResult> {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
    include: {
      bom: {
        include: { inventoryItem: true },
      },
      charges: true,
    },
  });

  if (!model) {
    throw new Error("Modèle non trouvé");
  }

  const units = params.estimatedUnits || model.estimatedUnits || 100;
  const overrides = params.overrides || {};

  // Calculer les coûts matières avec overrides
  let fabricCost = 0;
  let accessoryCost = 0;

  for (const bomItem of model.bom) {
    const unitCost = overrides[bomItem.inventoryItemId] ?? Number(bomItem.inventoryItem.averageCost);
    const itemCost = Number(bomItem.quantity) * Number(bomItem.wasteFactor) * unitCost;
    
    if (bomItem.inventoryItem.type === "FABRIC") {
      fabricCost += itemCost;
    } else {
      accessoryCost += itemCost;
    }
  }

  const packagingCost = params.packagingCost ?? (
    Number(model.packagingBox) + 
    Number(model.packagingBag) + 
    Number(model.packagingLabel) + 
    Number(model.packagingTag) + 
    Number(model.packagingCard) + 
    Number(model.packagingOther)
  );

  const materialsCost = fabricCost + accessoryCost + packagingCost;
  const laborCost = params.laborCost ?? Number(model.laborCost);

  // Charges réparties sur les unités
  const modelCharges = model.charges.filter(c => c.scope === ChargeScope.MODEL);
  const chargesPerUnit = modelCharges.reduce((sum, c) => sum + Number(c.amount), 0) / units;

  const totalCost = materialsCost + laborCost + chargesPerUnit + Number(model.returnMargin) / units;

  const suggestedPrices = {
    margin30: Math.round(totalCost / 0.70),
    margin40: Math.round(totalCost / 0.60),
    margin50: Math.round(totalCost / 0.50),
  };

  // Prix pour marge cible
  const targetMargin = params.marginTarget || 40;
  const targetPrice = Math.round(totalCost / (1 - targetMargin / 100));

  return {
    model: {
      id: model.id,
      sku: model.sku,
      name: model.name,
      estimatedUnits: units,
      producedUnits: model.producedUnits,
    },
    breakdown: {
      fabricCost,
      accessoryCost,
      packagingCost,
      materialsCost,
      laborCost: Number(laborCost),
      atelierCost: 0,
      productionCost: Number(laborCost),
      adsCost: 0,
      shootingCost: 0,
      influencerCost: 0,
      marketingCost: chargesPerUnit,
      transportCost: 0,
      otherCost: 0,
      returnMargin: Number(model.returnMargin) / units,
      totalCost,
    },
    totalCost,
    costPerUnit: totalCost,
    suggestedPrices,
    currentPrice: targetPrice,
    currentMargin: targetPrice - totalCost,
    currentMarginPercent: targetMargin,
  };
}

// =============================================================================
// RENTABILITÉ PAR MODÈLE
// =============================================================================

/**
 * Calcule la rentabilité d'un modèle basée sur les ventes réelles
 */
export async function computeModelProfitability(modelId: string): Promise<ProfitabilityResult> {
  const model = await prisma.model.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new Error("Modèle non trouvé");
  }

  // Récupérer les ventes liées à ce modèle
  const orderItems = await prisma.orderItem.findMany({
    where: { modelId },
    include: {
      order: true,
    },
  });

  // Filtrer les commandes complétées/livrées
  const completedItems = orderItems.filter(
    item => ["DELIVERED", "COMPLETED", "SHIPPED"].includes(item.order.status)
  );

  const unitsSold = completedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = completedItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  // Calculer le coût
  const costResult = await computeCostPerUnit(modelId);
  const totalCost = unitsSold * costResult.costPerUnit;

  const grossProfit = totalRevenue - totalCost;
  const grossMarginPercent = totalRevenue > 0 
    ? (grossProfit / totalRevenue) * 100 
    : 0;

  const avgSellingPrice = unitsSold > 0 ? totalRevenue / unitsSold : 0;
  const avgCostPerUnit = costResult.costPerUnit;

  let status: "PROFITABLE" | "BREAK_EVEN" | "LOSS" = "PROFITABLE";
  if (grossProfit < 0) {
    status = "LOSS";
  } else if (grossMarginPercent < 10) {
    status = "BREAK_EVEN";
  }

  return {
    modelId: model.id,
    modelName: model.name,
    modelSku: model.sku,
    totalRevenue,
    totalCost,
    grossProfit,
    grossMarginPercent,
    unitsSold,
    avgSellingPrice,
    avgCostPerUnit,
    status,
  };
}

// =============================================================================
// RENTABILITÉ PAR COLLECTION
// =============================================================================

/**
 * Calcule la rentabilité d'une collection
 */
export async function computeCollectionProfitability(
  collectionId: string
): Promise<CollectionProfitability> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      models: true,
    },
  });

  if (!collection) {
    throw new Error("Collection non trouvée");
  }

  const models: ProfitabilityResult[] = [];
  let totalRevenue = 0;
  let totalCost = 0;

  for (const model of collection.models) {
    try {
      const profitability = await computeModelProfitability(model.id);
      models.push(profitability);
      totalRevenue += profitability.totalRevenue;
      totalCost += profitability.totalCost;
    } catch (error) {
      // Ignorer les erreurs de modèles individuels
      console.error(`Erreur calcul rentabilité modèle ${model.id}:`, error);
    }
  }

  // Ajouter les charges de la collection
  const collectionCharges = await prisma.charge.findMany({
    where: {
      collectionId,
      scope: ChargeScope.COLLECTION,
    },
  });

  const chargesTotal = collectionCharges.reduce((sum, c) => sum + Number(c.amount), 0);
  totalCost += chargesTotal;

  const grossProfit = totalRevenue - totalCost;
  const grossMarginPercent = totalRevenue > 0 
    ? (grossProfit / totalRevenue) * 100 
    : 0;

  return {
    collectionId: collection.id,
    collectionName: collection.nameFr,
    totalRevenue,
    totalCost,
    grossProfit,
    grossMarginPercent,
    modelCount: models.length,
    models,
  };
}

// =============================================================================
// SNAPSHOT DE COÛTS
// =============================================================================

/**
 * Crée un snapshot des coûts d'un modèle
 */
export async function createCostSnapshot(
  modelId: string,
  batchId?: string,
  createdBy?: string
): Promise<any> {
  const costResult = await computeCostPerUnit(modelId);
  const breakdown = costResult.breakdown;

  // Générer numéro de snapshot
  const year = new Date().getFullYear();
  const prefix = `SNP-${year}-`;
  
  const last = await prisma.costSnapshot.findFirst({
    where: { snapshotNumber: { startsWith: prefix } },
    orderBy: { snapshotNumber: "desc" },
    select: { snapshotNumber: true },
  });

  let seq = 1;
  if (last?.snapshotNumber) {
    const lastSeq = parseInt(last.snapshotNumber.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  const snapshotNumber = `${prefix}${seq.toString().padStart(4, "0")}`;

  return prisma.costSnapshot.create({
    data: {
      snapshotNumber,
      modelId,
      batchId,
      fabricCost: breakdown.fabricCost,
      accessoryCost: breakdown.accessoryCost,
      packagingCost: breakdown.packagingCost,
      materialsCost: breakdown.materialsCost,
      laborCost: breakdown.laborCost,
      atelierCost: breakdown.atelierCost,
      productionCost: breakdown.productionCost,
      adsCost: breakdown.adsCost,
      shootingCost: breakdown.shootingCost,
      influencerCost: breakdown.influencerCost,
      marketingCost: breakdown.marketingCost,
      transportCost: breakdown.transportCost,
      otherCost: breakdown.otherCost,
      returnMargin: breakdown.returnMargin,
      totalCost: breakdown.totalCost,
      suggestedPrice30: costResult.suggestedPrices.margin30,
      suggestedPrice40: costResult.suggestedPrices.margin40,
      suggestedPrice50: costResult.suggestedPrices.margin50,
      sellingPrice: costResult.currentPrice,
      margin: costResult.currentMargin,
      marginPercent: costResult.currentMarginPercent,
      estimatedUnits: costResult.model.estimatedUnits,
      isLocked: true,
      createdBy,
    },
  });
}

// =============================================================================
// RAPPORTS GLOBAUX
// =============================================================================

/**
 * Rapport global des coûts et marges
 */
export async function getGlobalCostReport(): Promise<{
  totalModels: number;
  avgMargin: number;
  profitableModels: number;
  lossModels: number;
  topProfitable: ProfitabilityResult[];
  worstPerformers: ProfitabilityResult[];
}> {
  const models = await prisma.model.findMany({
    where: { isActive: true },
  });

  const results: ProfitabilityResult[] = [];

  for (const model of models) {
    try {
      const profitability = await computeModelProfitability(model.id);
      if (profitability.unitsSold > 0) {
        results.push(profitability);
      }
    } catch (error) {
      // Ignorer
    }
  }

  const profitableModels = results.filter(r => r.status === "PROFITABLE").length;
  const lossModels = results.filter(r => r.status === "LOSS").length;
  const avgMargin = results.length > 0
    ? results.reduce((sum, r) => sum + r.grossMarginPercent, 0) / results.length
    : 0;

  // Trier pour top/worst
  const sorted = [...results].sort((a, b) => b.grossMarginPercent - a.grossMarginPercent);
  const topProfitable = sorted.slice(0, 5);
  const worstPerformers = sorted.slice(-5).reverse();

  return {
    totalModels: results.length,
    avgMargin,
    profitableModels,
    lossModels,
    topProfitable,
    worstPerformers,
  };
}
