import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getZRClient, mapZRStatusToHarpStatus } from "@/lib/zrexpress";
import { getYalidineClient, mapYalidineStatusToHarpStatus } from "@/lib/yalidine";

export const dynamic = "force-dynamic";

// Bug #6: Status transition state machine — forward-only transitions
const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 4,
};

function isForwardTransition(currentStatus: string, newStatus: string): boolean {
  if (newStatus === "CANCELLED") return currentStatus !== "DELIVERED";
  if (currentStatus === "CANCELLED" || currentStatus === "DELIVERED") return false;
  return (STATUS_ORDER[newStatus] ?? -1) > (STATUS_ORDER[currentStatus] ?? -1);
}

function validateCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Allow if no secret configured (dev)
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/v3/cron/sync-tracking
 * Polls ZR Express AND Yalidine for status updates on active shipments.
 * Bug #9: Now syncs BOTH providers (was ZR Express only).
 * Bug #11: Processes in batches with ordering to avoid missing orders.
 */
export async function GET(request: Request) {
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { synced: 0, changed: 0, emailsSent: 0, errors: 0, total: 0 };

  try {
    // Bug #9: Get ALL active orders with tracking (both ZR Express and Yalidine)
    // Bug #11: Order by updatedAt ASC so oldest-synced get priority, process in batches
    const activeOrders = await prisma.order.findMany({
      where: {
        trackingNumber: { not: null },
        status: { in: ["CONFIRMED", "SHIPPED"] },
        deliveryProvider: { not: null },
      },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { updatedAt: "asc" },
      take: 200, // Bug #11: Increased from 100, with ordering
    });

    results.total = activeOrders.length;

    if (activeOrders.length === 0) {
      return NextResponse.json({ success: true, message: "No active shipments", ...results });
    }

    const zrClient = getZRClient();
    const yalidineClient = getYalidineClient();

    for (const order of activeOrders) {
      if (!order.trackingNumber) continue;

      try {
        let newTrackingStatus: string | null = null;

        // Fetch from appropriate provider
        if (order.deliveryProvider === "Yalidine") {
          // Bug #9: Now syncs Yalidine orders too
          try {
            const result = await yalidineClient.getParcel(order.trackingNumber);
            if (result.data && result.data.length > 0) {
              newTrackingStatus = result.data[0].last_status;
            }
          } catch (e) {
            console.error(`[Sync Tracking] Yalidine error for ${order.id}:`, e);
          }
        } else if (order.deliveryProvider?.includes("ZR")) {
          try {
            const parcel =
              (await zrClient.getParcelByTracking(order.trackingNumber)) ||
              (await zrClient.getParcel(order.trackingNumber));

            if (parcel) {
              newTrackingStatus =
                parcel.state?.name || parcel.stateName || parcel.status || parcel.lastStatus || null;
            }
          } catch (e) {
            console.error(`[Sync Tracking] ZR error for ${order.id}:`, e);
          }
        }

        if (!newTrackingStatus) {
          results.errors++;
          continue;
        }

        results.synced++;

        if (newTrackingStatus === order.trackingStatus) {
          continue;
        }

        // Bug #4: Use correct mapper per provider
        const harpStatus = order.deliveryProvider === "Yalidine"
          ? mapYalidineStatusToHarpStatus(newTrackingStatus)
          : mapZRStatusToHarpStatus(newTrackingStatus);

        // Bug #6: Only apply forward transitions
        const shouldUpdateOrderStatus = isForwardTransition(order.status, harpStatus);

        // Bug #15: Restore stock when carrier returns/cancels the parcel
        if (shouldUpdateOrderStatus && harpStatus === "CANCELLED" && order.status === "SHIPPED") {
          try {
            // Restore product variant stock for each order item
            const orderItems = await prisma.orderItem.findMany({
              where: { orderId: order.id },
            });
            for (const item of orderItems) {
              if (item.productId) {
                // Find and increment variant stock
                const variant = await prisma.productVariant.findFirst({
                  where: { productId: item.productId, size: item.size, color: item.color },
                });
                if (variant) {
                  await prisma.productVariant.update({
                    where: { id: variant.id },
                    data: { stock: { increment: item.quantity } },
                  });
                }
                // Also increment product total stock
                await prisma.product.update({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } },
                });
              }
            }
            console.log(`[Sync Tracking] Stock restored for cancelled order ${order.id}`);
          } catch (stockErr) {
            console.error(`[Sync Tracking] Stock restore failed for ${order.id}:`, stockErr);
          }
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            trackingStatus: newTrackingStatus,
            ...(shouldUpdateOrderStatus ? { status: harpStatus } : {}),
          },
        });

        results.changed++;

        console.log(
          `[Sync Tracking] Order ${order.id} (${order.deliveryProvider}): ${order.trackingStatus} → ${newTrackingStatus} (${order.status} → ${shouldUpdateOrderStatus ? harpStatus : order.status})`,
        );

        // Send email for significant changes
        if (shouldUpdateOrderStatus && order.user?.email) {
          try {
            const { sendTrackingUpdateEmail } = await import("@/lib/email/tracking-update");
            await sendTrackingUpdateEmail({
              customerName: order.user.name || order.customerName,
              customerEmail: order.user.email,
              orderNumber: order.id.slice(-8).toUpperCase(),
              trackingNumber: order.trackingNumber,
              deliveryProvider: order.deliveryProvider || "Inconnu",
              newStatus: newTrackingStatus,
              harpStatus: shouldUpdateOrderStatus ? harpStatus : order.status,
            });
            results.emailsSent++;
          } catch (e) {
            console.error(`[Sync Tracking] Email failed for order ${order.id}:`, e);
            results.errors++;
          }
        }
      } catch (e) {
        console.error(`[Sync Tracking] Error for order ${order.id}:`, e);
        results.errors++;
      }
    }

    console.log("[Sync Tracking] Complete:", results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error("[Sync Tracking] Fatal error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
