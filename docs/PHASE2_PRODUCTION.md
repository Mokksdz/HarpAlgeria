# HARP Comptabilité V3 - Phase 2: Production

## Vue d'ensemble

Le module Production permet de gérer les lots de production avec:
- Calcul automatique des besoins matières basé sur le BOM
- Consommation de stock avec transactions OUT
- Support des pertes/déchets (wasteFactor)
- Calcul du coût de revient par lot et par unité

## Cycle de vie d'un lot

```
┌─────────┐    consume()    ┌─────────────┐    complete()    ┌───────────┐
│ PLANNED │ ───────────────→ │ IN_PROGRESS │ ────────────────→ │ COMPLETED │
└─────────┘                  └─────────────┘                   └───────────┘
     │                             │
     │ cancel()                    │ pause()
     ↓                             ↓
┌───────────┐              ┌─────────┐
│ CANCELLED │              │ ON_HOLD │
└───────────┘              └─────────┘
```

## Formules de calcul

### Besoins matières
```
requiredQty = bom.quantity × wasteFactor × plannedQty
```

**Exemple:**
- BOM: 2.5m de tissu par unité
- Waste factor: 1.05 (5% de perte)
- Quantité planifiée: 100 unités
- **Besoins: 2.5 × 1.05 × 100 = 262.5 mètres**

### Coût matières
```
materialsCost = Σ(requiredQty × averageCost)
```

### Coût total
```
totalCost = materialsCost + laborCost + overheadCost + (model.otherCost × producedQty)
```

### Coût par unité
```
costPerUnit = totalCost / producedQty
```

---

## API Endpoints

### Lister les lots

```bash
curl -X GET "http://localhost:3000/api/v3/compta/production?status=IN_PROGRESS" \
  -H "Cookie: next-auth.session-token=..."
```

**Paramètres:**
- `page`: Page (défaut: 1)
- `limit`: Résultats par page (défaut: 20)
- `status`: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD
- `modelId`: Filtrer par modèle

---

### Créer un lot

```bash
curl -X POST "http://localhost:3000/api/v3/compta/production" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "modelId": "clmodel123",
    "plannedQty": 120,
    "laborCost": 36000,
    "overheadCost": 6000,
    "notes": "Collection Été 2025"
  }'
```

**Réponse (201):**
```json
{
  "success": true,
  "batch": {
    "id": "clbatch123",
    "batchNumber": "LOT-2025-0001",
    "status": "PLANNED",
    "plannedQty": 120,
    "model": { "sku": "ROBE-001", "name": "Robe Été" }
  }
}
```

---

### Prévisualiser les besoins matières

```bash
curl -X GET "http://localhost:3000/api/v3/compta/production/clbatch123/preview" \
  -H "Cookie: next-auth.session-token=..."
```

**Réponse:**
```json
{
  "success": true,
  "batchId": "clbatch123",
  "batchNumber": "LOT-2025-0001",
  "modelSku": "ROBE-001",
  "modelName": "Robe Été",
  "plannedQty": 120,
  "requirements": [
    {
      "inventoryItemId": "clinv001",
      "sku": "TISSU-COTON-001",
      "name": "Tissu Coton Premium",
      "unit": "METER",
      "bomQtyPerUnit": 2.5,
      "wasteFactor": 1.05,
      "required": 315,
      "available": 500,
      "shortage": 0,
      "unitCost": 600,
      "totalCost": 189000,
      "canConsume": true
    },
    {
      "inventoryItemId": "clinv002",
      "sku": "BOUTON-001",
      "name": "Bouton Nacre 12mm",
      "unit": "PIECE",
      "bomQtyPerUnit": 6,
      "wasteFactor": 1.0,
      "required": 720,
      "available": 1000,
      "shortage": 0,
      "unitCost": 15,
      "totalCost": 10800,
      "canConsume": true
    }
  ],
  "hasShortage": false,
  "totalMaterialsCost": 199800,
  "estimatedCostPerUnit": 1665,
  "canProceed": true
}
```

---

### Consommer les matières (Démarrer production)

```bash
curl -X POST "http://localhost:3000/api/v3/compta/production/clbatch123/consume" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{}'
```

**Réponse:**
```json
{
  "success": true,
  "batch": {
    "id": "clbatch123",
    "status": "IN_PROGRESS",
    "startedAt": "2025-12-02T19:00:00.000Z",
    "materialsCost": 199800
  },
  "totalMaterialsCost": 199800,
  "consumptions": [
    {
      "inventoryItemId": "clinv001",
      "sku": "TISSU-COTON-001",
      "quantity": 315,
      "unitCost": 600,
      "totalCost": 189000
    }
  ],
  "message": "Production démarrée, matières consommées"
}
```

