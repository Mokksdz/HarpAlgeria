/**
 * HARP Comptabilité V3 - Index Route
 * GET /api/v3/compta - Health check + list available routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    // Get quick stats
    const [purchaseCount, inventoryCount, lowStockCount] = await Promise.all([
      prisma.purchase.count({ where: { status: { in: ['DRAFT', 'ORDERED', 'PARTIAL'] } } }),
      prisma.inventoryItem.count({ where: { isActive: true } }),
      prisma.inventoryItem.count({
        where: {
          isActive: true,
          quantity: { lte: prisma.inventoryItem.fields.threshold },
        },
      }).catch(() => 0), // Fallback if threshold comparison fails
    ]);

    return NextResponse.json({
      success: true,
      version: '3.0.0',
      phase: 1,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        pendingPurchases: purchaseCount,
        inventoryItems: inventoryCount,
        lowStockAlerts: lowStockCount,
      },
      routes: {
        purchases: {
          list: 'GET /api/v3/compta/purchases',
          create: 'POST /api/v3/compta/purchases',
          detail: 'GET /api/v3/compta/purchases/[id]',
          preview: 'POST /api/v3/compta/purchases/[id]/preview',
          receive: 'POST /api/v3/compta/purchases/[id]/receive',
        },
        inventory: {
          list: 'GET /api/v3/compta/inventory',
          create: 'POST /api/v3/compta/inventory',
          detail: 'GET /api/v3/compta/inventory/[id]',
          adjustment: 'POST /api/v3/compta/inventory/adjustment',
          reconcile: 'GET /api/v3/compta/inventory/reconcile',
        },
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
