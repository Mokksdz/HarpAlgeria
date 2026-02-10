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
    const tarifs = await client.getTarification();

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

    // Créer le colis ZR Express
    const colis = {
      TypeLivraison:
        orderData.deliveryType === "STOP_DESK"
          ? ("1" as const)
          : ("0" as const),
      TypeColis: "0" as const,
      Confrimee: "" as const, // Empty = "En préparation" (visible on dashboard)
      Client: orderData.customerName,
      MobileA: orderData.customerPhone.replace(/\s/g, ""),
      MobileB: orderData.customerPhoneB || "",
      Adresse: orderData.address,
      IDWilaya: orderData.wilayaId || "16",
      Commune: orderData.commune,
      Total: orderData.total.toString(),
      Note: orderData.notes || "",
      TProduit: orderData.products || "Articles Harp",
      id_Externe: orderId,
      Source: "Harp",
    };

    const result = await client.createShipment(colis);

    if (!result.success) {
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
