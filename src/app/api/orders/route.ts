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

    // Create the order and its items in a transaction
    const order = await prisma.order.create({
      data: {
        customerName: sanitizeString(body.customerName),
        customerPhone: sanitizeString(body.customerPhone),
        customerAddress: sanitizeString(body.customerAddress),
        customerCity: sanitizeString(body.customerCity),
        customerWilaya: body.customerWilaya,
        deliveryProvider: body.deliveryProvider || null,
        deliveryType: body.deliveryType || null,
        shippingPrice: parseFloat(body.shippingPrice) || 0,
        subtotal,
        total: totalAmount,
        userId: userId || null, // Link order to user if logged in
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Loyalty: Award points if user is logged in
    if (userId) {
      try {
        const points = Math.floor(totalAmount * LOYALTY_RULES.POINTS_PER_DZD);
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

    // Handle specific Prisma errors
    const prismaError = error as { code?: string; meta?: { field_name?: string } };
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
