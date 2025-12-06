/**
 * Integration Tests for Comptabilité V3 - Phase 1
 * Tests full flow: create purchase -> preview -> receive -> verify inventory
 */

import { PrismaClient } from '@prisma/client';
import {
  createPurchase,
  previewReceivePurchase,
  receivePurchase,
  getPurchaseDetail,
} from '@/lib/compta/services/purchases-service';
import {
  createInventoryItem,
  getInventoryDetail,
  applyAdjustment,
  reconcileInventory,
} from '@/lib/compta/services/inventory-service';
import { calculateCUMP } from '@/lib/compta/accounting';

// Use a separate test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db',
    },
  },
});

describe('Comptabilité V3 Integration Tests', () => {
  let supplierId: string;
  let inventoryItemId: string;
  let purchaseId: string;
  let purchaseItemId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({});
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.purchaseItem.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.supplier.deleteMany({});

    // Create test supplier
    const supplier = await prisma.supplier.create({
      data: {
        code: 'TEST-001',
        name: 'Test Supplier',
        phone: '0555123456',
        country: 'Algérie',
        isActive: true,
      },
    });
    supplierId = supplier.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({});
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.purchaseItem.deleteMany({});
    await prisma.purchase.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Inventory Item Creation', () => {
    it('should create an inventory item with initial stock', async () => {
      const item = await createInventoryItem({
        sku: 'TISSU-TEST-001',
        name: 'Tissu Test Coton',
        type: 'FABRIC',
        unit: 'METER',
        quantity: 100,
        averageCost: 500,
        lastCost: 500,
        threshold: 20,
      });

      inventoryItemId = item.id;

      expect(item.sku).toBe('TISSU-TEST-001');
      expect(item.quantity).toBe(100);
      expect(item.averageCost).toBe(500);
      expect(item.totalValue).toBe(50000);
      expect(item.available).toBe(100);
    });

    it('should reject duplicate SKU', async () => {
      await expect(
        createInventoryItem({
          sku: 'TISSU-TEST-001',
          name: 'Duplicate',
          type: 'FABRIC',
          unit: 'METER',
          quantity: 0,
          averageCost: 0,
          lastCost: 0,
        })
      ).rejects.toThrow('existe déjà');
    });
  });

  describe('Purchase Creation', () => {
    it('should create a purchase in DRAFT status', async () => {
      const purchase = await createPurchase({
        supplierId,
        invoiceNumber: 'FAC-TEST-001',
        items: [
          {
            inventoryItemId,
            quantityOrdered: 50,
            unitPrice: 600,
          },
        ],
      });

      purchaseId = purchase.id;
      purchaseItemId = purchase.items[0].id;

      expect(purchase.status).toBe('DRAFT');
      expect(purchase.purchaseNumber).toMatch(/^ACH-\d{4}-\d{3}$/);
      expect(purchase.totalAmount).toBe(30000); // 50 * 600
      expect(purchase.items).toHaveLength(1);
      expect(purchase.items[0].quantityOrdered).toBe(50);
      expect(purchase.items[0].quantityReceived).toBe(0);
    });
  });

  describe('Purchase Preview', () => {
    it('should preview receive without modifying database', async () => {
      const preview = await previewReceivePurchase(purchaseId, {
        items: [
          {
            purchaseItemId,
            quantityReceived: 50,
          },
        ],
      });

      expect(preview.stockUpdates).toHaveLength(1);
      const update = preview.stockUpdates[0];

      // Verify CUMP calculation: (100 * 500 + 50 * 600) / 150 = 533.33
      const expectedCUMP = calculateCUMP(100, 500, 50, 600);
      expect(update.previousQty).toBe(100);
      expect(update.receivedQty).toBe(50);
      expect(update.newQty).toBe(150);
      expect(update.previousCUMP).toBe(500);
      expect(update.newCUMP).toBeCloseTo(expectedCUMP, 2);

      // Verify database was NOT modified
      const item = await getInventoryDetail(inventoryItemId);
      expect(item?.quantity).toBe(100); // Still original
      expect(item?.averageCost).toBe(500); // Still original
    });

    it('should reject quantity exceeding remaining', async () => {
      await expect(
        previewReceivePurchase(purchaseId, {
          items: [
            {
              purchaseItemId,
              quantityReceived: 100, // More than ordered
            },
          ],
        })
      ).rejects.toThrow('dépasse le restant');
    });
  });

  describe('Purchase Receive (Transactional)', () => {
    it('should receive purchase and update inventory atomically', async () => {
      const result = await receivePurchase(
        purchaseId,
        {
          items: [
            {
              purchaseItemId,
              quantityReceived: 30, // Partial receive
            },
          ],
          receivedBy: 'test@harp.dz',
        },
        'test-user-id'
      );

      expect(result.success).toBe(true);
      expect(result.stockUpdates).toHaveLength(1);

      const update = result.stockUpdates[0];
      // CUMP: (100 * 500 + 30 * 600) / 130 = (50000 + 18000) / 130 = 523.08
      const expectedCUMP = calculateCUMP(100, 500, 30, 600);
      expect(update.newCUMP).toBeCloseTo(expectedCUMP, 2);
      expect(update.newQty).toBe(130);

      // Verify purchase status updated
      expect(result.purchase.status).toBe('PARTIAL');

      // Verify inventory updated
      const item = await getInventoryDetail(inventoryItemId);
      expect(item?.quantity).toBe(130);
      expect(item?.averageCost).toBeCloseTo(expectedCUMP, 2);
      expect(item?.lastCost).toBe(600);

      // Verify transaction created
      expect(item?.transactions).toHaveLength(2); // Initial + Purchase
      const lastTx = item?.transactions[0];
      expect(lastTx?.type).toBe('PURCHASE');
      expect(lastTx?.direction).toBe('IN');
      expect(lastTx?.quantity).toBe(30);
    });

    it('should complete receive and set status to RECEIVED', async () => {
      const result = await receivePurchase(
        purchaseId,
        {
          items: [
            {
              purchaseItemId,
              quantityReceived: 20, // Remaining 20
            },
          ],
          receivedBy: 'test@harp.dz',
        },
        'test-user-id'
      );

      expect(result.success).toBe(true);
      expect(result.purchase.status).toBe('RECEIVED');
      expect(result.purchase.receivedDate).toBeTruthy();

      // Final inventory check
      const item = await getInventoryDetail(inventoryItemId);
      expect(item?.quantity).toBe(150); // 100 + 30 + 20

      // Verify all transactions recorded
      expect(item?.transactions.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject receive on completed purchase', async () => {
      await expect(
        receivePurchase(purchaseId, {
          items: [{ purchaseItemId, quantityReceived: 10 }],
        })
      ).rejects.toThrow('déjà été entièrement reçu');
    });
  });

  describe('Inventory Adjustment', () => {
    it('should apply ADD adjustment correctly', async () => {
      const result = await applyAdjustment(
        {
          inventoryItemId,
          adjustmentType: 'ADD',
          quantity: 10,
          reason: 'Test adjustment - add',
        },
        'test-user-id'
      );

      expect(result.item.quantity).toBe(160); // 150 + 10
      expect(result.transaction.type).toBe('ADJUSTMENT');
      expect(result.transaction.direction).toBe('IN');
    });

    it('should apply REMOVE adjustment correctly', async () => {
      const result = await applyAdjustment(
        {
          inventoryItemId,
          adjustmentType: 'REMOVE',
          quantity: 5,
          reason: 'Test adjustment - remove',
        },
        'test-user-id'
      );

      expect(result.item.quantity).toBe(155); // 160 - 5
      expect(result.transaction.direction).toBe('OUT');
    });

    it('should apply SET adjustment correctly', async () => {
      const result = await applyAdjustment(
        {
          inventoryItemId,
          adjustmentType: 'SET',
          quantity: 150,
          reason: 'Test adjustment - set to exact value',
        },
        'test-user-id'
      );

      expect(result.item.quantity).toBe(150);
    });

    it('should reject negative stock without override', async () => {
      await expect(
        applyAdjustment({
          inventoryItemId,
          adjustmentType: 'REMOVE',
          quantity: 999,
          reason: 'Should fail',
        })
      ).rejects.toThrow('insuffisant');
    });
  });

  describe('Inventory Reconciliation', () => {
    it('should return no mismatches for consistent data', async () => {
      const mismatches = await reconcileInventory();

      // After all our operations, data should be consistent
      // unless there's a bug in our transaction handling
      const itemMismatch = mismatches.find(
        (m) => m.inventoryItemId === inventoryItemId
      );

      // Should have no mismatch or very small variance (float precision)
      if (itemMismatch) {
        expect(Math.abs(itemMismatch.variance)).toBeLessThan(0.1);
      }
    });
  });

  describe('Audit Trail', () => {
    it('should have created audit logs for all critical operations', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { entity: 'Purchase', entityId: purchaseId },
            { entity: 'InventoryItem', entityId: inventoryItemId },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      // Should have RECEIVE logs and ADJUSTMENT logs
      const receiveLog = logs.find((l) => l.action === 'RECEIVE');
      const adjustmentLog = logs.find((l) => l.action === 'ADJUSTMENT');

      expect(receiveLog).toBeDefined();
      expect(adjustmentLog).toBeDefined();

      // Verify audit data structure
      if (receiveLog?.before) {
        const before = JSON.parse(receiveLog.before);
        expect(before).toHaveProperty('status');
      }
    });
  });
});

