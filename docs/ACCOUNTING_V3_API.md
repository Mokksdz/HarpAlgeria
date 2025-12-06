# 🔌 DESIGN API COMPTABILITÉ V3

**Suite de:** ACCOUNTING_V3_ARCHITECTURE.md

---

# 5. DESIGN API COMPLET

## 5.1 Conventions

```
Base URL: /api/v3/compta
- Noms français pour cohérence métier
- Pluriel pour collections
- Verbes explicites (receive, consume, apply)
- Query params pour filtres
- Body JSON pour mutations
```

## 5.2 Routes Fournisseurs

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/fournisseurs` | Liste paginée |
| POST | `/fournisseurs` | Créer |
| GET | `/fournisseurs/:id` | Détail |
| PUT | `/fournisseurs/:id` | Modifier |
| DELETE | `/fournisseurs/:id` | Supprimer |
| GET | `/fournisseurs/:id/solde` | Solde avances-dû |

## 5.3 Routes Achats

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/achats` | Liste |
| POST | `/achats` | Créer |
| GET | `/achats/:id` | Détail |
| PUT | `/achats/:id` | Modifier (brouillon) |
| DELETE | `/achats/:id` | Supprimer (brouillon) |
| PATCH | `/achats/:id/order` | Passer commande |
| PATCH | `/achats/:id/cancel` | Annuler |
| GET | `/achats/:id/preview` | **Aperçu CUMP** |
| POST | `/achats/:id/receive` | **Réceptionner** |

### Schéma Zod - Réception

```typescript
const AchatReceiveSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantityReceived: z.number().min(0)
  })),
  receivedBy: z.string().optional()
});
```

## 5.4 Routes Avances

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/avances` | Liste |
| POST | `/avances` | Créer |
| GET | `/avances/:id` | Détail |
| PUT | `/avances/:id` | Modifier |
| POST | `/avances/:id/apply` | **Appliquer à achat** |
| DELETE | `/avances/:id/apply/:purchaseId` | Annuler |
| POST | `/avances/:id/refund` | Rembourser |

### Schéma Zod - Application

```typescript
const AvanceApplySchema = z.object({
  purchaseId: z.string().min(1),
  amount: z.number().positive()
});
```

## 5.5 Routes Stock

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/stock` | Liste inventaire |
| POST | `/stock` | Créer article |
| GET | `/stock/:id` | Détail |
| PUT | `/stock/:id` | Modifier |
| GET | `/stock/transactions` | Historique |
| POST | `/stock/adjustment` | **Ajustement** |
| POST | `/stock/reconcile` | **Réconciliation** |
| GET | `/stock/valuation` | Valorisation |
| GET | `/stock/alerts` | Alertes stock bas |

### Schéma Zod - Ajustement

```typescript
const StockAdjustmentSchema = z.object({
  inventoryItemId: z.string(),
  quantity: z.number(), // + ou -
  reason: z.enum([
    "INVENTORY_COUNT",
    "DAMAGE",
    "THEFT",
    "CORRECTION",
    "OTHER"
  ]),
  notes: z.string().optional()
});
```

## 5.6 Routes Modèles & BOM

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/modeles` | Liste |
| POST | `/modeles` | Créer |
| GET | `/modeles/:id` | Détail |
| PUT | `/modeles/:id` | Modifier |
| GET | `/modeles/:id/bom` | Nomenclature |
| POST | `/modeles/:id/bom` | Ajouter BOM |
| DELETE | `/modeles/:id/bom/:itemId` | Supprimer BOM |
| GET | `/modeles/:id/costs` | **Calculer coûts** |
| POST | `/modeles/:id/costs/simulate` | Simulation |
| POST | `/modeles/:id/costs/snapshot` | Snapshot |

## 5.7 Routes Production

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/production` | Liste lots |
| POST | `/production` | Créer lot |
| GET | `/production/:id` | Détail |
| PATCH | `/production/:id/start` | Démarrer |
| PATCH | `/production/:id/complete` | Terminer |
| PATCH | `/production/:id/cancel` | Annuler |
| GET | `/production/:id/preview` | Aperçu conso |
| POST | `/production/:id/consume` | **Consommer** |

### Schéma Zod - Consommation

```typescript
const ProductionConsumeSchema = z.object({
  consumptions: z.array(z.object({
    inventoryItemId: z.string(),
    quantity: z.number().positive()
  })).optional(), // Si vide → BOM
  createSnapshot: z.boolean().default(true)
});
```

## 5.8 Routes Charges

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/charges` | Liste |
| POST | `/charges` | Créer |
| GET | `/charges/:id` | Détail |
| PUT | `/charges/:id` | Modifier |
| DELETE | `/charges/:id` | Supprimer |
| POST | `/charges/:id/allocate` | Allouer modèles |
| GET | `/charges/by-category` | Par catégorie |

## 5.9 Routes Rapports

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/rapports/dashboard` | KPIs |
| GET | `/rapports/profitability` | Rentabilité |
| GET | `/rapports/profitability/models` | Par modèle |
| GET | `/rapports/inventory` | État stock |
| POST | `/rapports/export` | Export PDF/Excel |

