# HARP Comptabilité V3 - Phase 1

## Vue d'ensemble

Phase 1 couvre les fonctionnalités essentielles de gestion des achats et de l'inventaire avec calcul automatique du CUMP (Coût Unitaire Moyen Pondéré).

## Prérequis

```bash
# Démarrer le serveur de développement
npm run dev

# S'assurer que la base de données est migrée
npx prisma migrate dev

# Seeder les données de test (optionnel)
npx ts-node scripts/seed-compta-phase1.ts
```

## Authentification

Toutes les routes nécessitent une session admin. Se connecter via `/admin/login` ou obtenir un cookie de session.

```bash
# Pour les tests, obtenir le cookie de session après login
# Le cookie sera automatiquement utilisé si vous utilisez un client comme Postman ou Bruno
```

---

## Endpoints API

### Health Check

```bash
# GET /api/v3/compta - Vérifier le statut de l'API
curl -X GET "http://localhost:3000/api/v3/compta" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "version": "3.0.0",
  "phase": 1,
  "status": "healthy",
  "stats": {
    "pendingPurchases": 5,
    "inventoryItems": 150,
    "lowStockAlerts": 3
  }
}
```

---

### Achats

#### Lister les achats

```bash
# GET /api/v3/compta/purchases
curl -X GET "http://localhost:3000/api/v3/compta/purchases?page=1&pageSize=20&status=DRAFT" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Paramètres de requête:**
- `page` (int): Page de résultats (défaut: 1)
- `pageSize` (int): Nombre par page (défaut: 20, max: 100)
- `status` (string): Filtrer par statut (DRAFT, ORDERED, PARTIAL, RECEIVED, CANCELLED)
- `supplierId` (string): Filtrer par fournisseur
- `search` (string): Recherche sur numéro d'achat ou facture

---

#### Créer un achat

```bash
# POST /api/v3/compta/purchases
curl -X POST "http://localhost:3000/api/v3/compta/purchases" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "supplierId": "clp123abc",
    "invoiceNumber": "FAC-2025-001",
    "items": [
      {
        "inventoryItemId": "inv001",
        "quantityOrdered": 100,
        "unitPrice": 600.00
      },
      {
        "inventoryItemId": "inv002",
        "quantityOrdered": 50,
        "unitPrice": 1200.00
      }
    ]
  }'
```

**Réponse (201):**
```json
{
  "success": true,
  "purchase": {
    "id": "clxyz...",
    "purchaseNumber": "ACH-2025-001",
    "status": "DRAFT",
    "totalAmount": 120000,
    "supplier": { "name": "Fournisseur X" },
    "items": [...]
  }
}
```

---

#### Détail d'un achat

```bash
# GET /api/v3/compta/purchases/{id}
curl -X GET "http://localhost:3000/api/v3/compta/purchases/clxyz123" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

#### Prévisualiser la réception

Cette endpoint calcule l'impact sur les stocks et CUMP **sans modifier la base de données**.

```bash
# POST /api/v3/compta/purchases/{id}/preview
curl -X POST "http://localhost:3000/api/v3/compta/purchases/clxyz123/preview" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "items": [
      {
        "purchaseItemId": "pi123",
        "quantityReceived": 50
      }
    ]
  }'
```

**Réponse:**
```json
{
  "success": true,
  "purchaseId": "clxyz123",
  "purchaseNumber": "ACH-2025-001",
  "stockUpdates": [
    {
      "inventoryItemId": "inv001",
      "sku": "TISSU-001",
      "name": "Tissu Coton",
      "previousQty": 100,
      "receivedQty": 50,
      "newQty": 150,
      "previousCUMP": 500.00,
      "unitPrice": 600.00,
      "newCUMP": 533.33,
      "previousValue": 50000.00,
      "newValue": 80000.00
    }
  ],
  "summary": {
    "totalItemsToReceive": 1,
    "totalValueIncrease": 30000.00
  }
}
```

---

#### Réceptionner un achat

Opération **transactionnelle** qui met à jour les stocks, calcule les CUMP, et enregistre l'audit.

```bash
# POST /api/v3/compta/purchases/{id}/receive
curl -X POST "http://localhost:3000/api/v3/compta/purchases/clxyz123/receive" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "items": [
      {
        "purchaseItemId": "pi123",
        "quantityReceived": 50
      }
    ],
    "receivedBy": "admin@harp.dz",
    "notes": "Livraison partielle - reste 50 unités"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "purchase": {
    "id": "clxyz123",
    "purchaseNumber": "ACH-2025-001",
    "status": "PARTIAL"
  },
  "stockUpdates": [
    {
      "inventoryItemId": "inv001",
      "sku": "TISSU-001",
      "previousQty": 100,
      "receivedQty": 50,
      "newQty": 150,
      "previousCUMP": 500.00,
      "newCUMP": 533.33
    }
  ],
  "message": "Réception enregistrée, stock mis à jour"
}
```

---

### Inventaire

#### Lister l'inventaire

