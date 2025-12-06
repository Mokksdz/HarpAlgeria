import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientsQuerySchema } from "@/lib/schemas/admin.schemas";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const q = clientsQuerySchema.parse(query);

    // Build where clause
    const where: any = {};

    if (q.search) {
      where.OR = [
        { email: { contains: q.search } },
        { name: { contains: q.search } },
        { phone: { contains: q.search } },
      ];
    }

    if (q.vipLevel && q.vipLevel !== "ALL") {
      where.vipLevel = q.vipLevel;
    }

    const skip = (q.page - 1) * q.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { [q.sortBy]: q.sortOrder },
        skip,
        take: q.pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          birthDate: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          loyaltyPoints: true,
          vipLevel: true,
          isEmailVerified: true,
          createdVia: true,
          guestKey: true,
          orders: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              createdAt: true,
              customerWilaya: true,
              customerCity: true,
              customerAddress: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          wishlist: {
            select: {
              id: true,
              productId: true,
              product: {
                select: {
                  nameFr: true,
                  price: true,
                },
              },
            },
          },
          pointHistory: {
            select: {
              id: true,
              amount: true,
              reason: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: {
              orders: true,
              wishlist: true,
              pointHistory: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform items with complete data
    const transformedItems = items.map((item) => {
      // Calculate total spent
      const totalSpent = item.orders.reduce((sum, order) => {
        return sum + Number(order.total);
      }, 0);

      // Get last order info
      const lastOrder = item.orders[0] || null;

      // Get address from last order
      const lastAddress = lastOrder
        ? {
            wilaya: lastOrder.customerWilaya,
            city: lastOrder.customerCity,
            address: lastOrder.customerAddress,
          }
        : null;

      return {
        id: item.id,
        email: item.email,
        name: item.name,
        phone: item.phone,
        birthDate: item.birthDate,
        role: item.role,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        loyaltyPoints: item.loyaltyPoints,
        vipLevel: item.vipLevel,
        isEmailVerified: item.isEmailVerified,
        createdVia: item.createdVia,
        // Computed fields
        orderCount: item._count.orders,
        wishlistCount: item._count.wishlist,
        pointHistoryCount: item._count.pointHistory,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt || null,
        lastOrderStatus: lastOrder?.status || null,
        lastAddress,
        // Related data
        recentOrders: item.orders,
        wishlist: item.wishlist,
        pointHistory: item.pointHistory,
      };
    });

    return NextResponse.json({
      success: true,
      items: transformedItems,
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.ceil(total / q.pageSize),
      },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
