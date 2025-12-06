# 🏗️ ARCHITECTURE COMPTABILITÉ HARP V3 UNIFIÉE

**Version:** 3.0 | **Date:** Décembre 2024 | **Statut:** CONCEPTION FINALE

---

# 📋 TABLE DES MATIÈRES

1. Résumé Exécutif
2. Diagnostic Fusion V1+V2
3. Architecture V3 Idéale
4. Schéma Prisma
5. Design API
6. Design Services Métier
7. UX/UI Pages Admin
8. Workflows Détaillés
9. Plan de Migration
10. Checklist Finale

---

# 1. RÉSUMÉ EXÉCUTIF

## 1.1 Situation Actuelle

HARP exploite **deux systèmes comptables parallèles** :
- **V1** (`/admin/accounting/`) : 9 modules, partiellement fonctionnel
- **V2** (`/admin/accounting-v2/`) : 8 modules, simplifié mais incomplet

**Problèmes majeurs:**
- ❌ Doublons de code et données
- ❌ Flux cassés (réception CUMP, consommation, réconciliation)
- ❌ Confusion utilisateur
- ❌ Maintenance complexe

## 1.2 Objectif V3

**Un système unifié** couvrant tous les besoins comptables textile :

```
┌─────────────────────────────────────────────────────────────┐
│                 COMPTABILITÉ HARP V3                         │
├─────────────────────────────────────────────────────────────┤
│ ACHATS        │ STOCK          │ PRODUCTION                 │
│ ├─ Commandes  │ ├─ Inventaire  │ ├─ Lots (Batches)         │
│ ├─ Réception  │ ├─ Mouvements  │ ├─ Consommation           │
│ ├─ Avances    │ ├─ Réservation │ ├─ Coûts                  │
│ └─ Fournisseur│ └─ Réconcil.   │ └─ Snapshots              │
├─────────────────────────────────────────────────────────────┤
│ MODÈLES & COÛTS                │ CHARGES & RAPPORTS        │
│ ├─ Nomenclature (BOM)          │ ├─ Charges globales       │
│ ├─ Coût de revient             │ ├─ Charges modèle         │
│ ├─ Marges & prix               │ ├─ Allocations            │
│ └─ Simulations                 │ └─ Export PDF/Excel       │
└─────────────────────────────────────────────────────────────┘
```

## 1.3 Gains Attendus

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Modules dupliqués | 8 | 0 | -100% |
| Routes API | 15 | 45+ | +200% |
| Flux cassés | 5 | 0 | -100% |
| Couverture | 40% | 100% | +150% |

---

# 2. DIAGNOSTIC FUSION V1+V2

## 2.1 Analyse V1

### ✅ Fonctionnel
- Dashboard (KPIs)
- Fournisseurs (CRUD)
- Modèles (BOM)

### ⚠️ Partiel
- Inventaire (pas réconciliation)
- Achats (pas réception CUMP)
- Production (pas consommation)

### ❌ Cassé
- Route receive supprimée
- Service réconciliation absent
- Calcul CUMP absent

## 2.2 Analyse V2

### ✅ Fonctionnel
- Charges (nouvelle structure)
- Avances (application achats)
- UI Stock simplifiée

### ⚠️ Partiel
- Modèles (pas BOM interactif)
- Rapports (basiques)

### ❌ Manquant
- Réservation stock
- Production complète
- Application avances

## 2.3 Doublons Identifiés

```
PAGES UI:
/admin/accounting/inventory     ↔ /admin/accounting-v2/stock
/admin/accounting/models        ↔ /admin/accounting-v2/models
/admin/accounting/purchases     ↔ /admin/accounting-v2/purchases

SERVICES:
src/lib/inventory-service.ts    → 3 fonctions basiques (SUPPRIMER)
src/lib/accounting/services/*   → 5 services complets (GARDER)
```

## 2.4 Matrice de Décision

| Module | V1 | V2 | V3 |
|--------|----|----|-----|
| Dashboard | ✅ | ✅ | Fusionner |
| Fournisseurs | ✅ | ❌ | Garder V1 |
| Inventaire | ⚠️ | ⚠️ | Reconstruire |
| Modèles | ✅ | ⚠️ | V1 + BOM |
| Charges | ❌ | ✅ | Garder V2 |
| Avances | ❌ | ✅ | V2 + compléter |
| Achats | ⚠️ | ⚠️ | Reconstruire |
| Production | ⚠️ | ❌ | Reconstruire |

---

# 3. ARCHITECTURE V3

## 3.1 Stack Technique

```
┌─────────────────────────────────┐
│ FRONTEND                        │
│ Next.js 16 + React 19           │
│ TailwindCSS + Lucide            │
├─────────────────────────────────┤
│ API (Route Handlers)            │
│ Zod Validation                  │
│ requireAdmin() Middleware       │
├─────────────────────────────────┤
│ SERVICES (Business Logic)       │
│ Prisma Transactions             │
│ CUMP / Costing Algorithms       │
├─────────────────────────────────┤
│ DATABASE                        │
│ SQLite (dev) / PostgreSQL       │
└─────────────────────────────────┘
```

## 3.2 Structure Dossiers V3

```
src/
├── app/admin/compta/           # UI V3
│   ├── layout.tsx
│   ├── page.tsx                # Dashboard
│   ├── achats/
│   ├── fournisseurs/
│   ├── avances/
│   ├── stock/
│   ├── modeles/
│   ├── production/
│   ├── charges/
│   └── rapports/
│
├── app/api/v3/compta/          # API V3
│   ├── achats/
│   ├── fournisseurs/
│   ├── avances/
│   ├── stock/
│   ├── modeles/
│   ├── production/
│   ├── charges/
│   └── rapports/
│
└── lib/compta/                 # Services V3
    ├── index.ts
    ├── constants.ts
    ├── types.ts
    ├── validators.ts
    └── services/
        ├── achat.service.ts
        ├── stock.service.ts
        ├── production.service.ts
        ├── cout.service.ts
        └── ...
```

---

# 4. SCHÉMA PRISMA (Existant Optimisé)

Le schéma actuel est **bien structuré**. Ajouts recommandés :

```prisma
// Clôtures périodiques
model AccountingPeriodClose {
  id            String   @id @default(cuid())
  periodType    String   // MONTHLY | QUARTERLY
  periodStart   DateTime
  periodEnd     DateTime
  totalInventoryValue Float
  totalPurchases      Float
  totalSales          Float
  grossMargin         Float
  status        String   @default("OPEN")
  closedAt      DateTime?
  @@unique([periodType, periodStart])
}

// Alertes
model AccountingAlert {
  id        String   @id @default(cuid())
  type      String   // LOW_STOCK | NEGATIVE_MARGIN
  severity  String   // INFO | WARNING | CRITICAL
  entity    String
  entityId  String
  message   String
  isRead    Boolean  @default(false)
  isResolved Boolean @default(false)
  createdAt DateTime @default(now())
}
```

---

*Suite dans ACCOUNTING_V3_API.md*
