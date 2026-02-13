// =============================================================================
// API Route: /api/orders/[id]/ship
// Expédier une commande : créer le colis chez le transporteur + déduire le stock
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shipOrderStock, cancelShipment } from "@/lib/accounting/services";
import { requireAdmin } from "@/lib/auth-helpers";
import { getZRClient, WILAYAS } from "@/lib/zrexpress";
import { getYalidineClient, orderToYalidineParcel } from "@/lib/yalidine";

// ── Helper: Resolve wilaya name/code to ID ──────────────────────────────
function getWilayaId(wilayaNameOrCode: string): string {
  if (!wilayaNameOrCode) return "16";
  const name = wilayaNameOrCode.toLowerCase().trim();
  const match =
    WILAYAS.find(
      (w) =>
        w.name.toLowerCase() === name ||
        w.id === name ||
        w.name_ar === wilayaNameOrCode,
    ) ||
    WILAYAS.find(
      (w) =>
        w.name.toLowerCase().includes(name) ||
        name.includes(w.name.toLowerCase()),
    );
  return match?.id || wilayaNameOrCode;
}

// ── POST - Expédier la commande (transporteur + stock) ──────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
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

    // Anti-doublon : si un tracking existe déjà, ne pas recréer de colis
    if (order.trackingNumber) {
      return NextResponse.json(
        { error: `Cette commande a déjà un tracking: ${order.trackingNumber}` },
        { status: 400 },
      );
    }

    // Vérifier que le transporteur est défini
    const provider = order.deliveryProvider;
    if (!provider) {
      return NextResponse.json(
        { error: "Aucun transporteur défini pour cette commande. Veuillez d'abord sélectionner un transporteur." },
        { status: 400 },
      );
    }

    // ── Étape 1 : Créer le colis chez le transporteur ──────────────────
    const isZR = provider.toLowerCase().includes("zr") || provider.toLowerCase().includes("express");
    const isYalidine = provider.toLowerCase().includes("yalidine");

    let tracking: string | undefined;
    let label: string | undefined;
    let providerName: string;

    if (isZR) {
      providerName = "ZR Express";
      const productsList = order.items
        .map((item) => `${item.quantity}x ${item.productName}`)
        .join(", ");

      const client = getZRClient();
      const result = await client.createShipment({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.customerAddress || order.customerCity || "N/A",
        wilayaId: getWilayaId(order.customerWilaya),
        commune: order.customerCity || "",
        total: Number(order.total),
        deliveryType: order.deliveryType || "DOMICILE",
        products: productsList || "Articles Harp",
        externalId: order.id,
      });

      if (!result.success) {
        console.error("[SHIP] ZR Express failed for order", id, ":", result.message);
        return NextResponse.json(
          { error: `ZR Express: ${result.message || "Échec création colis"}` },
          { status: 400 },
        );
      }

      tracking = result.tracking;
    } else if (isYalidine) {
      providerName = "Yalidine";
      const client = getYalidineClient();

      const parcel = orderToYalidineParcel(
        {
          id: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          address: order.customerAddress || order.customerCity || "N/A",
          wilaya: order.customerWilaya,
          commune: order.customerCity || "",
          total: Number(order.total),
          items: order.items.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
          })),
          deliveryType:
            order.deliveryType === "STOP_DESK" || order.deliveryType === "DESK"
              ? "STOP_DESK"
              : "DOMICILE",
          stopDeskId: order.stopDeskId || undefined,
        },
        "Alger",
      );

      const result = await client.createParcel(parcel);

      if (!result.success) {
        console.error("[SHIP] Yalidine failed for order", id, ":", result.message);
        return NextResponse.json(
          { error: `Yalidine: ${result.message || "Échec création colis"}` },
          { status: 400 },
        );
      }

      tracking = result.tracking || undefined;
      label = result.label || undefined;
    } else {
      return NextResponse.json(
        { error: `Transporteur non reconnu: "${provider}". Utilisez "ZR Express" ou "Yalidine".` },
        { status: 400 },
      );
    }

    if (!tracking) {
      return NextResponse.json(
        { error: "Le transporteur n'a pas retourné de numéro de suivi" },
        { status: 500 },
      );
    }

    console.log("[SHIP] Carrier parcel created for order", id, "- tracking:", tracking, "provider:", providerName);

    // ── Étape 2 : Déduire le stock (BOM-based) ─────────────────────────
    const itemsToShip: Array<{ inventoryItemId: string; quantity: number }> = [];

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

    // ── Étape 3 : Transaction — stock + update ordre ────────────────────
    await prisma.$transaction(async (tx) => {
      if (itemsToShip.length > 0) {
        await shipOrderStock(order.id, itemsToShip, tx);
      }

      await tx.order.update({
        where: { id },
        data: {
          status: "SHIPPED",
          trackingNumber: tracking,
          deliveryProvider: providerName,
          stockReserved: false,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Commande expédiée via ${providerName}`,
      tracking,
      deliveryProvider: providerName,
      label: label || null,
      shippedItems: itemsToShip,
    });
  } catch (error: unknown) {
    console.error("[SHIP] Error shipping order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 400 },
    );
  }
}

// ── DELETE - Annuler l'expédition (remettre le stock) ───────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
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
