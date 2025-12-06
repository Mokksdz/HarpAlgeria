/**
 * Seed Script - HARP Comptabilité V3 Phase 1
 * Creates test data for development and QA
 * 
 * Usage: npx ts-node scripts/seed-compta-phase1.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Phase 1 data...\n');

  // =========================================================================
  // SUPPLIERS
  // =========================================================================
  console.log('📦 Creating suppliers...');

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { code: 'FRN-001' },
      update: {},
      create: {
        code: 'FRN-001',
        name: 'Tissus El Djazair',
        contact: 'Ahmed Benali',
        phone: '0555 12 34 56',
        email: 'contact@tissus-eldjazair.dz',
        address: '123 Rue des Tissus, Zone Industrielle',
        city: 'Alger',
        country: 'Algérie',
        taxId: 'NIF-12345678',
        paymentTerms: '30 jours',
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'FRN-002' },
      update: {},
      create: {
        code: 'FRN-002',
        name: 'Accessoires Mode SARL',
        contact: 'Fatima Hadj',
        phone: '0661 98 76 54',
        email: 'commandes@accessoires-mode.dz',
        address: '45 Boulevard du Commerce',
        city: 'Oran',
        country: 'Algérie',
        taxId: 'NIF-87654321',
        paymentTerms: 'Comptant',
        isActive: true,
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'FRN-003' },
      update: {},
      create: {
        code: 'FRN-003',
        name: 'Pack & Ship Algeria',
        contact: 'Karim Mezouar',
        phone: '0770 11 22 33',
        email: 'info@packship.dz',
        city: 'Constantine',
        country: 'Algérie',
        isActive: true,
      },
    }),
  ]);

  console.log(`   ✅ Created ${suppliers.length} suppliers`);

  // =========================================================================
  // INVENTORY ITEMS
  // =========================================================================
  console.log('📋 Creating inventory items...');

  const inventoryItems = await Promise.all([
    // Fabrics
    prisma.inventoryItem.upsert({
      where: { sku: 'TISSU-COTON-001' },
      update: {},
      create: {
        sku: 'TISSU-COTON-001',
        name: 'Tissu Coton Premium Blanc',
        type: 'FABRIC',
        unit: 'METER',
        quantity: 150,
        reserved: 0,
        available: 150,
        averageCost: 500,
        lastCost: 500,
        totalValue: 75000,
        color: 'Blanc',
        width: 150,
        composition: '100% Coton',
        location: 'STOCK',
        threshold: 30,
        supplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'TISSU-COTON-002' },
      update: {},
      create: {
        sku: 'TISSU-COTON-002',
        name: 'Tissu Coton Premium Noir',
        type: 'FABRIC',
        unit: 'METER',
        quantity: 100,
        reserved: 20,
        available: 80,
        averageCost: 520,
        lastCost: 520,
        totalValue: 52000,
        color: 'Noir',
        width: 150,
        composition: '100% Coton',
        location: 'STOCK',
        threshold: 30,
        supplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'TISSU-LIN-001' },
      update: {},
      create: {
        sku: 'TISSU-LIN-001',
        name: 'Tissu Lin Naturel',
        type: 'FABRIC',
        unit: 'METER',
        quantity: 50,
        reserved: 0,
        available: 50,
        averageCost: 1200,
        lastCost: 1200,
        totalValue: 60000,
        color: 'Beige',
        width: 140,
        composition: '100% Lin',
        location: 'STOCK',
        threshold: 20,
        supplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    // Accessories
    prisma.inventoryItem.upsert({
      where: { sku: 'ACC-BOUTON-001' },
      update: {},
      create: {
        sku: 'ACC-BOUTON-001',
        name: 'Bouton Nacre 12mm',
        type: 'ACCESSORY',
        unit: 'PIECE',
        quantity: 500,
        reserved: 50,
        available: 450,
        averageCost: 15,
        lastCost: 15,
        totalValue: 7500,
        color: 'Blanc',
        location: 'STOCK',
        threshold: 100,
        supplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'ACC-ZIP-001' },
      update: {},
      create: {
        sku: 'ACC-ZIP-001',
        name: 'Fermeture Éclair 20cm Invisible',
        type: 'ACCESSORY',
        unit: 'PIECE',
        quantity: 200,
        reserved: 0,
        available: 200,
        averageCost: 80,
        lastCost: 80,
        totalValue: 16000,
        color: 'Divers',
        location: 'STOCK',
        threshold: 50,
        supplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    // Packaging
    prisma.inventoryItem.upsert({
      where: { sku: 'PACK-BOX-001' },
      update: {},
      create: {
        sku: 'PACK-BOX-001',
        name: 'Boîte Cadeau Premium',
        type: 'PACKAGING',
        unit: 'PIECE',
        quantity: 100,
        reserved: 0,
        available: 100,
        averageCost: 150,
        lastCost: 150,
        totalValue: 15000,
        location: 'STOCK',
        threshold: 30,
        supplierId: suppliers[2].id,
        isActive: true,
      },
    }),
    prisma.inventoryItem.upsert({
      where: { sku: 'PACK-BAG-001' },
      update: {},
      create: {
        sku: 'PACK-BAG-001',
        name: 'Sac Papier Kraft Grand',
        type: 'PACKAGING',
        unit: 'PIECE',
        quantity: 250,
        reserved: 0,
        available: 250,
        averageCost: 45,
        lastCost: 45,
        totalValue: 11250,
        location: 'STOCK',
        threshold: 50,
        supplierId: suppliers[2].id,
        isActive: true,
      },
    }),
    // Low stock item for alerts
    prisma.inventoryItem.upsert({
      where: { sku: 'TISSU-SOIE-001' },
      update: {},
      create: {
        sku: 'TISSU-SOIE-001',
        name: 'Tissu Soie Ivoire',
        type: 'FABRIC',
        unit: 'METER',
        quantity: 5,
        reserved: 0,
        available: 5,
        averageCost: 3500,
        lastCost: 3500,
        totalValue: 17500,
        color: 'Ivoire',
        width: 120,
        composition: '100% Soie',
        location: 'STOCK',
        threshold: 10,
        supplierId: suppliers[0].id,
        isActive: true,
      },
    }),
  ]);

  console.log(`   ✅ Created ${inventoryItems.length} inventory items`);

  // =========================================================================
  // PURCHASES
  // =========================================================================
  console.log('🛒 Creating sample purchases...');

  // Purchase 1: Draft
  const purchase1 = await prisma.purchase.upsert({
    where: { purchaseNumber: 'ACH-2025-001' },
    update: {},
    create: {
      purchaseNumber: 'ACH-2025-001',
      supplierId: suppliers[0].id,
      invoiceNumber: 'FAC-TIS-2025-0042',
      status: 'DRAFT',
      subtotal: 60000,
      totalAmount: 60000,
      amountDue: 60000,
      notes: 'Commande urgente pour nouvelle collection',
      items: {
        create: [
          {
            inventoryItemId: inventoryItems[0].id, // Coton Blanc
            quantityOrdered: 100,
            quantityReceived: 0,
            unit: 'METER',
            unitPrice: 600,
            totalPrice: 60000,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Purchase 2: Ordered (waiting for delivery)
  const purchase2 = await prisma.purchase.upsert({
    where: { purchaseNumber: 'ACH-2025-002' },
    update: {},
    create: {
      purchaseNumber: 'ACH-2025-002',
      supplierId: suppliers[1].id,
      invoiceNumber: 'FAC-ACC-2025-0089',
      status: 'ORDERED',
      orderDate: new Date('2025-11-25'),
      expectedDate: new Date('2025-12-10'),
      subtotal: 15000,
      totalAmount: 15000,
      amountDue: 15000,
      items: {
        create: [
          {
            inventoryItemId: inventoryItems[3].id, // Boutons
            quantityOrdered: 500,
            quantityReceived: 0,
            unit: 'PIECE',
            unitPrice: 18,
            totalPrice: 9000,
          },
          {
            inventoryItemId: inventoryItems[4].id, // Zips
            quantityOrdered: 75,
            quantityReceived: 0,
            unit: 'PIECE',
            unitPrice: 80,
            totalPrice: 6000,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Purchase 3: Partial (some items received)
  const purchase3 = await prisma.purchase.upsert({
    where: { purchaseNumber: 'ACH-2025-003' },
    update: {},
    create: {
      purchaseNumber: 'ACH-2025-003',
      supplierId: suppliers[0].id,
      invoiceNumber: 'FAC-TIS-2025-0038',
      status: 'PARTIAL',
      orderDate: new Date('2025-11-20'),
      subtotal: 132000,
      totalAmount: 132000,
      amountDue: 132000,
      items: {
        create: [
          {
            inventoryItemId: inventoryItems[1].id, // Coton Noir
            quantityOrdered: 100,
            quantityReceived: 60,
            unit: 'METER',
            unitPrice: 520,
            totalPrice: 52000,
          },
          {
            inventoryItemId: inventoryItems[2].id, // Lin
            quantityOrdered: 80,
            quantityReceived: 40,
            unit: 'METER',
            unitPrice: 1000,
            totalPrice: 80000,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Purchase 4: Received (completed)
  const purchase4 = await prisma.purchase.upsert({
    where: { purchaseNumber: 'ACH-2025-004' },
    update: {},
    create: {
      purchaseNumber: 'ACH-2025-004',
      supplierId: suppliers[2].id,
      invoiceNumber: 'FAC-PKG-2025-0012',
      status: 'RECEIVED',
      orderDate: new Date('2025-11-15'),
      receivedDate: new Date('2025-11-22'),
      receivedBy: 'admin@harp.dz',
      subtotal: 25000,
      totalAmount: 25000,
      amountDue: 0,
      items: {
        create: [
          {
            inventoryItemId: inventoryItems[5].id, // Boîtes
            quantityOrdered: 100,
            quantityReceived: 100,
            unit: 'PIECE',
            unitPrice: 150,
            totalPrice: 15000,
          },
          {
            inventoryItemId: inventoryItems[6].id, // Sacs
            quantityOrdered: 200,
            quantityReceived: 200,
            unit: 'PIECE',
            unitPrice: 50,
            totalPrice: 10000,
          },
        ],
      },
    },
    include: { items: true },
  });

  console.log(`   ✅ Created 4 sample purchases`);

  // =========================================================================
  // INVENTORY TRANSACTIONS (for received purchase)
  // =========================================================================
  console.log('📝 Creating inventory transactions...');

  // Transactions for purchase 4 (received)
  const transactions = await Promise.all([
    // Initial stock transactions
    ...inventoryItems.map((item) =>
      prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          direction: 'IN',
          type: 'INITIAL',
          quantity: item.quantity,
          unitCost: item.averageCost,
          balanceBefore: 0,
          balanceAfter: item.quantity,
          valueBefore: 0,
          valueAfter: item.totalValue,
          avgCostBefore: 0,
          avgCostAfter: item.averageCost,
          referenceType: 'INITIAL',
          reason: 'Stock initial',
          createdBy: 'seed-script',
        },
      })
    ),
    // Transaction for purchase 3 partial receives
    prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: inventoryItems[1].id,
        direction: 'IN',
        type: 'PURCHASE',
        quantity: 60,
        unitCost: 520,
        balanceBefore: 40,
        balanceAfter: 100,
        referenceType: 'PURCHASE',
        referenceId: purchase3.id,
        createdBy: 'seed-script',
      },
    }),
    prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: inventoryItems[2].id,
        direction: 'IN',
        type: 'PURCHASE',
        quantity: 40,
        unitCost: 1000,
        balanceBefore: 10,
        balanceAfter: 50,
        referenceType: 'PURCHASE',
        referenceId: purchase3.id,
        createdBy: 'seed-script',
      },
    }),
  ]);

  console.log(`   ✅ Created ${transactions.length} inventory transactions`);

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================
  console.log('📜 Creating audit logs...');

  await prisma.auditLog.create({
    data: {
      action: 'RECEIVE',
      entity: 'Purchase',
      entityId: purchase4.id,
      userEmail: 'admin@harp.dz',
      before: JSON.stringify({ status: 'ORDERED' }),
      after: JSON.stringify({ status: 'RECEIVED' }),
      metadata: JSON.stringify({ receivedItems: 2 }),
    },
  });

  console.log(`   ✅ Created audit logs`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Seed completed successfully!\n');
  console.log('Summary:');
  console.log(`   • ${suppliers.length} suppliers`);
  console.log(`   • ${inventoryItems.length} inventory items`);
  console.log(`   • 4 purchases (1 draft, 1 ordered, 1 partial, 1 received)`);
  console.log(`   • ${transactions.length} inventory transactions`);
  console.log('\n📊 Test data ready for Phase 1 development\n');
  
  // Print useful IDs for testing
  console.log('Useful IDs for testing:');
  console.log(`   Supplier (Tissus): ${suppliers[0].id}`);
  console.log(`   Inventory (Coton Blanc): ${inventoryItems[0].id}`);
  console.log(`   Purchase (Draft): ${purchase1.id}`);
  console.log(`   Purchase Item: ${purchase1.items[0].id}`);
  console.log(`   Purchase (Partial): ${purchase3.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
