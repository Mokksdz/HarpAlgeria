import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30"; // days
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Stock stats
    const stockStats = await prisma.inventoryItem.aggregate({
      _sum: { totalValue: true, quantity: true },
      _count: true,
    });

    // Count items with low stock (quantity - reserved <= 10)
    const allItems = await prisma.inventoryItem.findMany({
      select: { quantity: true, reserved: true },
    });
    const lowStockItems = allItems.filter(
      (item) => (Number(item.quantity) - Number(item.reserved)) <= 10
    ).length;

    // Purchase stats
    const purchaseStats = await prisma.purchase.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { totalAmount: true },
      _count: true,
    });

    const pendingPurchases = await prisma.purchase.count({
      where: { status: { in: ["DRAFT", "ORDERED", "PARTIAL"] } },
    });

    // Charge stats
    const chargeStats = await prisma.charge.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { amount: true },
      _count: true,
    });

    const chargesByCategory = await prisma.charge.groupBy({
      by: ["category"],
      where: { createdAt: { gte: startDate } },
      _sum: { amount: true },
    });

    // Production stats
    const productionStats = await prisma.productionBatch.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { totalCost: true, plannedQty: true },
      _count: true,
    });

    const batchesByStatus = await prisma.productionBatch.groupBy({
      by: ["status"],
      _count: true,
    });

    // Advance stats
    const advanceStats = await prisma.supplierAdvance.aggregate({
      _sum: { amount: true, amountUsed: true, amountRemaining: true },
    });

    // Recent activity
    const recentPurchases = await prisma.purchase.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        purchaseNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        supplier: { select: { name: true } },
      },
    });

    const recentBatches = await prisma.productionBatch.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        batchNumber: true,
        plannedQty: true,
        status: true,
        createdAt: true,
        model: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      period: { days, startDate: startDate.toISOString() },
      stock: {
        totalValue: stockStats._sum.totalValue || 0,
        totalItems: stockStats._count,
        totalQuantity: stockStats._sum.quantity || 0,
        lowStockItems,
      },
      purchases: {
        total: purchaseStats._sum.totalAmount || 0,
        count: purchaseStats._count,
        pending: pendingPurchases,
      },
      charges: {
        total: chargeStats._sum.amount || 0,
        count: chargeStats._count,
        byCategory: chargesByCategory,
      },
      production: {
        totalCost: productionStats._sum.totalCost || 0,
        totalUnits: productionStats._sum.plannedQty || 0,
        count: productionStats._count,
        byStatus: batchesByStatus,
      },
      advances: {
        total: advanceStats._sum.amount || 0,
        used: advanceStats._sum.amountUsed || 0,
        remaining: advanceStats._sum.amountRemaining || 0,
      },
      recent: {
        purchases: recentPurchases,
        batches: recentBatches,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
