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

// POST /api/shipping - Créer une expédition
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { orderId, orderData } = body;

    if (!orderId || !orderData) {
      return NextResponse.json(
        { error: "orderId et orderData sont requis" },
        { status: 400 },
      );
    }

    const client = getZRClient();

    // Validate required fields before calling ZR Express
    if (!orderData.customerName || !orderData.customerPhone || !orderData.address) {
      return NextResponse.json(
        { success: false, error: "Champs obligatoires manquants: nom, téléphone, adresse" },
        { status: 400 },
      );
    }

    console.log("Creating ZR Express shipment for order:", orderId, {
      wilayaId: orderData.wilayaId,
      commune: orderData.commune,
      deliveryType: orderData.deliveryType,
      total: orderData.total,
    });

    // Créer le colis ZR Express (nouvelle API)
    const result = await client.createShipment({
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerPhoneB: orderData.customerPhoneB || "",
      address: orderData.address,
      wilayaId: orderData.wilayaId || "16",
      commune: orderData.commune || "",
      total: parseFloat(orderData.total) || 0,
      products: orderData.products || "Articles Harp",
      deliveryType: orderData.deliveryType || "HOME",
      externalId: orderId,
      notes: orderData.notes || "",
    });

    if (!result.success) {
      console.error("ZR Express shipment creation failed for order:", orderId, result.message, result.data);
      return NextResponse.json(
        { success: false, error: result.message || "Échec création colis ZR Express", data: result.data },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      tracking: result.tracking,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
