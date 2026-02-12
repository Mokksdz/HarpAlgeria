import { NextRequest, NextResponse } from "next/server";
import { getZRClient } from "@/lib/zrexpress";
import {
  getZRStopDesks,
  ZR_EXPRESS_STOPDESKS,
} from "@/lib/zrexpress-stopdesks";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

// GET /api/shipping - Tester la connexion, récupérer les tarifs, ou les stop desks
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Get stop desks for a wilaya
    if (action === "stopdesks") {
      const wilayaId = searchParams.get("wilaya_id");
      if (wilayaId) {
        const stopDesks = getZRStopDesks(parseInt(wilayaId));
        return NextResponse.json({ data: stopDesks });
      }
      // Return all stop desks if no wilaya specified
      return NextResponse.json({ data: ZR_EXPRESS_STOPDESKS });
    }

    const client = getZRClient();

    // Tester la connexion
    const connectionTest = await client.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json(
        { error: "Impossible de se connecter à ZR Express" },
        { status: 503 },
      );
    }

    // Récupérer les tarifs
    const tarifs = await client.getRates();

    return NextResponse.json({
      connected: true,
      tarifs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/shipping - Créer une expédition ZR Express
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { orderId, orderData } = body;

    console.log("[SHIPPING] POST /api/shipping received:", JSON.stringify({ orderId, orderData }, null, 2));

    if (!orderId || !orderData) {
      return NextResponse.json(
        { success: false, error: "orderId et orderData sont requis" },
        { status: 400 },
      );
    }

    // Validate required fields
    const missing: string[] = [];
    if (!orderData.customerName) missing.push("nom");
    if (!orderData.customerPhone) missing.push("téléphone");
    if (!orderData.address) missing.push("adresse");
    if (missing.length > 0) {
      console.error("[SHIPPING] Missing fields:", missing, "orderData:", JSON.stringify(orderData));
      return NextResponse.json(
        { success: false, error: `Champs obligatoires manquants: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    const client = getZRClient();

    const result = await client.createShipment({
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerPhoneB: orderData.customerPhoneB || "",
      address: orderData.address,
      wilayaId: orderData.wilayaId || "16",
      commune: orderData.commune || "",
      total: parseFloat(orderData.total) || 0,
      products: orderData.products || "Articles Harp",
      deliveryType: orderData.deliveryType || "DOMICILE",
      externalId: orderId,
      notes: orderData.notes || "",
    });

    console.log("[SHIPPING] ZR Express result for", orderId, ":", JSON.stringify(result));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || "Échec création colis ZR Express" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      tracking: result.tracking,
      data: result,
    });
  } catch (error: unknown) {
    console.error("[SHIPPING] Unhandled error:", error);
    return handleApiError(error);
  }
}
