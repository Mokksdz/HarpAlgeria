// =============================================================================
// API Route: /api/orders/[id]/reserve
// Réserver le stock pour une commande
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reserveStock, checkStockAvailability } from "@/lib/accounting/services";

// POST - Réserver le stock
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer la commande avec ses items
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    if (order.stockReserved) {
      return NextResponse.json(
        { error: "Le stock est déjà réservé pour cette commande" },
        { status: 400 }
      );
    }

    // Préparer les items à réserver (ceux qui ont un lien vers un modèle/inventaire)
    const itemsToReserve: Array<{ inventoryItemId: string; quantity: number }> = [];
    
    for (const item of order.items) {
      if (item.modelId) {
        // Récupérer les BOM du modèle
        const bom = await prisma.bomItem.findMany({
          where: { modelId: item.modelId },
          include: { inventoryItem: true },
        });

        for (const bomItem of bom) {
          const qty = Number(bomItem.quantity) * Number(bomItem.wasteFactor) * item.quantity;
          
          const existing = itemsToReserve.find(i => i.inventoryItemId === bomItem.inventoryItemId);
          if (existing) {
            existing.quantity += qty;
          } else {
            itemsToReserve.push({
              inventoryItemId: bomItem.inventoryItemId,
              quantity: qty,
            });
          }
        }
      }
    }

    if (itemsToReserve.length === 0) {
      return NextResponse.json(
        { 
          warning: "Aucun article à réserver (pas de liens modèle/BOM)",
          stockReserved: false,
        },
        { status: 200 }
      );
    }

    // Vérifier la disponibilité
    const availability = await checkStockAvailability(itemsToReserve);
    
    if (!availability.available) {
      const shortages = availability.details
        .filter(d => d.shortage > 0)
        .map(d => `${d.name}: manque ${d.shortage.toFixed(2)}`)
        .join(", ");
      
      return NextResponse.json(
        { 
          error: "Stock insuffisant",
          details: shortages,
          availability: availability.details,
        },
        { status: 400 }
      );
    }

    // Réserver le stock dans une transaction
    await prisma.$transaction(async (tx) => {
      for (const item of itemsToReserve) {
        await reserveStock(item.inventoryItemId, item.quantity, order.id, tx);
      }

      // Marquer la commande comme ayant le stock réservé
      await tx.order.update({
        where: { id },
        data: { stockReserved: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Stock réservé avec succès",
      reservedItems: itemsToReserve,
    });
  } catch (error: any) {
    console.error("Error reserving stock:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la réservation" },
      { status: 400 }
    );
  }
}

// DELETE - Annuler la réservation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { releaseStock: releaseStockFn } = await import("@/lib/accounting/services");

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    if (!order.stockReserved) {
      return NextResponse.json(
        { error: "Aucun stock n'est réservé pour cette commande" },
        { status: 400 }
      );
    }

    // Récupérer les transactions de réservation pour cette commande
    const reservations = await prisma.inventoryTransaction.findMany({
      where: {
        referenceType: "ORDER",
        referenceId: id,
        type: "RESERVE",
      },
    });

    await prisma.$transaction(async (tx) => {
      for (const reservation of reservations) {
        await releaseStockFn(
          reservation.inventoryItemId,
          Number(reservation.quantity),
          order.id,
          tx
        );
      }

      await tx.order.update({
        where: { id },
        data: { stockReserved: false },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Réservation annulée",
    });
  } catch (error: any) {
    console.error("Error releasing stock:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'annulation" },
      { status: 400 }
    );
  }
}
