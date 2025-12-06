-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionFr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "images" TEXT NOT NULL,
    "sizes" TEXT NOT NULL,
    "colors" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showSizeGuide" BOOLEAN NOT NULL DEFAULT true,
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "freeShippingThreshold" DECIMAL DEFAULT 0,
    "collectionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "budget" DECIMAL NOT NULL DEFAULT 0,
    "budgetUsed" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerCity" TEXT NOT NULL,
    "customerWilaya" TEXT NOT NULL,
    "deliveryProvider" TEXT,
    "deliveryType" TEXT,
    "shippingPrice" DECIMAL NOT NULL DEFAULT 0,
    "trackingNumber" TEXT,
    "trackingStatus" TEXT,
    "subtotal" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stockReserved" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "modelId" TEXT,
    "productName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Algérie',
    "taxId" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "invoiceDate" DATETIME,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "advanceApplied" DECIMAL NOT NULL DEFAULT 0,
    "amountDue" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "receivedBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityOrdered" DECIMAL NOT NULL,
    "quantityReceived" DECIMAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "totalPrice" DECIMAL NOT NULL,
    "allocations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advanceNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "amountUsed" DECIMAL NOT NULL DEFAULT 0,
    "amountRemaining" DECIMAL NOT NULL DEFAULT 0,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierAdvance_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseId" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedBy" TEXT,
    CONSTRAINT "PurchaseAdvance_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseAdvance_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "SupplierAdvance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL DEFAULT 0,
    "reserved" DECIMAL NOT NULL DEFAULT 0,
    "available" DECIMAL NOT NULL DEFAULT 0,
    "averageCost" DECIMAL NOT NULL DEFAULT 0,
    "lastCost" DECIMAL NOT NULL DEFAULT 0,
    "totalValue" DECIMAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "width" DECIMAL,
    "composition" TEXT,
    "location" TEXT,
    "threshold" DECIMAL,
    "supplierId" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastReceivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unitCost" DECIMAL,
    "balanceBefore" DECIMAL NOT NULL,
    "balanceAfter" DECIMAL NOT NULL,
    "valueBefore" DECIMAL,
    "valueAfter" DECIMAL,
    "avgCostBefore" DECIMAL,
    "avgCostAfter" DECIMAL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "productId" TEXT,
    "inventoryItemId" TEXT,
    "collectionId" TEXT,
    "targetPrice" DECIMAL,
    "sellingPrice" DECIMAL,
    "estimatedUnits" INTEGER NOT NULL DEFAULT 100,
    "producedUnits" INTEGER NOT NULL DEFAULT 0,
    "laborCost" DECIMAL NOT NULL DEFAULT 0,
    "packagingCost" DECIMAL NOT NULL DEFAULT 0,
    "otherCost" DECIMAL NOT NULL DEFAULT 0,
    "returnMargin" DECIMAL NOT NULL DEFAULT 150,
    "packagingBox" DECIMAL NOT NULL DEFAULT 0,
    "packagingBag" DECIMAL NOT NULL DEFAULT 0,
    "packagingLabel" DECIMAL NOT NULL DEFAULT 0,
    "packagingTag" DECIMAL NOT NULL DEFAULT 0,
    "packagingCard" DECIMAL NOT NULL DEFAULT 0,
    "packagingOther" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BomItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "wasteFactor" DECIMAL NOT NULL DEFAULT 1.05,
    "unitCost" DECIMAL,
    "totalCost" DECIMAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BomItem_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BomItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chargeNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "collectionId" TEXT,
    "modelId" TEXT,
    "isAllocated" BOOLEAN NOT NULL DEFAULT false,
    "allocations" TEXT,
    "vendor" TEXT,
    "invoiceRef" TEXT,
    "campaign" TEXT,
    "platform" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Charge_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Charge_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "plannedQty" INTEGER NOT NULL,
    "producedQty" INTEGER NOT NULL DEFAULT 0,
    "wasteQty" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "materialsCost" DECIMAL NOT NULL DEFAULT 0,
    "laborCost" DECIMAL NOT NULL DEFAULT 0,
    "overheadCost" DECIMAL NOT NULL DEFAULT 0,
    "totalCost" DECIMAL NOT NULL DEFAULT 0,
    "costPerUnit" DECIMAL NOT NULL DEFAULT 0,
    "plannedDate" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "costSnapshotId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionBatch_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BatchConsumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "plannedQty" DECIMAL NOT NULL,
    "actualQty" DECIMAL NOT NULL DEFAULT 0,
    "unitCost" DECIMAL NOT NULL,
    "totalCost" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BatchConsumption_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductionBatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BatchConsumption_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotNumber" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "batchId" TEXT,
    "fabricCost" DECIMAL NOT NULL DEFAULT 0,
    "accessoryCost" DECIMAL NOT NULL DEFAULT 0,
    "packagingCost" DECIMAL NOT NULL DEFAULT 0,
    "materialsCost" DECIMAL NOT NULL DEFAULT 0,
    "laborCost" DECIMAL NOT NULL DEFAULT 0,
    "atelierCost" DECIMAL NOT NULL DEFAULT 0,
    "productionCost" DECIMAL NOT NULL DEFAULT 0,
    "adsCost" DECIMAL NOT NULL DEFAULT 0,
    "shootingCost" DECIMAL NOT NULL DEFAULT 0,
    "influencerCost" DECIMAL NOT NULL DEFAULT 0,
    "marketingCost" DECIMAL NOT NULL DEFAULT 0,
    "transportCost" DECIMAL NOT NULL DEFAULT 0,
    "otherCost" DECIMAL NOT NULL DEFAULT 0,
    "returnMargin" DECIMAL NOT NULL DEFAULT 150,
    "totalCost" DECIMAL NOT NULL DEFAULT 0,
    "suggestedPrice30" DECIMAL,
    "suggestedPrice40" DECIMAL,
    "suggestedPrice50" DECIMAL,
    "sellingPrice" DECIMAL,
    "margin" DECIMAL,
    "marginPercent" DECIMAL,
    "estimatedUnits" INTEGER NOT NULL DEFAULT 1,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostSnapshot_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "before" TEXT,
    "after" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StockReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reconcileDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventoryItemId" TEXT NOT NULL,
    "expectedQty" DECIMAL NOT NULL,
    "actualQty" DECIMAL NOT NULL,
    "variance" DECIMAL NOT NULL,
    "variancePercent" DECIMAL NOT NULL,
    "varianceValue" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adjustmentId" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AccountingSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "defaultMarginTarget" DECIMAL NOT NULL DEFAULT 40,
    "defaultReturnMargin" DECIMAL NOT NULL DEFAULT 150,
    "defaultWasteFactor" DECIMAL NOT NULL DEFAULT 1.05,
    "lowStockAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoReconcileEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reconcileFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "birthDate" DATETIME,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "vipLevel" TEXT NOT NULL DEFAULT 'SILVER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LoyaltyPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoyaltyPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameFr" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionFr" TEXT,
    "descriptionAr" TEXT,
    "cost" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL,
    "productId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_collectionId_idx" ON "Product"("collectionId");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_modelId_idx" ON "OrderItem"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_code_idx" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_purchaseNumber_key" ON "Purchase"("purchaseNumber");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "Purchase_status_idx" ON "Purchase"("status");

