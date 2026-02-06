import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendReviewRequestEmail,
  sendComebackEmail,
} from "@/lib/email/post-purchase";

export const dynamic = "force-dynamic";

// Protect with a cron secret
function validateCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Allow if no secret configured (dev)
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { reviewEmails: 0, comebackEmails: 0, errors: 0 };

  try {
    const now = new Date();

    // ---------------------------------------------------------------
    // J+3: Review request emails
    // Orders delivered ~3 days ago (between 3 and 4 days ago)
    // ---------------------------------------------------------------
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const recentOrders = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        createdAt: { gte: fourDaysAgo, lte: threeDaysAgo },
        userId: { not: null },
      },
      include: {
        user: { select: { email: true, name: true } },
        items: { take: 1, select: { productName: true, productId: true } },
      },
      take: 50,
    });

    for (const order of recentOrders) {
      if (!order.user?.email || !order.items[0]) continue;
      try {
        await sendReviewRequestEmail({
          to: order.user.email,
          customerName: order.user.name || order.customerName,
          orderNumber: order.orderNumber,
          productName: order.items[0].productName,
          productId: order.items[0].productId || "",
        });
        results.reviewEmails++;
      } catch {
        results.errors++;
      }
    }

    // ---------------------------------------------------------------
    // J+14: Comeback / loyalty emails
    // Orders delivered ~14 days ago (between 14 and 15 days ago)
    // ---------------------------------------------------------------
    const fourteenDaysAgo = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );
    const fifteenDaysAgo = new Date(
      now.getTime() - 15 * 24 * 60 * 60 * 1000,
    );

    const oldOrders = await prisma.order.findMany({
      where: {
        status: "DELIVERED",
        createdAt: { gte: fifteenDaysAgo, lte: fourteenDaysAgo },
        userId: { not: null },
      },
      include: {
        user: { select: { email: true, name: true, loyaltyPoints: true } },
      },
      take: 50,
    });

    for (const order of oldOrders) {
      if (!order.user?.email) continue;
      try {
        await sendComebackEmail({
          to: order.user.email,
          customerName: order.user.name || order.customerName,
          loyaltyPoints: order.user.loyaltyPoints,
        });
        results.comebackEmails++;
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error("[Post-Purchase Cron] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
