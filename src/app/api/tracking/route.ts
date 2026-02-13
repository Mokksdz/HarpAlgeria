import { NextRequest, NextResponse } from "next/server";
import { getYalidineClient, mapYalidineStatusToHarpStatus } from "@/lib/yalidine";
import { getZRClient, mapZRStatusToHarpStatus } from "@/lib/zrexpress";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

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

// GET /api/tracking - Get tracking info for a package (public — for customer tracking page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tracking = searchParams.get("tracking");
    const provider = searchParams.get("provider") || "auto";

    if (!tracking) {
      return NextResponse.json(
        { error: "Numéro de suivi requis" },
        { status: 400 },
      );
    }

    // Bug #19: Fix auto-detection — ZR tracking ends with "-ZR", Yalidine starts with "YAL-"
    let detectedProvider = provider;
    if (provider === "auto") {
      if (tracking.toLowerCase().startsWith("yal-") || tracking.toLowerCase().startsWith("yal_")) {
        detectedProvider = "yalidine";
      } else if (tracking.toUpperCase().endsWith("-ZR") || tracking.toLowerCase().startsWith("zr")) {
        detectedProvider = "zrexpress";
      } else {
        detectedProvider = "both";
      }
    }

    let result = null;

    // Try Yalidine
    if (detectedProvider === "yalidine" || detectedProvider === "both") {
      try {
        const yalidineClient = getYalidineClient();
        const yalidineResult = await yalidineClient.getParcel(tracking);

        if (yalidineResult.data && yalidineResult.data.length > 0) {
          const parcel = yalidineResult.data[0];

          let history: {
            status: string;
            date: string;
            location?: string;
            completed: boolean;
            current: boolean;
          }[] = [];
          try {
            const historyResult =
              await yalidineClient.getTrackingHistory(tracking);
            if (historyResult.data && historyResult.data.length > 0) {
              // Bug #12: Sort history newest-first to ensure current marker is on latest event
              const sorted = [...historyResult.data].sort(
                (a, b) => new Date(b.date_status).getTime() - new Date(a.date_status).getTime()
              );
              history = sorted.map((h, index) => ({
                status: h.status,
                date: new Date(h.date_status).toLocaleString("fr-FR"),
                location: h.center_name || h.wilaya_name,
                completed: true,
                current: index === 0,
              }));
            }
          } catch (e) {
            console.error("Error fetching Yalidine history:", e);
          }

          result = {
            found: true,
            provider: "Yalidine",
            tracking: parcel.tracking,
            status: parcel.last_status || "En cours",
            customerName: `${parcel.firstname} ${parcel.familyname}`,
            destination: `${parcel.to_commune_name}, ${parcel.to_wilaya_name}`,
            history:
              history.length > 0
                ? history
                : [
                    {
                      status: parcel.last_status || "En cours",
                      date: "Maintenant",
                      completed: true,
                      current: true,
                    },
                  ],
          };
        }
      } catch (e) {
        console.error("Yalidine tracking error:", e);
      }
    }

    // Try ZR Express if not found
    if (
      !result &&
      (detectedProvider === "zrexpress" || detectedProvider === "both")
    ) {
      try {
        const zrClient = getZRClient();

        const parcel =
          (await zrClient.getParcelByTracking(tracking)) ||
          (await zrClient.getParcel(tracking));

        if (parcel) {
          const parcelId = parcel.id || tracking;
          const currentStatus =
            parcel.state?.name || parcel.stateName || parcel.status || parcel.lastStatus || "En cours";
          const destination = [
            parcel.deliveryAddress?.district?.name || parcel.deliveryAddress?.districtName,
            parcel.deliveryAddress?.city?.name || parcel.deliveryAddress?.cityName,
          ]
            .filter(Boolean)
            .join(", ") || parcel.deliveryAddress?.street || "";

          let history: {
            status: string;
            date: string;
            location?: string;
            completed: boolean;
            current: boolean;
          }[] = [];

          try {
            const stateHistory = await zrClient.getParcelStateHistory(parcelId);
            if (stateHistory.length > 0) {
              history = stateHistory.map((entry, index) => ({
                status: entry.stateName,
                date: entry.timestamp
                  ? new Date(entry.timestamp).toLocaleString("fr-FR")
                  : "",
                location: entry.hubName || undefined,
                completed: true,
                current: index === 0,
              }));
            }
          } catch (e) {
            console.error("ZR Express state-history error:", e);
          }

          if (history.length === 0) {
            history = [
              {
                status: currentStatus,
                date: parcel.updatedAt
                  ? new Date(parcel.updatedAt).toLocaleString("fr-FR")
                  : "Maintenant",
                completed: true,
                current: true,
              },
              ...(parcel.createdAt
                ? [
                    {
                      status: "Colis créé",
                      date: new Date(parcel.createdAt).toLocaleString("fr-FR"),
                      completed: true,
                      current: false,
                    },
                  ]
                : []),
            ];
          }

          result = {
            found: true,
            provider: "ZR Express",
            tracking: parcel.trackingNumber || parcel.tracking || parcelId,
            status: currentStatus,
            destination,
            history,
          };
        }
      } catch (e) {
        console.error("ZR Express tracking error:", e);
      }
    }

    // If still not found, check local database
    if (!result) {
      const order = await prisma.order.findFirst({
        where: { trackingNumber: tracking },
        include: { items: true },
      });

      if (order) {
        result = {
          found: true,
          provider: order.deliveryProvider || "Inconnu",
          tracking: order.trackingNumber || tracking,
          status: order.trackingStatus || order.status,
          customerName: order.customerName,
          destination: `${order.customerCity}, Wilaya ${order.customerWilaya}`,
          history: [
            {
              status: order.trackingStatus || order.status,
              date: order.updatedAt.toLocaleString("fr-FR"),
              completed: true,
              current: true,
            },
          ],
        };
      }
    }

    if (result) {
      return NextResponse.json(result);
    }

    return NextResponse.json({
      found: false,
      error: "Colis non trouvé. Vérifiez votre numéro de suivi.",
    });
  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche du colis" },
      { status: 500 },
    );
  }
}

