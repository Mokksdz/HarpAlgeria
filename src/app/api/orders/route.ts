import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOrder, sanitizeString } from "@/lib/validations";
import { parsePagination, paginatedResponse } from "@/lib/pagination";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  earnPoints,
  LOYALTY_RULES,
} from "@/lib/loyalty/services/loyalty.service";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getActivePrice } from "@/lib/product-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);

    // Optional filters
    const status = searchParams.get("status");
    const customerPhone = searchParams.get("customerPhone");
    const search = searchParams.get("search");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customerPhone) {
      where.customerPhone = { contains: customerPhone };
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { trackingNumber: { contains: search } },
        { id: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(orders, page, pageSize, total));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting for order creation
  const rateLimited = withRateLimit(request, RATE_LIMITS.SUBMIT, "orders");
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    // Validate userId exists in database if provided
    let userId = null;
    if (session?.user && (session.user as any).id) {
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { id: true },
      });
      userId = user?.id || null;
    }

    // Validate input
    const validation = validateOrder(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    // Calculate subtotal from items
    const subtotal = body.items.reduce(
      (sum: number, item: { quantity: number; price: number }) =>
        sum + parseInt(String(item.quantity)) * parseFloat(String(item.price)),
      0,
    );

    const totalAmount = parseFloat(body.total);

    // Prepare items - skip productId validation to avoid FK issues
    const itemsData = body.items.map(
      (item: {
        productId?: string;
        productName: string;
        size: string;
        color: string;
        quantity: number;
        price: number;
      }) => ({
        // Skip productId entirely to avoid foreign key issues
        productName: sanitizeString(item.productName),
        size: item.size,
        color: item.color,
        quantity: parseInt(String(item.quantity)),
        unitPrice: parseFloat(String(item.price)),
        totalPrice:
          parseInt(String(item.quantity)) * parseFloat(String(item.price)),
      }),
    );

    // Create the order and decrement stock in a single transaction
    const order = await prisma.$transaction(async (tx) => {
      // Validate & decrement variant stock for each item
      for (const item of body.items) {
        if (!item.productId) continue;
        const qty = parseInt(String(item.quantity));

        // Try to find a matching variant
        const variant = await tx.productVariant.findUnique({
          where: {
            productId_size_color: {
              productId: item.productId,
              size: item.size,
              color: item.color,
            },
          },
        });

        if (variant) {
          // Variant-level stock check
          if (variant.stock < qty) {
            throw new Error(
              `Stock insuffisant pour ${item.productName} (${item.size}/${item.color}): ${variant.stock} disponible(s)`,
            );
          }
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: qty } },
          });
          // Also decrement the product-level total stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: qty } },
          });
        } else {
          // No variant: fallback to product-level stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          });
          if (product && product.stock < qty) {
            throw new Error(
              `Stock insuffisant pour ${item.productName}: ${product.stock} disponible(s)`,
            );
          }
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: qty } },
            });
          }
        }
      }

      // Create the order
      return tx.order.create({
        data: {
          customerName: sanitizeString(body.customerName),
          customerPhone: sanitizeString(body.customerPhone),
          customerAddress: body.customerAddress ? sanitizeString(body.customerAddress) : "",
          customerCity: body.customerCity ? sanitizeString(body.customerCity) : "",
          customerWilaya: body.customerWilaya,
          deliveryProvider: body.deliveryProvider || null,
          deliveryType: body.deliveryType || null,
          shippingPrice: parseFloat(body.shippingPrice) || 0,
          subtotal,
          total: totalAmount,
          userId: userId || null,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });
    });

    // Auto-create shipment on delivery provider (non-blocking — order is already saved)
    let autoShipmentTracking: string | null = null;
    if (body.deliveryProvider) {
      try {
        if (body.deliveryProvider === "ZR Express") {
          const { getZRClient } = await import("@/lib/zrexpress");
          const client = getZRClient();
          const productsList =
            body.items
              .map(
                (i: { quantity: number; productName: string }) =>
                  `${i.quantity}x ${i.productName}`,
              )
              .join(", ") || "Commande Harp";

          const result = await client.createShipment({
            customerName: body.customerName,
            customerPhone: body.customerPhone,
            address: body.customerAddress,
            wilayaId: body.customerWilaya || "16",
            commune: body.customerCity,
            total: subtotal, // Product value excluding shipping
            products: productsList,
            deliveryType: body.deliveryType || "HOME",
            externalId: order.id,
            notes: `Commande Harp #${order.id.slice(-8).toUpperCase()}`,
          });

          if (result.success && result.tracking) {
            autoShipmentTracking = result.tracking;
          } else {
            console.error("ZR Express auto-shipment failed:", result.message);
          }
        } else if (body.deliveryProvider === "Yalidine") {
          const { getYalidineClient, orderToYalidineParcel } = await import(
            "@/lib/yalidine"
          );
          const client = getYalidineClient();
          const parcel = orderToYalidineParcel(
            {
              id: order.id,
              customerName: body.customerName,
              customerPhone: body.customerPhone,
              address: body.customerAddress,
              wilaya: body.customerWilaya,
              commune: body.customerCity,
              total: subtotal,
              items: body.items.map((i: any) => ({
                quantity: parseInt(String(i.quantity)),
                productName: i.productName,
              })),
              deliveryType:
                body.deliveryType === "DESK" ? "STOP_DESK" : "DOMICILE",
              stopDeskId: body.stopDeskId || undefined,
            },
            "Alger",
          );

          const result = await client.createParcel(parcel);
          if (result.success && result.tracking) {
            autoShipmentTracking = result.tracking;
          } else {
            console.error("Yalidine auto-shipment failed:", result.message);
          }
        }

        // Update order with tracking number if shipment created
        if (autoShipmentTracking) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              trackingNumber: autoShipmentTracking,
              trackingStatus: "En préparation",
              status: "CONFIRMED",
            },
          });
          console.log(
            `Auto-shipment created for order ${order.id}: tracking=${autoShipmentTracking}`,
          );
        }
      } catch (shipError) {
        // Order is already saved — don't fail the checkout
        console.error(
          `Auto-shipment failed for order ${order.id} (order still created):`,
          shipError,
        );
      }
    }

    // Send order confirmation email (non-blocking)
    if (userId) {
      try {
        const userForEmail = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });
        if (userForEmail?.email) {
          const { sendOrderConfirmationEmail } =
            await import("@/lib/email/order-confirmation");
          sendOrderConfirmationEmail({
            customerName: body.customerName,
            customerEmail: userForEmail.email,
            orderNumber: order.id.slice(0, 8).toUpperCase(),
            items: body.items.map((item: any) => ({
              productName: item.productName,
              size: item.size,
              color: item.color,
              quantity: parseInt(String(item.quantity)),
              price: parseFloat(String(item.price)),
            })),
            subtotal,
            shippingPrice: parseFloat(body.shippingPrice) || 0,
            total: totalAmount,
            deliveryProvider: body.deliveryProvider || "Standard",
            deliveryType: body.deliveryType || "HOME",
            customerAddress: body.customerAddress,
            customerCity: body.customerCity,
            customerWilaya: body.customerWilaya,
          }).catch((e: any) =>
            console.error("Order confirmation email failed:", e),
          );
        }
      } catch (e) {
        console.error("Email setup error:", e);
      }
    }

    // Loyalty: Award points only on non-promo items (batch query instead of N+1)
    if (userId) {
      try {
        const productIds = body.items
          .map((item: { productId?: string }) => item.productId)
          .filter(Boolean) as string[];

        // Single batch query for all products
        const products = productIds.length > 0
          ? await prisma.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, price: true, promoPrice: true, promoStart: true, promoEnd: true },
            })
          : [];
        const productMap = new Map(products.map((p) => [p.id, p]));

        let eligibleAmount = 0;
        for (const item of body.items) {
          const qty = parseInt(String(item.quantity));
          const price = parseFloat(String(item.price));
          if (!item.productId) {
            eligibleAmount += qty * price;
            continue;
          }
          const prod = productMap.get(item.productId);
          if (prod) {
            const { isPromo } = getActivePrice({
              price: Number(prod.price),
              promoPrice: prod.promoPrice ? Number(prod.promoPrice) : null,
              promoStart: prod.promoStart,
              promoEnd: prod.promoEnd,
            });
            if (!isPromo) {
              eligibleAmount += qty * price;
            }
          }
        }
        const points = Math.floor(
          eligibleAmount * LOYALTY_RULES.POINTS_PER_DZD,
        );
        if (points > 0) {
          await earnPoints(userId, points, "PURCHASE", order.id);
        }
      } catch (loyaltyError) {
        console.error("Failed to award loyalty points:", loyaltyError);
        // Do not fail the order if points fail
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    console.error("Order creation error:", error);

    // Handle stock insufficiency errors
    if (
      error instanceof Error &&
      error.message.startsWith("Stock insuffisant")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle specific Prisma errors
    const prismaError = error as {
      code?: string;
      meta?: { field_name?: string };
    };
    if (prismaError?.code === "P2003") {
      console.error("Foreign key constraint failed:", prismaError?.meta);
      return NextResponse.json(
        {
          error: "Référence invalide dans la commande",
          details: prismaError?.meta?.field_name || "foreign key",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error creating order" },
      { status: 500 },
    );
  }
}