-- CreateIndex
CREATE INDEX "Purchase_orderDate_idx" ON "Purchase"("orderDate");

-- CreateIndex
CREATE INDEX "Purchase_purchaseNumber_idx" ON "Purchase"("purchaseNumber");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseItem_inventoryItemId_idx" ON "PurchaseItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierAdvance_advanceNumber_key" ON "SupplierAdvance"("advanceNumber");

-- CreateIndex
CREATE INDEX "SupplierAdvance_supplierId_idx" ON "SupplierAdvance"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierAdvance_status_idx" ON "SupplierAdvance"("status");

-- CreateIndex
CREATE INDEX "SupplierAdvance_advanceNumber_idx" ON "SupplierAdvance"("advanceNumber");

-- CreateIndex
CREATE INDEX "PurchaseAdvance_purchaseId_idx" ON "PurchaseAdvance"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseAdvance_advanceId_idx" ON "PurchaseAdvance"("advanceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseAdvance_purchaseId_advanceId_key" ON "PurchaseAdvance"("purchaseId", "advanceId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "InventoryItem_sku_idx" ON "InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "InventoryItem_type_idx" ON "InventoryItem"("type");

-- CreateIndex
CREATE INDEX "InventoryItem_supplierId_idx" ON "InventoryItem"("supplierId");