## 5.10 Codes HTTP

| Code | Usage |
|------|-------|
| 200 | Succès GET/PUT/PATCH |
| 201 | Création POST |
| 204 | Suppression DELETE |
| 400 | Erreur validation |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 409 | Conflit (stock insuffisant) |
| 422 | Erreur métier |

## 5.11 Format Erreur

```typescript
{
  success: false,
  error: "Stock insuffisant",
  code: "INSUFFICIENT_STOCK",
  details: [
    { field: "TIS-001", message: "Requis: 150m, Dispo: 80m" }
  ],
  hint: "Réduisez la quantité ou approvisionnez"
}
```

---

# 6. DESIGN SERVICES MÉTIER

## 6.1 Architecture

```
┌────────────────────────────────────────────┐
│              SERVICE LAYER                  │
├────────────────────────────────────────────┤
│  Achat.Service  Avance.Service             │
│       │              │                      │
│       └──────┬───────┘                      │
│              ▼                              │
│       Stock.Service ◄── CUMP, Réservation  │
│              │                              │
│       ┌──────┴──────┐                       │
│       ▼             ▼                       │
│  Modele.Svc   Production.Svc               │
│       │             │                       │
│       └──────┬──────┘                       │
│              ▼                              │
│        Cout.Service ◄── Calculs, Marges    │
│              │                              │
│              ▼                              │
│       Rapport.Service ◄── Agrégations      │
└────────────────────────────────────────────┘
```

## 6.2 Service Stock (Core)

### Calcul CUMP

```typescript
export function calculateCUMP(
  currentQty: number,
  currentAvgCost: number,
  incomingQty: number,
  incomingCost: number
) {
  const currentValue = currentQty * currentAvgCost;
  const incomingValue = incomingQty * incomingCost;
  const newQty = currentQty + incomingQty;
  
  const newAvgCost = newQty > 0
    ? (currentValue + incomingValue) / newQty
    : incomingCost;
  
  return {
    newQuantity: newQty,
    newAverageCost: Math.round(newAvgCost * 100) / 100,
    newTotalValue: Math.round(newQty * newAvgCost * 100) / 100
  };
}
```

### Mouvement Stock

```typescript
export async function createStockMovement(params: {
  inventoryItemId: string;
  direction: "IN" | "OUT";
  type: string;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    // 1. Récupérer article
    const item = await tx.inventoryItem.findUnique({...});
    
    // 2. Calculer nouvelles valeurs
    if (direction === "IN") {
      // CUMP recalculé
    } else {
      // Vérifier disponibilité
      if (item.available < quantity) throw Error;
    }
    
    // 3. Créer transaction
    const transaction = await tx.inventoryTransaction.create({...});
    
    // 4. Mettre à jour article
    const updated = await tx.inventoryItem.update({...});
    
    return { transaction, item: updated };
  });
}
```

### Réservation

```typescript
export async function reserveStock(
  inventoryItemId: string,
  quantity: number,
  referenceType: string,
  referenceId: string
) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({...});
    
    if (item.available < quantity) {
      throw new Error("Stock insuffisant");
    }
    
    // Transaction RESERVE
    await tx.inventoryTransaction.create({
      direction: "OUT",
      type: "RESERVE",
      quantity,
      balanceBefore: item.quantity,
      balanceAfter: item.quantity, // Inchangé
    });
    
    // Mettre à jour reserved/available
    await tx.inventoryItem.update({
      reserved: item.reserved + quantity,
      available: item.available - quantity
    });
  });
}
```

## 6.3 Service Achat

### Réception avec CUMP

```typescript
export async function receivePurchase(
  purchaseId: string,
  items: Array<{ id: string; quantityReceived: number }>,
  receivedBy?: string
) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({...});
    
    const stockUpdates = [];
    
    for (const receiveItem of items) {
      const purchaseItem = purchase.items.find(i => i.id === receiveItem.id);
      
      // Créer mouvement stock IN
      const result = await createStockMovement({
        inventoryItemId: purchaseItem.inventoryItemId,
        direction: "IN",
        type: "PURCHASE",
        quantity: receiveItem.quantityReceived,
        unitCost: purchaseItem.unitPrice,
        referenceType: "PURCHASE",
        referenceId: purchaseId
      });
      
      // Mettre à jour ligne achat
      await tx.purchaseItem.update({
        where: { id: receiveItem.id },
        data: { 
          quantityReceived: purchaseItem.quantityReceived + receiveItem.quantityReceived 
        }
      });
      
      stockUpdates.push(result);
    }
    
    // Déterminer nouveau statut
    const allReceived = purchase.items.every(
      i => i.quantityReceived >= i.quantityOrdered
    );
    const status = allReceived ? "RECEIVED" : "PARTIAL";
    
    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status, receivedDate: new Date(), receivedBy }
    });
    
    return { purchase, stockUpdates };
  });
}
```

