import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySvixSignature, mapZRStatusToHarpStatus } from "@/lib/zrexpress";

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

/**
 * POST /api/webhooks/zrexpress
 * Receives real-time parcel state updates from ZR Express via Svix webhooks.
 * Event: "parcel.state.updated"
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Bug #3: Fail-closed — reject ALL requests if webhook secret is not configured
    const webhookSecret = process.env.ZR_EXPRESS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[ZR Webhook] ZR_EXPRESS_WEBHOOK_SECRET not configured — rejecting request");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    const svixId = request.headers.get("svix-id") || "";
    const svixTimestamp = request.headers.get("svix-timestamp") || "";
    const svixSignature = request.headers.get("svix-signature") || "";

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("[ZR Webhook] Missing Svix headers");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const valid = verifySvixSignature(rawBody, {
      svixId,
      svixTimestamp,
      svixSignature,
    }, webhookSecret);

    if (!valid) {
      console.error("[ZR Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ── Parse payload ──────────────────────────────────────────────────
    const payload = JSON.parse(rawBody);

    // Extract tracking info — adapt to actual payload structure
    const data = payload.data || payload;

    const trackingNumber = data.trackingNumber || data.tracking || "";
    const parcelId = data.parcelId || data.id || "";
    const newStateName = data.newStateName || data.stateName || data.state?.name || "";
    const previousStateName = data.previousStateName || "";

    if (!trackingNumber && !parcelId) {
      console.warn("[ZR Webhook] No tracking/parcel ID in payload");
      return NextResponse.json({ received: true, skipped: "no identifier" });
    }

    // Bug #9: Build safe OR query — only include non-empty values to avoid matching all orders
    const orConditions: { trackingNumber: string }[] = [];
    if (trackingNumber) orConditions.push({ trackingNumber });
    if (parcelId && parcelId !== trackingNumber) orConditions.push({ trackingNumber: parcelId });

    if (orConditions.length === 0) {
      return NextResponse.json({ received: true, skipped: "no valid identifier" });
    }

    // ── Find matching order in database ────────────────────────────────
    const order = await prisma.order.findFirst({
      where: { OR: orConditions },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!order) {
      console.warn(`[ZR Webhook] No order found for tracking=${trackingNumber} parcelId=${parcelId}`);
      return NextResponse.json({ received: true, skipped: "no matching order" });
    }

    // ── Map to Harp status ─────────────────────────────────────────────
    const harpStatus = newStateName ? mapZRStatusToHarpStatus(newStateName) : order.status;
    const statusChanged = newStateName && newStateName !== order.trackingStatus;
    const orderStatusChanged = harpStatus !== order.status;

    if (!statusChanged) {
      return NextResponse.json({ received: true, skipped: "no status change" });
    }

    // Bug #6: Only apply forward transitions — never regress DELIVERED→SHIPPED etc.
    const shouldUpdateOrderStatus = orderStatusChanged && isForwardTransition(order.status, harpStatus);

    // ── Update order ───────────────────────────────────────────────────
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingStatus: newStateName,
        ...(shouldUpdateOrderStatus ? { status: harpStatus } : {}),
      },
    });

    const finalStatus = shouldUpdateOrderStatus ? harpStatus : order.status;
    console.log(
      `[ZR Webhook] Order ${order.id} updated: ${previousStateName || order.trackingStatus} → ${newStateName} (${order.status} → ${finalStatus})`,
    );

    // Bug #18: Send email notification — also try customerPhone-based email lookup for guests
    if (shouldUpdateOrderStatus && order.user?.email) {
      try {
        const { sendTrackingUpdateEmail } = await import("@/lib/email/tracking-update");
        await sendTrackingUpdateEmail({
          customerName: order.user.name || order.customerName,
          customerEmail: order.user.email,
          orderNumber: order.id.slice(-8).toUpperCase(),
          trackingNumber: order.trackingNumber || trackingNumber,
          deliveryProvider: order.deliveryProvider || "ZR Express",
          newStatus: newStateName,
          harpStatus: finalStatus,
        });
      } catch (e) {
        console.error("[ZR Webhook] Email failed:", e);
      }
    }

    return NextResponse.json({
      received: true,
      orderId: order.id,
      statusUpdated: newStateName,
      orderStatus: finalStatus,
    });
  } catch (error) {
    console.error("[ZR Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Return 200 for GET (health check / webhook verification)
export async function GET() {
  return NextResponse.json({ status: "ok", handler: "zrexpress-webhook" });
}
