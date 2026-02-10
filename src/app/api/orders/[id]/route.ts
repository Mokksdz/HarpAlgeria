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

    const result = await client.createShipment({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      address: order.customerAddress,
      wilayaId: order.customerWilaya || "16",
      commune: order.customerCity,
      total: Number(order.total) - Number(order.shippingPrice || 0),
      products: productsList,
      deliveryType: order.deliveryType || "HOME",
      externalId: order.id,
      notes: `Commande Harp #${order.id.slice(-8).toUpperCase()}`,
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

      // Restore stock when order is cancelled (only if not already cancelled)
      if (status === "CANCELLED" && currentOrder.status !== "CANCELLED") {
        await prisma.$transaction(async (tx) => {
          for (const item of currentOrder.items) {
            if (!item.productId) continue;
            const qty = item.quantity;

            // Try restoring variant stock
            if (item.size && item.color) {
              const variant = await tx.productVariant.findFirst({
                where: { productId: item.productId, size: item.size, color: item.color },
              });
              if (variant) {
                await tx.productVariant.update({
                  where: { id: variant.id },
                  data: { stock: { increment: qty } },
                });
              }
            }

            // Always restore product-level stock
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: qty } },
            });
          }
        });
      }
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    // Send shipping notification email if tracking was just created
    if (shipmentResult?.success && shipmentResult.tracking) {
      try {
        // Get email from linked user
        if (updatedOrder.userId) {
          const userForEmail = await prisma.user.findUnique({
            where: { id: updatedOrder.userId },
            select: { email: true },
          });
          if (userForEmail?.email) {
            const { sendShippingNotificationEmail } =
              await import("@/lib/email/shipping-notification");
            sendShippingNotificationEmail({
              customerName: updatedOrder.customerName,
              customerEmail: userForEmail.email,
              orderNumber: updatedOrder.id.slice(0, 8).toUpperCase(),
              trackingNumber: shipmentResult.tracking,
              deliveryProvider: updatedOrder.deliveryProvider || "Standard",
              estimatedDelivery: "24-72h",
            }).catch((e: any) =>
              console.error("Shipping notification email failed:", e),
            );
          }
        }
      } catch (e) {
        console.error("Shipping email setup error:", e);
      }
    }

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
