import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Marketing categories from Charge model
const MARKETING_CATEGORIES = ["ADS", "SHOOTING", "INFLUENCER"];

// GET accounting reports and dashboard data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const reportType = searchParams.get("type") || "dashboard";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    if (reportType === "dashboard") {
      const [
        inventoryItems,
        purchases,
        charges,
        orders,
        models,
        lowStockItems,
      ] = await Promise.all([
        prisma.inventoryItem.findMany(),
        prisma.purchase.findMany({
          where: { orderDate: { gte: startDate } },
          include: { items: true },
        }),
        prisma.charge.findMany({
          where: {
            date: { gte: startDate },
            category: { in: MARKETING_CATEGORIES },
          },
        }),
        prisma.order.findMany({
          where: {
            createdAt: { gte: startDate },
            status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
          },
        }),
        prisma.model.findMany({
          where: { isActive: true },
          include: {
            bom: { include: { inventoryItem: true } },
            charges: true,
          },
        }),
        prisma.inventoryItem.findMany({
          where: { threshold: { not: null } },
        }),
      ]);

      const inventoryValuation = inventoryItems.reduce(
        (sum: number, item) =>
          sum + Number(item.quantity) * Number(item.averageCost),
        0,
      );

      const purchasesTotal = purchases.reduce(
        (sum: number, p) => sum + Number(p.totalAmount),
        0,
      );

      const marketingTotal = charges.reduce(
        (sum: number, c) => sum + Number(c.amount),
        0,
      );

      const revenue = orders.reduce(
        (sum: number, o) => sum + Number(o.total),
        0,
      );

      const marketingByCategory = charges.reduce(
        (acc: Record<string, number>, c) => {
          acc[c.category] = (acc[c.category] || 0) + Number(c.amount);
          return acc;
        },
        {},
      );

      const inventoryByType = inventoryItems.reduce(
        (acc: Record<string, { count: number; value: number }>, item) => {
          if (!acc[item.type]) {
            acc[item.type] = { count: 0, value: 0 };
          }
          acc[item.type].count += 1;
          acc[item.type].value +=
            Number(item.quantity) * Number(item.averageCost);
          return acc;
        },
        {},
      );

      const lowStock = lowStockItems.filter(
        (item) => item.threshold !== null && item.quantity <= item.threshold,
      );

      const grossProfit = revenue - purchasesTotal;
      const netProfit = grossProfit - marketingTotal;

      return NextResponse.json({
        period,
        summary: {
          inventoryValuation: Math.round(inventoryValuation),
          purchasesTotal: Math.round(purchasesTotal),
          marketingTotal: Math.round(marketingTotal),
          revenue: Math.round(revenue),
          grossProfit: Math.round(grossProfit),
          netProfit: Math.round(netProfit),
          ordersCount: orders.length,
          modelsCount: models.length,
          lowStockCount: lowStock.length,
        },
        breakdowns: {
          marketingByCategory,
          inventoryByType,
        },
        alerts: {
          lowStock: lowStock.map((item) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            threshold: item.threshold,
            deficit: Number(item.threshold || 0) - Number(item.quantity),
          })),
        },
        recentPurchases: purchases.slice(0, 5),
        recentCharges: charges.slice(0, 5),
      });
    }

    if (reportType === "cost-per-model") {
      const models = await prisma.model.findMany({
        where: { isActive: true },
        include: {
          bom: { include: { inventoryItem: true } },
          charges: true,
        },
      });

      const modelsWithCosts = models.map((model) => {
        const estimatedUnits = model.estimatedUnits || 100;

        const fabricCost = model.bom
          .filter((b) => b.inventoryItem.type === "FABRIC")
          .reduce(
            (sum, b) =>
              sum +
              Number(b.quantity) *
                Number(b.wasteFactor) *
                Number(b.inventoryItem.averageCost),
            0,
          );

        const accessoryCost = model.bom
          .filter((b) => b.inventoryItem.type === "ACCESSORY")
          .reduce(
            (sum, b) =>
              sum + Number(b.quantity) * Number(b.inventoryItem.averageCost),
            0,
          );

        const packagingCost =
          model.bom
            .filter((b) => b.inventoryItem.type === "PACKAGING")
            .reduce(
              (sum, b) =>
                sum + Number(b.quantity) * Number(b.inventoryItem.averageCost),
              0,
            ) +
          (Number(model.packagingBox) || 0) +
          (Number(model.packagingBag) || 0) +
          (Number(model.packagingLabel) || 0) +
          (Number(model.packagingTag) || 0) +
          (Number(model.packagingCard) || 0) +
          (Number(model.packagingOther) || 0);

        const chargesPerUnit =
          model.charges.reduce((sum, c) => sum + Number(c.amount), 0) /
          estimatedUnits;

        const totalCost =
          fabricCost +
          accessoryCost +
          packagingCost +
          (Number(model.laborCost) || 0) +
          (Number(model.otherCost) || 0) +
          (Number(model.returnMargin) || 150) +
          chargesPerUnit;

        return {
          id: model.id,
          sku: model.sku,
          name: model.name,
          sellingPrice: model.sellingPrice,
          costs: {
            fabric: Math.round(fabricCost * 100) / 100,
            accessory: Math.round(accessoryCost * 100) / 100,
            packaging: Math.round(packagingCost * 100) / 100,
            labor: Number(model.laborCost) || 0,
            charges: Math.round(chargesPerUnit * 100) / 100,
            total: Math.round(totalCost * 100) / 100,
          },
          margin: model.sellingPrice
            ? Math.round((Number(model.sellingPrice) - totalCost) * 100) / 100
            : null,
          marginPercent: model.sellingPrice
            ? Math.round(
                ((Number(model.sellingPrice) - totalCost) /
                  Number(model.sellingPrice)) *
                  100 *
                  10,
              ) / 10
            : null,
        };
      });

      return NextResponse.json({ models: modelsWithCosts });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Error generating report:", error);
    const message = error instanceof Error ? error instanceof Error ? error.message : "Erreur inconnue" : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate report", details: message },
      { status: 500 },
    );
  }
}