## 6.4 Service Production

### Consommation Matières

```typescript
export async function consumeProductionBatch(
  batchId: string,
  consumptions?: Array<{ inventoryItemId: string; quantity: number }>
) {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      include: { model: { include: { bom: true } } }
    });
    
    // Utiliser BOM si pas de consommations spécifiées
    const toConsume = consumptions || batch.model.bom.map(b => ({
      inventoryItemId: b.inventoryItemId,
      quantity: b.quantity * b.wasteFactor * batch.plannedQty
    }));
    
    let totalMaterialsCost = 0;
    
    for (const item of toConsume) {
      // Vérifier disponibilité
      const invItem = await tx.inventoryItem.findUnique({...});
      if (invItem.available < item.quantity) {
        throw new Error(`Stock insuffisant: ${invItem.sku}`);
      }
      
      // Créer mouvement OUT
      await createStockMovement({
        inventoryItemId: item.inventoryItemId,
        direction: "OUT",
        type: "PRODUCTION",
        quantity: item.quantity,
        referenceType: "BATCH",
        referenceId: batchId
      });
      
      // Enregistrer consommation
      await tx.batchConsumption.create({
        data: {
          batchId,
          inventoryItemId: item.inventoryItemId,
          plannedQty: item.quantity,
          actualQty: item.quantity,
          unitCost: invItem.averageCost,
          totalCost: item.quantity * invItem.averageCost
        }
      });
      
      totalMaterialsCost += item.quantity * invItem.averageCost;
    }
    
    // Mettre à jour lot
    await tx.productionBatch.update({
      where: { id: batchId },
      data: {
        status: "IN_PROGRESS",
        materialsCost: totalMaterialsCost,
        startedAt: new Date()
      }
    });
  });
}
```

## 6.5 Service Coût

### Calcul Coût de Revient

```typescript
export async function computeCostPerUnit(modelId: string) {
  const model = await prisma.model.findUnique({
    include: {
      bom: { include: { inventoryItem: true } },
      charges: true,
      collection: { include: { charges: true } }
    }
  });
  
  // 1. Coût matières (BOM × CUMP)
  let fabricCost = 0, accessoryCost = 0, packagingCost = 0;
  
  for (const bomItem of model.bom) {
    const cost = bomItem.quantity * bomItem.wasteFactor * bomItem.inventoryItem.averageCost;
    
    switch (bomItem.inventoryItem.type) {
      case "FABRIC": fabricCost += cost; break;
      case "ACCESSORY": accessoryCost += cost; break;
      case "PACKAGING": packagingCost += cost; break;
    }
  }
  const materialsCost = fabricCost + accessoryCost + packagingCost;
  
  // 2. Coûts production
  const laborCost = model.laborCost;
  const atelierCost = model.charges
    .filter(c => c.category === "ATELIER")
    .reduce((sum, c) => sum + c.amount, 0) / model.estimatedUnits;
  const productionCost = laborCost + atelierCost;
  
  // 3. Coûts marketing (répartis)
  const adsCost = getChargePerUnit(model, "ADS");
  const shootingCost = getChargePerUnit(model, "SHOOTING");
  const influencerCost = getChargePerUnit(model, "INFLUENCER");
  const marketingCost = adsCost + shootingCost + influencerCost;
  
  // 4. Autres
  const transportCost = getChargePerUnit(model, "TRANSPORT");
  const otherCost = model.otherCost;
  const returnMargin = model.returnMargin;
  
  // 5. Total
  const totalCost = materialsCost + productionCost + marketingCost 
                  + transportCost + otherCost + returnMargin;
  
  // 6. Prix suggérés
  const suggestedPrices = {
    margin30: totalCost / 0.70,
    margin40: totalCost / 0.60,
    margin50: totalCost / 0.50
  };
  
  // 7. Marge actuelle
  const currentPrice = model.sellingPrice;
  const currentMargin = currentPrice ? currentPrice - totalCost : null;
  const currentMarginPercent = currentPrice 
    ? (currentMargin / currentPrice) * 100 
    : null;
  
  return {
    model: { id: model.id, sku: model.sku, name: model.name },
    breakdown: {
      fabricCost, accessoryCost, packagingCost, materialsCost,
      laborCost, atelierCost, productionCost,
      adsCost, shootingCost, influencerCost, marketingCost,
      transportCost, otherCost, returnMargin,
      totalCost
    },
    suggestedPrices,
    currentPrice,
    currentMargin,
    currentMarginPercent
  };
}
```

---

*Suite dans ACCOUNTING_V3_UI.md*
