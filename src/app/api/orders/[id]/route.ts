import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getYalidineClient, orderToYalidineParcel } from "@/lib/yalidine";
import { getZRClient } from "@/lib/zrexpress";

// Helper: Create shipment on Yalidine
async function createYalidineShipment(order: any) {
  try {
    const client = getYalidineClient();

    // Build product list from items
    const _productsList =
      order.items
        ?.map((item: any) => `${item.quantity}x ${item.productName}`)
        .join(", ") || "Commande Harp";

    const parcel = orderToYalidineParcel(
      {
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.customerAddress,
        wilaya: order.customerWilaya,
        commune: order.customerCity,
        total: order.total - (order.shippingPrice || 0), // Prix produits sans livraison
        items: order.items || [],
        deliveryType: order.deliveryType === "DESK" ? "STOP_DESK" : "DOMICILE",
        stopDeskId: order.stopDeskId || undefined,
      },
      "Alger",
    ); // Wilaya d'expédition

    const result = await client.createParcel(parcel);

    if (result.success && result.tracking) {
      return {
        success: true,
        tracking: result.tracking,
        label: result.label || undefined,
      };
    }
    return { success: false, error: result.message || "Erreur inconnue" };
  } catch (error) {
    console.error("Yalidine shipment creation error:", error);
    return { success: false, error: "Erreur création Yalidine" };
  }
}

// Helper: Create shipment on ZR Express
async function createZRExpressShipment(order: any) {
  try {
    const client = getZRClient();

    const productsList =
      order.items
        ?.map((item: any) => `${item.quantity}x ${item.productName}`)
        .join(", ") || "Commande Harp";

    // Map wilaya name to ID
    const wilayaMap: Record<string, string> = {
      alger: "16",
      oran: "31",
      constantine: "25",
      blida: "9",
      sétif: "19",
      annaba: "23",
      batna: "5",
      "tizi ouzou": "15",
      bejaia: "6",
      tlemcen: "13",
      djelfa: "17",
      biskra: "7",
      msila: "28",
      chlef: "2",
      medea: "26",
      mostaganem: "27",
    };
    const wilayaId =
      wilayaMap[order.customerWilaya?.toLowerCase()] ||
      order.customerWilaya ||
      "16";

    const result = await client.createShipment({
      id_Externe: order.id,
      Client: order.customerName,
      MobileA: order.customerPhone,
      Adresse: order.customerAddress,
      Commune: order.customerCity,
      IDWilaya: wilayaId,
      Total: String(order.total - (order.shippingPrice || 0)),
      TypeLivraison: order.deliveryType === "DESK" ? "1" : "0",
      TypeColis: "0", // Normal (pas d'échange)
      TProduit: productsList,
      Note: `Commande Harp #${order.id.slice(-8).toUpperCase()}`,
    });

    if (result.success && result.tracking) {
      return { success: true, tracking: result.tracking, label: undefined };
    }
    return { success: false, error: result.message || "Erreur inconnue" };
  } catch (error) {
    console.error("ZR Express shipment creation error:", error);
    return { success: false, error: "Erreur création ZR Express" };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching order" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ...otherUpdates } = body;

    // Get current order to check status transition
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: any = { ...otherUpdates };
    let shipmentResult: {
      success: boolean;
      tracking?: string;
      error?: string;
      label?: string;
    } | null = null;

    // If status is being updated
    if (status) {
      updateData.status = status;

      // Auto-create shipment when status changes from PENDING to CONFIRMED
      if (currentOrder.status === "PENDING" && status === "CONFIRMED") {
        const provider = currentOrder.deliveryProvider;

        if (provider === "Yalidine") {
          shipmentResult = await createYalidineShipment(currentOrder);
        } else if (provider === "ZR Express") {
          shipmentResult = await createZRExpressShipment(currentOrder);
        }

        // If shipment was created successfully, update tracking info
        if (shipmentResult?.success) {
          updateData.trackingNumber = shipmentResult.tracking;
          updateData.trackingStatus = "En préparation";
        }
      }
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    return NextResponse.json({
      ...updatedOrder,
      shipmentCreated: shipmentResult?.success || false,
      shipmentError: shipmentResult?.error || null,
      label: shipmentResult?.label || null,
    });
  } catch (error: unknown) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        error: "Error updating order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Alias for PATCH
  return PATCH(request, { params });
}