**Actions effectuées:**
1. ✅ Stock déduit de `InventoryItem.quantity`
2. ✅ Transactions `OUT` créées dans `InventoryTransaction`
3. ✅ `BatchConsumption` créés
4. ✅ `status` = `IN_PROGRESS`, `startedAt` = now()
5. ✅ `AuditLog` créé

---

### Terminer le lot

```bash
curl -X POST "http://localhost:3000/api/v3/compta/production/clbatch123/complete" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "producedQty": 115,
    "wasteQty": 5
  }'
```

**Réponse:**
```json
{
  "success": true,
  "batch": {
    "id": "clbatch123",
    "batchNumber": "LOT-2025-0001",
    "status": "COMPLETED",
    "producedQty": 115,
    "wasteQty": 5,
    "completedAt": "2025-12-05T18:00:00.000Z"
  },
  "costs": {
    "materialsCost": 199800,
    "laborCost": 36000,
    "overheadCost": 6000,
    "otherCost": 5750,
    "totalCost": 247550,
    "costPerUnit": 2152.61
  },
  "message": "Lot terminé: 115 unités produites, coût/unité: 2152.61 DZD"
}
```

---

## Structure BOM

Le BOM (Bill of Materials) définit les composants nécessaires par unité:

| Champ | Type | Description |
|-------|------|-------------|
| `modelId` | string | Modèle parent |
| `inventoryItemId` | string | Article d'inventaire |
| `quantity` | float | Quantité par unité produite |
| `wasteFactor` | float | Facteur de perte (défaut: 1.05 = 5%) |

**Exemple BOM pour une robe:**

| Article | Quantité | Waste | Effectif/unité |
|---------|----------|-------|----------------|
| Tissu Coton | 2.5 m | 5% | 2.625 m |
| Fermeture | 1 pcs | 0% | 1 pcs |
| Boutons | 6 pcs | 0% | 6 pcs |
| Étiquette | 1 pcs | 10% | 1.1 pcs |

---

## Transactions d'inventaire

Lors de la consommation, des transactions `OUT` sont créées:

```json
{
  "inventoryItemId": "clinv001",
  "direction": "OUT",
  "type": "PRODUCTION",
  "quantity": 315,
  "unitCost": 600,
  "balanceBefore": 500,
  "balanceAfter": 185,
  "referenceType": "BATCH",
  "referenceId": "clbatch123"
}
```

**Note:** Le CUMP (averageCost) ne change pas lors d'une sortie de stock.

---

## Pages Admin

### `/admin/compta/production`
Liste des lots avec filtres par statut et modèle.

### `/admin/compta/production/new`
Formulaire de création de lot:
- Sélection du modèle
- Quantité planifiée
- Coûts MO et atelier

### `/admin/compta/production/[id]`
Détail du lot avec:
- Informations générales
- Progression
- Matières consommées
- Répartition des coûts
- Actions (Démarrer / Terminer)

### `/admin/compta/production/[id]/consume`
Page de prévisualisation et consommation:
- Tableau des besoins BOM
- Vérification stock disponible
- Alerte si rupture
- Bouton de démarrage

---

## Tests

```bash
# Tests unitaires production
npm run test -- --testPathPattern=production

# Tous les tests compta
npm run test:compta
```

---

## Smoke Tests

```bash
# 1. Créer un lot
curl -X POST "http://localhost:3000/api/v3/compta/production" \
  -H "Content-Type: application/json" \
  -H "Cookie: ..." \
  -d '{"modelId": "MODEL_ID", "plannedQty": 10}'

# 2. Prévisualiser
curl "http://localhost:3000/api/v3/compta/production/BATCH_ID/preview" \
  -H "Cookie: ..."

# 3. Consommer (si canProceed=true)
curl -X POST "http://localhost:3000/api/v3/compta/production/BATCH_ID/consume" \
  -H "Cookie: ..."

# 4. Terminer
curl -X POST "http://localhost:3000/api/v3/compta/production/BATCH_ID/complete" \
  -H "Content-Type: application/json" \
  -H "Cookie: ..." \
  -d '{"producedQty": 10, "wasteQty": 0}'
```

---

## Architecture

```
src/lib/compta/
├── schemas/
│   └── production.schemas.ts    # Zod schemas
└── services/
    └── production-service.ts    # Business logic

src/app/api/v3/compta/production/
├── route.ts                     # GET list, POST create
└── [id]/
    ├── route.ts                 # GET detail, PUT update, DELETE
    ├── preview/route.ts         # GET preview BOM
    ├── consume/route.ts         # GET info, POST consume
    └── complete/route.ts        # POST complete

src/app/admin/compta/production/
├── page.tsx                     # List
├── new/page.tsx                 # Create form
└── [id]/
    ├── page.tsx                 # Detail + complete modal
    └── consume/page.tsx         # Consume preview
```
