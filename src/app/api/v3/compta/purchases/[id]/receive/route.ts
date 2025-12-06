/**
 * HARP Comptabilité V3 - Purchase Receive Route
 * GET /api/v3/compta/purchases/[id]/receive - Get receive preview
 * POST /api/v3/compta/purchases/[id]/receive - Execute transactional receive
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleApiError } from '@/lib/auth-helpers';
import { z } from 'zod';
import { ReceivePurchaseSchema } from '@/lib/compta/schemas/purchase.schemas';
import {
  receivePurchase,
  getPurchaseDetail,
} from '@/lib/compta/services/purchases-service';
import { calculateCUMP } from '@/lib/compta/accounting';

/**
 * GET /api/v3/compta/purchases/[id]/receive
 * Get purchase details with CUMP preview for all remaining items
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const purchase = await getPurchaseDetail(id);

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: 'Achat non trouvé' },
        { status: 404 }
      );
    }

    if (purchase.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Cet achat est annulé' },
        { status: 422 }
      );
    }

    if (purchase.status === 'RECEIVED') {
      return NextResponse.json(
        { success: false, error: 'Cet achat a déjà été entièrement reçu' },
        { status: 422 }
      );
    }

    // Generate preview for all remaining items
    const preview = purchase.items.map((item) => {
      const remaining = Number(item.quantityOrdered) - Number(item.quantityReceived);

      if (remaining <= 0) {
        return {
          purchaseItemId: item.id,
          inventoryItemId: item.inventoryItem.id,
          sku: item.inventoryItem.sku,
          name: item.inventoryItem.name,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: item.quantityReceived,
          remaining: 0,
          unitPrice: item.unitPrice,
          current: {
            quantity: item.inventoryItem.quantity,
            averageCost: item.inventoryItem.averageCost,
            totalValue: item.inventoryItem.totalValue,
          },
          afterFullReceive: null,
        };
      }

      const newCUMP = calculateCUMP(
        Number(item.inventoryItem.quantity),
        Number(item.inventoryItem.averageCost),
        remaining,
        Number(item.unitPrice)
      );
      const newQty = Number(item.inventoryItem.quantity) + remaining;
      const newValue = newQty * newCUMP;

      return {
        purchaseItemId: item.id,
        inventoryItemId: item.inventoryItem.id,
        sku: item.inventoryItem.sku,
        name: item.inventoryItem.name,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        remaining,
        unitPrice: item.unitPrice,
        current: {
          quantity: item.inventoryItem.quantity,
          averageCost: item.inventoryItem.averageCost,
          totalValue: item.inventoryItem.totalValue,
        },
        afterFullReceive: {
          quantity: newQty,
          averageCost: newCUMP,
          totalValue: Math.round(newValue * 100) / 100,
        },
      };
    });

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        purchaseNumber: purchase.purchaseNumber,
        status: purchase.status,
        supplier: purchase.supplier,
        totalAmount: purchase.totalAmount,
      },
      preview,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/v3/compta/purchases/[id]/receive
 * Execute transactional receive operation
 * - Updates inventory quantities and CUMP
 * - Creates InventoryTransactions
 * - Updates purchase status (PARTIAL or RECEIVED)
 * - Creates AuditLog entry
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    const body = await req.json();

    // Transform old format to new format if needed
    const transformedBody = {
      ...body,
      items: body.items?.map((item: { id?: string; purchaseItemId?: string; quantityReceived: number }) => ({
        purchaseItemId: item.purchaseItemId ?? item.id,
        quantityReceived: item.quantityReceived,
      })),
    };

    const data = ReceivePurchaseSchema.parse(transformedBody);

    // Get user ID from session
    const userId = (session.user as { id?: string })?.id;

    const result = await receivePurchase(id, data, userId);

    return NextResponse.json({
      success: true,
      purchase: result.purchase,
      stockUpdates: result.stockUpdates,
      message: 'Réception enregistrée, stock mis à jour',
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation échouée', details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return handleApiError(err);
  }
}
