import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getZRClient, mapZRStatusToHarpStatus } from "@/lib/zrexpress";

export const dynamic = "force-dynamic";

function validateCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Allow if no secret configured (dev)
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/v3/cron/sync-tracking
 * Polls ZR Express for status updates on active shipments.
 * Runs every 2-4 hours via Vercel Cron as a backup to webhooks.
 */
export async function GET(request: Request) {
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { synced: 0, changed: 0, emailsSent: 0, errors: 0 };

  try {
    // Get all orders with tracking that are not in a terminal state
    const activeOrders = await prisma.order.findMany({
      where: {
        trackingNumber: { not: null },
        deliveryProvider: { contains: "ZR" },
        status: { in: ["CONFIRMED", "SHIPPED"] },
      },
      include: { user: { select: { email: true, name: true } } },
      take: 100,
    });

    if (activeOrders.length === 0) {
      return NextResponse.json({ success: true, message: "No active shipments", ...results });
    }

    const zrClient = getZRClient();

    for (const order of activeOrders) {
      if (!order.trackingNumber) continue;

      try {
        // Try tracking number first, fall back to parcel ID
        const parcel =
          (await zrClient.getParcelByTracking(order.trackingNumber)) ||
          (await zrClient.getParcel(order.trackingNumber));

        if (!parcel) {
          results.errors++;
          continue;
        }

        results.synced++;

        const newTrackingStatus =
          parcel.state?.name || parcel.stateName || parcel.status || parcel.lastStatus || "";

        if (!newTrackingStatus || newTrackingStatus === order.trackingStatus) {
          continue;
        }

        // Status changed
        const harpStatus = mapZRStatusToHarpStatus(newTrackingStatus);
        const orderStatusChanged = harpStatus !== order.status;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            trackingStatus: newTrackingStatus,
            ...(orderStatusChanged ? { status: harpStatus } : {}),
          },
        });

        results.changed++;

        console.log(
          `[Sync Tracking] Order ${order.id}: ${order.trackingStatus} → ${newTrackingStatus} (${order.status} → ${harpStatus})`,
        );

        // Send email for significant changes
        if (orderStatusChanged && order.user?.email) {
          try {
            const { sendTrackingUpdateEmail } = await import("@/lib/email/tracking-update");
            await sendTrackingUpdateEmail({
              customerName: order.user.name || order.customerName,
              customerEmail: order.user.email,
              orderNumber: order.id.slice(-8).toUpperCase(),
              trackingNumber: order.trackingNumber,
              deliveryProvider: order.deliveryProvider || "ZR Express",
              newStatus: newTrackingStatus,
              harpStatus,
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
