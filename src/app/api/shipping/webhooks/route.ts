import { NextRequest, NextResponse } from "next/server";
import { getZRClient } from "@/lib/zrexpress";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

/**
 * GET /api/shipping/webhooks — List all configured ZR Express webhooks
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const client = getZRClient();
    const webhooks = await client.listWebhooks();

    return NextResponse.json({ webhooks });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/shipping/webhooks — Register a new webhook on ZR Express
 * Body: { url?: string } — if not provided, auto-constructs from NEXT_PUBLIC_BASE_URL
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => ({}));
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";
    const webhookUrl = body.url || `${baseUrl}/api/webhooks/zrexpress`;

    const client = getZRClient();

    // Check if webhook already exists for this URL
    const existing = await client.listWebhooks();
    const alreadyExists = existing.find((w) => w.url === webhookUrl);
    if (alreadyExists) {
      // Retrieve the secret for this endpoint
      const secret = await client.getWebhookSecret(alreadyExists.id);
      return NextResponse.json({
        success: true,
        message: "Webhook existe d\u00e9j\u00e0",
        webhook: alreadyExists,
        secret,
        alreadyExisted: true,
      });
    }

    const result = await client.createWebhook({
      url: webhookUrl,
      description: "Harp e-commerce — suivi temps r\u00e9el",
      eventTypes: body.eventTypes || ["parcel.state.updated"],
    });

    if (!result) {
      return NextResponse.json(
        { error: "\u00c9chec cr\u00e9ation webhook ZR Express" },
        { status: 400 },
      );
    }

    // Retrieve the secret for signature verification
    const secret = await client.getWebhookSecret(result.id);

    return NextResponse.json({
      success: true,
      webhook: result,
      secret,
      message: `Webhook cr\u00e9\u00e9 ! Ajoutez ZR_EXPRESS_WEBHOOK_SECRET="${secret || ""}" \u00e0 votre .env`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/shipping/webhooks — Delete a webhook
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const client = getZRClient();
    const deleted = await client.deleteWebhook(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "\u00c9chec suppression webhook" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, message: "Webhook supprim\u00e9" });
  } catch (error) {
    return handleApiError(error);
  }
}