-- CreateIndex
CREATE INDEX "InventoryItem_isActive_idx" ON "InventoryItem"("isActive");

-- CreateIndex
CREATE INDEX "InventoryTransaction_inventoryItemId_idx" ON "InventoryTransaction"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_direction_idx" ON "InventoryTransaction"("direction");

-- CreateIndex
CREATE INDEX "InventoryTransaction_type_idx" ON "InventoryTransaction"("type");

-- CreateIndex
CREATE INDEX "InventoryTransaction_referenceType_referenceId_idx" ON "InventoryTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Model_sku_key" ON "Model"("sku");

-- CreateIndex
CREATE INDEX "Model_sku_idx" ON "Model"("sku");

-- CreateIndex
CREATE INDEX "Model_collectionId_idx" ON "Model"("collectionId");

-- CreateIndex
CREATE INDEX "Model_productId_idx" ON "Model"("productId");

-- CreateIndex
CREATE INDEX "Model_isActive_idx" ON "Model"("isActive");

-- CreateIndex
CREATE INDEX "BomItem_modelId_idx" ON "BomItem"("modelId");

-- CreateIndex
CREATE INDEX "BomItem_inventoryItemId_idx" ON "BomItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "BomItem_modelId_inventoryItemId_key" ON "BomItem"("modelId", "inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Charge_chargeNumber_key" ON "Charge"("chargeNumber");

-- CreateIndex
CREATE INDEX "Charge_category_idx" ON "Charge"("category");

-- CreateIndex
CREATE INDEX "Charge_scope_idx" ON "Charge"("scope");

-- CreateIndex
CREATE INDEX "Charge_collectionId_idx" ON "Charge"("collectionId");

-- CreateIndex
CREATE INDEX "Charge_modelId_idx" ON "Charge"("modelId");

-- CreateIndex
CREATE INDEX "Charge_date_idx" ON "Charge"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionBatch_batchNumber_key" ON "ProductionBatch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionBatch_costSnapshotId_key" ON "ProductionBatch"("costSnapshotId");

-- CreateIndex
CREATE INDEX "ProductionBatch_modelId_idx" ON "ProductionBatch"("modelId");

-- CreateIndex
CREATE INDEX "ProductionBatch_status_idx" ON "ProductionBatch"("status");

-- CreateIndex
CREATE INDEX "ProductionBatch_batchNumber_idx" ON "ProductionBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "BatchConsumption_batchId_idx" ON "BatchConsumption"("batchId");

-- CreateIndex
CREATE INDEX "BatchConsumption_inventoryItemId_idx" ON "BatchConsumption"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CostSnapshot_snapshotNumber_key" ON "CostSnapshot"("snapshotNumber");

-- CreateIndex
CREATE INDEX "CostSnapshot_modelId_idx" ON "CostSnapshot"("modelId");

-- CreateIndex
CREATE INDEX "CostSnapshot_batchId_idx" ON "CostSnapshot"("batchId");

-- CreateIndex
CREATE INDEX "CostSnapshot_createdAt_idx" ON "CostSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "StockReconciliation_inventoryItemId_idx" ON "StockReconciliation"("inventoryItemId");

-- CreateIndex
CREATE INDEX "StockReconciliation_status_idx" ON "StockReconciliation"("status");

-- CreateIndex
CREATE INDEX "StockReconciliation_reconcileDate_idx" ON "StockReconciliation"("reconcileDate");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "LoyaltyPoint_userId_idx" ON "LoyaltyPoint"("userId");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");
