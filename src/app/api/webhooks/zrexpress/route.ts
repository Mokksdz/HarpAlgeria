import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySvixSignature, mapZRStatusToHarpStatus } from "@/lib/zrexpress";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/zrexpress
 * Receives real-time parcel state updates from ZR Express via Svix webhooks.
 * Event: "parcel.state.updated"
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // ── Verify Svix signature ──────────────────────────────────────────
    const webhookSecret = process.env.ZR_EXPRESS_WEBHOOK_SECRET;
    if (webhookSecret) {
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
    }

    // ── Parse payload ──────────────────────────────────────────────────
    const payload = JSON.parse(rawBody);
    console.log("[ZR Webhook] Received:", JSON.stringify(payload).slice(0, 1000));

    // Extract tracking info — adapt to actual payload structure
    const eventType = payload.eventType || payload.type || "";
    const data = payload.data || payload;

    const trackingNumber = data.trackingNumber || data.tracking || "";
    const parcelId = data.parcelId || data.id || "";
    const newStateName = data.newStateName || data.stateName || data.state?.name || "";
    const previousStateName = data.previousStateName || "";

    if (!trackingNumber && !parcelId) {
      console.warn("[ZR Webhook] No tracking/parcel ID in payload");
      return NextResponse.json({ received: true, skipped: "no identifier" });
    }

    // ── Find matching order in database ────────────────────────────────
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingNumber: trackingNumber || undefined },
          { trackingNumber: parcelId || undefined },
        ],
      },
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

    // ── Update order ───────────────────────────────────────────────────
    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingStatus: newStateName,
        ...(orderStatusChanged ? { status: harpStatus } : {}),
      },
    });

    console.log(
      `[ZR Webhook] Order ${order.id} updated: ${previousStateName || order.trackingStatus} → ${newStateName} (${order.status} → ${harpStatus})`,
    );

    // ── Send email notification for significant status changes ─────────
    if (orderStatusChanged && order.user?.email) {
      try {
        const { sendTrackingUpdateEmail } = await import("@/lib/email/tracking-update");
        sendTrackingUpdateEmail({
          customerName: order.user.name || order.customerName,
          customerEmail: order.user.email,
          orderNumber: order.id.slice(-8).toUpperCase(),
          trackingNumber: order.trackingNumber || trackingNumber,
          deliveryProvider: order.deliveryProvider || "ZR Express",
          newStatus: newStateName,
          harpStatus,
        }).catch((e: any) => console.error("[ZR Webhook] Email failed:", e));
      } catch (e) {
        console.error("[ZR Webhook] Email import error:", e);
      }
    }

    return NextResponse.json({
      received: true,
      orderId: order.id,
      statusUpdated: newStateName,
      orderStatus: harpStatus,
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