```bash
# GET /api/v3/compta/inventory
curl -X GET "http://localhost:3000/api/v3/compta/inventory?type=FABRIC&lowStock=true" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Paramètres:**
- `type`: FABRIC, ACCESSORY, PACKAGING, FINISHED, TRIM, LABEL
- `lowStock`: true/false - Filtrer les articles sous le seuil
- `search`: Recherche sur SKU ou nom
- `isActive`: true/false

---

#### Créer un article d'inventaire

```bash
# POST /api/v3/compta/inventory
curl -X POST "http://localhost:3000/api/v3/compta/inventory" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "sku": "TISSU-COTON-001",
    "name": "Tissu Coton Premium",
    "type": "FABRIC",
    "unit": "METER",
    "quantity": 100,
    "averageCost": 500,
    "threshold": 20,
    "color": "Blanc",
    "width": 150,
    "composition": "100% Coton"
  }'
```

---

#### Détail d'un article

```bash
# GET /api/v3/compta/inventory/{id}
curl -X GET "http://localhost:3000/api/v3/compta/inventory/inv001" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "item": {
    "id": "inv001",
    "sku": "TISSU-001",
    "name": "Tissu Coton",
    "quantity": 150,
    "reserved": 20,
    "available": 130,
    "averageCost": 533.33,
    "totalValue": 79999.50,
    "transactions": [
      {
        "direction": "IN",
        "type": "PURCHASE",
        "quantity": 50,
        "unitCost": 600,
        "balanceBefore": 100,
        "balanceAfter": 150,
        "createdAt": "2025-12-02T10:00:00Z"
      }
    ]
  }
}
```

---

#### Ajustement de stock

```bash
# POST /api/v3/compta/inventory/adjustment
curl -X POST "http://localhost:3000/api/v3/compta/inventory/adjustment" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "inventoryItemId": "inv001",
    "adjustmentType": "ADD",
    "quantity": 10,
    "reason": "Correction après inventaire physique"
  }'
```

**Types d'ajustement:**
- `ADD`: Ajoute une quantité
- `REMOVE`: Retire une quantité (erreur si stock insuffisant)
- `SET`: Définit une quantité exacte

---

#### Réconciliation

```bash
# GET /api/v3/compta/inventory/reconcile
curl -X GET "http://localhost:3000/api/v3/compta/inventory/reconcile" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "mismatches": [
    {
      "inventoryItemId": "inv001",
      "sku": "TISSU-001",
      "name": "Tissu Coton",
      "expectedQty": 150,
      "actualQty": 148,
      "variance": -2,
      "variancePercent": -1.33
    }
  ],
  "stats": {
    "totalItems": 150,
    "matched": 148,
    "mismatched": 2,
    "criticalMismatches": 0
  },
  "message": "2 écart(s) détecté(s)"
}
```

---

## Formule CUMP

Le Coût Unitaire Moyen Pondéré est calculé ainsi:

```
newCUMP = (oldQty × oldCUMP + receivedQty × unitPrice) / (oldQty + receivedQty)
```

**Exemple:**
- Stock actuel: 100 unités à 500 DZD
- Réception: 50 unités à 600 DZD
- Nouveau CUMP: (100 × 500 + 50 × 600) / 150 = **533.33 DZD**

**Cas spéciaux:**
- Si stock initial = 0: CUMP = prix unitaire de réception
- Si quantité reçue = 0: CUMP reste inchangé

---

## Codes d'erreur

| Code HTTP | Description |
|-----------|-------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Erreur de validation |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 422 | Erreur métier (stock insuffisant, etc.) |
| 500 | Erreur serveur |

---

## Tests

```bash
# Exécuter les tests unitaires
npm run test

# Exécuter les tests de comptabilité
npm run test:compta

# Exécuter avec couverture
npm run test:coverage
```

---

## Smoke Tests

Séquence de validation rapide:

```bash
# 1. Health check
curl -s "http://localhost:3000/api/v3/compta" | jq '.status'
# Attendu: "healthy"

# 2. Lister l'inventaire
curl -s "http://localhost:3000/api/v3/compta/inventory?pageSize=5" | jq '.items | length'
# Attendu: nombre d'articles

# 3. Lister les achats
curl -s "http://localhost:3000/api/v3/compta/purchases?pageSize=5" | jq '.items | length'
# Attendu: nombre d'achats

# 4. Réconciliation
curl -s "http://localhost:3000/api/v3/compta/inventory/reconcile" | jq '.stats'
# Attendu: objet stats
```

---

## Architecture

```
src/
├── lib/compta/
│   ├── accounting.ts       # Calculs CUMP, valeurs
│   ├── index.ts            # Exports
│   ├── schemas/
│   │   └── purchase.schemas.ts  # Zod schemas
│   └── services/
│       ├── inventory-service.ts
│       └── purchases-service.ts
│
└── app/api/v3/compta/
    ├── route.ts            # Health check
    ├── purchases/
    │   ├── route.ts        # GET, POST
    │   └── [id]/
    │       ├── route.ts    # GET, PUT, DELETE
    │       ├── preview/
    │       │   └── route.ts
    │       └── receive/
    │           └── route.ts
    └── inventory/
        ├── route.ts        # GET, POST
        ├── [id]/
        │   └── route.ts    # GET
        ├── adjustment/
        │   └── route.ts    # POST
        └── reconcile/
            └── route.ts    # GET
```

---

## Phase 2 Preview

- Gestion des avances fournisseurs
- Production et consommation de stock
- Calcul des coûts de revient par modèle
- Rapports et tableaux de bord
