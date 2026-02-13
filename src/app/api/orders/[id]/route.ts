import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

// Bug #6: Status transition state machine — forward-only transitions
const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 4, // Terminal — can be reached from any non-DELIVERED state
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  // CANCELLED can be reached from PENDING, CONFIRMED, SHIPPED (not from DELIVERED)
  if (newStatus === "CANCELLED") {
    return currentStatus !== "DELIVERED";
  }
  // Cannot transition FROM cancelled or delivered (terminal states)
  if (currentStatus === "CANCELLED" || currentStatus === "DELIVERED") {
    return false;
  }
  // Must move forward
  return (STATUS_ORDER[newStatus] ?? -1) > (STATUS_ORDER[currentStatus] ?? -1);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Bug #1: Require admin for single order access (contains PII)
    await requireAdmin(request);
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
    // Bug #1: Require admin for order updates
    await requireAdmin(request);
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

    // If status is being updated
    if (status) {
      // Bug #6: State machine — reject invalid transitions
      if (!isValidTransition(currentOrder.status, status)) {
        return NextResponse.json(
          { error: `Transition invalide: ${currentOrder.status} → ${status}` },
          { status: 400 },
        );
      }

      // SERVER-SIDE GUARD: SHIPPED status requires a valid tracking number
      // This prevents ghost SHIPPED orders from stale front-end code
      if (status === "SHIPPED") {
        const hasNewTracking = otherUpdates.trackingNumber && otherUpdates.trackingNumber.trim() !== "";
        const hasExistingTracking = currentOrder.trackingNumber && currentOrder.trackingNumber.trim() !== "";
        if (!hasNewTracking && !hasExistingTracking) {
          console.error(`[ORDERS] Blocked SHIPPED without tracking for order ${id}`);
          return NextResponse.json(
            { error: "Impossible de mettre en SHIPPED sans numéro de suivi (tracking)" },
            { status: 400 },
          );
        }
      }
      updateData.status = status;

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

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error("Error updating order:", error);
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Alias for PATCH
  return PATCH(request, { params });
}
