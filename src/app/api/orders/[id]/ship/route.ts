// =============================================================================
// API Route: /api/orders/[id]/ship
// Expédier une commande (déduire le stock)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shipOrderStock, cancelShipment } from "@/lib/accounting/services";

// POST - Expédier la commande
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 },
      );
    }

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return NextResponse.json(
        { error: "Cette commande a déjà été expédiée" },
        { status: 400 },
      );
    }

    // Préparer les items à expédier
    const itemsToShip: Array<{ inventoryItemId: string; quantity: number }> =
      [];

    for (const item of order.items) {
      if (item.modelId) {
        const bom = await prisma.bomItem.findMany({
          where: { modelId: item.modelId },
        });

        for (const bomItem of bom) {
          const qty =
            Number(bomItem.quantity) *
            Number(bomItem.wasteFactor) *
            item.quantity;

          const existing = itemsToShip.find(
            (i) => i.inventoryItemId === bomItem.inventoryItemId,
          );
          if (existing) {
            existing.quantity += qty;
          } else {
            itemsToShip.push({
              inventoryItemId: bomItem.inventoryItemId,
              quantity: qty,
            });
          }
        }
      }
    }

    // Expédier dans une transaction
    await prisma.$transaction(async (tx) => {
      if (itemsToShip.length > 0) {
        await shipOrderStock(order.id, itemsToShip, tx);
      }

      await tx.order.update({
        where: { id },
        data: {
          status: "SHIPPED",
          stockReserved: false, // Plus réservé, maintenant déduit
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Commande expédiée, stock déduit",
      shippedItems: itemsToShip,
    });
  } catch (error: unknown) {
    console.error("Error shipping order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}

// DELETE - Annuler l'expédition (remettre le stock)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 },
      );
    }

    if (order.status !== "SHIPPED") {
      return NextResponse.json(
        { error: "Cette commande n'a pas été expédiée" },
        { status: 400 },
      );
    }

    // Récupérer les sorties de stock pour cette commande
    const shipments = await prisma.inventoryTransaction.findMany({
      where: {
        referenceType: "ORDER",
        referenceId: id,
        type: "SALE",
      },
    });

    const itemsToReturn = shipments.map((s) => ({
      inventoryItemId: s.inventoryItemId,
      quantity: Number(s.quantity),
    }));

    // Annuler l'expédition
    await prisma.$transaction(async (tx) => {
      if (itemsToReturn.length > 0) {
        await cancelShipment(order.id, itemsToReturn, tx);
      }

      await tx.order.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Expédition annulée, stock remis",
      returnedItems: itemsToReturn,
    });
  } catch (error: unknown) {
    console.error("Error cancelling shipment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}