// POST /api/tracking/sync - Sync tracking status for an order
export async function POST(request: NextRequest) {
  try {
    // Bug #2: Require admin auth for status sync endpoint
    await requireAdmin(request);

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.trackingNumber) {
      return NextResponse.json(
        { error: "Commande ou tracking non trouvé" },
        { status: 404 },
      );
    }

    let newStatus = order.trackingStatus;
    let updated = false;

    // Fetch from appropriate provider
    if (order.deliveryProvider === "Yalidine") {
      try {
        const yalidineClient = getYalidineClient();
        const result = await yalidineClient.getParcel(order.trackingNumber);

        if (result.data && result.data.length > 0) {
          newStatus = result.data[0].last_status;
          updated = true;
        }
      } catch (e) {
        console.error("Yalidine sync error:", e);
      }
    } else if (order.deliveryProvider === "ZR Express") {
      try {
        const zrClient = getZRClient();
        const parcel =
          (await zrClient.getParcelByTracking(order.trackingNumber)) ||
          (await zrClient.getParcel(order.trackingNumber));

        if (parcel) {
          newStatus =
            parcel.state?.name || parcel.stateName || parcel.status || parcel.lastStatus || null;
          updated = !!newStatus;
        }
      } catch (e) {
        console.error("ZR Express sync error:", e);
      }
    }

    if (updated && newStatus !== order.trackingStatus) {
      // Bug #4: Use the correct mapper per provider
      const orderStatus = newStatus
        ? (order.deliveryProvider === "Yalidine"
            ? mapYalidineStatusToHarpStatus(newStatus)
            : mapZRStatusToHarpStatus(newStatus))
        : order.status;

      // Bug #6: Only apply forward transitions
      const shouldUpdateOrderStatus = isForwardTransition(order.status, orderStatus);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          trackingStatus: newStatus,
          ...(shouldUpdateOrderStatus ? { status: orderStatus } : {}),
        },
      });

      return NextResponse.json({
        success: true,
        previousStatus: order.trackingStatus,
        newStatus: newStatus,
        orderStatus: shouldUpdateOrderStatus ? orderStatus : order.status,
      });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: "Aucun changement de statut",
    });
  } catch (error) {
    console.error("Tracking sync error:", error);
    return handleApiError(error);
  }
}