describe('Edge Cases', () => {
  let edgeSupplierId: string;
  let edgeItemId: string;

  beforeAll(async () => {
    const supplier = await prisma.supplier.create({
      data: {
        code: 'EDGE-001',
        name: 'Edge Test Supplier',
        country: 'Algérie',
        isActive: true,
      },
    });
    edgeSupplierId = supplier.id;
  });

  afterAll(async () => {
    await prisma.inventoryTransaction.deleteMany({
      where: { inventoryItem: { sku: { startsWith: 'EDGE-' } } },
    });
    await prisma.purchaseItem.deleteMany({
      where: { purchase: { supplier: { code: 'EDGE-001' } } },
    });
    await prisma.purchase.deleteMany({
      where: { supplierId: edgeSupplierId },
    });
    await prisma.inventoryItem.deleteMany({
      where: { sku: { startsWith: 'EDGE-' } },
    });
    await prisma.supplier.delete({ where: { id: edgeSupplierId } });
  });

  it('should handle zero initial stock correctly', async () => {
    const item = await createInventoryItem({
      sku: 'EDGE-ZERO-001',
      name: 'Zero Stock Item',
      type: 'ACCESSORY',
      unit: 'PIECE',
      quantity: 0,
      averageCost: 0,
      lastCost: 0,
    });
    edgeItemId = item.id;

    const purchase = await createPurchase({
      supplierId: edgeSupplierId,
      items: [
        { inventoryItemId: edgeItemId, quantityOrdered: 100, unitPrice: 250 },
      ],
    });

    const result = await receivePurchase(purchase.id, {
      items: [
        { purchaseItemId: purchase.items[0].id, quantityReceived: 100 },
      ],
    });

    // When starting from zero, CUMP = unit price
    expect(result.stockUpdates[0].newCUMP).toBe(250);
    expect(result.stockUpdates[0].newQty).toBe(100);

    const detail = await getInventoryDetail(edgeItemId);
    expect(detail?.averageCost).toBe(250);
  });

  it('should handle decimal quantities', async () => {
    const item = await createInventoryItem({
      sku: 'EDGE-DECIMAL-001',
      name: 'Decimal Quantity Item',
      type: 'FABRIC',
      unit: 'METER',
      quantity: 10.5,
      averageCost: 1000,
      lastCost: 1000,
    });

    const purchase = await createPurchase({
      supplierId: edgeSupplierId,
      items: [
        { inventoryItemId: item.id, quantityOrdered: 5.5, unitPrice: 1200 },
      ],
    });

    const result = await receivePurchase(purchase.id, {
      items: [
        { purchaseItemId: purchase.items[0].id, quantityReceived: 5.5 },
      ],
    });

    // CUMP: (10.5 * 1000 + 5.5 * 1200) / 16 = (10500 + 6600) / 16 = 1068.75
    expect(result.stockUpdates[0].newCUMP).toBeCloseTo(1068.75, 2);
    expect(result.stockUpdates[0].newQty).toBeCloseTo(16, 2);
  });

  it('should handle very large values without overflow', async () => {
    const item = await createInventoryItem({
      sku: 'EDGE-LARGE-001',
      name: 'Large Value Item',
      type: 'FINISHED',
      unit: 'PIECE',
      quantity: 1000000,
      averageCost: 50000,
      lastCost: 50000,
    });

    const purchase = await createPurchase({
      supplierId: edgeSupplierId,
      items: [
        {
          inventoryItemId: item.id,
          quantityOrdered: 100000,
          unitPrice: 55000,
        },
      ],
    });

    const result = await receivePurchase(purchase.id, {
      items: [
        { purchaseItemId: purchase.items[0].id, quantityReceived: 100000 },
      ],
    });

    // Should handle 55 billion DZD total value without issues
    expect(result.stockUpdates[0].newQty).toBe(1100000);
    expect(result.stockUpdates[0].newValue).toBeGreaterThan(50000000000);
  });
});
