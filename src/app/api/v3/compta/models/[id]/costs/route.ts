import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// GET: Calculate cost breakdown
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const model = await prisma.model.findUnique({
      where: { id },
      include: {
        collection: true,
        bom: { include: { inventoryItem: true } },
        charges: true,
      },
    });

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle non trouvé" },
        { status: 404 },
      );
    }

    // 1. Materials cost from BOM
    let fabricCost = 0;
    let accessoryCost = 0;
    let packagingCost = 0;

    for (const bom of model.bom) {
      const cost =
        Number(bom.quantity) *
        Number(bom.wasteFactor) *
        Number(bom.inventoryItem.averageCost);
      switch (bom.inventoryItem.type) {
        case "FABRIC":
          fabricCost += cost;
          break;
        case "ACCESSORY":
        case "TRIM":
        case "LABEL":
          accessoryCost += cost;
          break;
        case "PACKAGING":
          packagingCost += cost;
          break;
      }
    }
    const materialsCost = fabricCost + accessoryCost + packagingCost;

    // 2. Production costs
    const laborCost = Number(model.laborCost);
    const atelierCharges = model.charges
      .filter((c) => c.category === "ATELIER")
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const atelierCost =
      model.estimatedUnits > 0 ? atelierCharges / model.estimatedUnits : 0;
    const productionCost = laborCost + atelierCost;

    // 3. Marketing costs
    const getChargePerUnit = (category: string) => {
      const total = model.charges
        .filter((c) => c.category === category)
        .reduce((sum, c) => sum + Number(c.amount), 0);
      return model.estimatedUnits > 0 ? total / model.estimatedUnits : 0;
    };

    const adsCost = getChargePerUnit("ADS");
    const shootingCost = getChargePerUnit("SHOOTING");
    const influencerCost = getChargePerUnit("INFLUENCER");
    const marketingCost = adsCost + shootingCost + influencerCost;

    // 4. Other costs
    const transportCost = getChargePerUnit("TRANSPORT");
    const otherCost = Number(model.otherCost);
    const returnMargin = Number(model.returnMargin) || 0;

    // 5. Total
    const totalCost =
      materialsCost +
      productionCost +
      marketingCost +
      transportCost +
      otherCost +
      returnMargin;

    // 6. Suggested prices
    const round = (n: number) => Math.round(n * 100) / 100;
    const suggestedPrices = {
      margin30: round(totalCost / 0.7),
      margin40: round(totalCost / 0.6),
      margin50: round(totalCost / 0.5),
    };

    // 7. Current margin
    const currentPrice = model.sellingPrice ? Number(model.sellingPrice) : null;
    const currentMargin = currentPrice ? currentPrice - totalCost : null;
    const currentMarginPercent =
      currentPrice && currentPrice > 0
        ? round((currentMargin! / currentPrice) * 100)
        : null;

    const breakdown = {
      fabricCost: round(fabricCost),
      accessoryCost: round(accessoryCost),
      packagingCost: round(packagingCost),
      materialsCost: round(materialsCost),
      laborCost: round(Number(laborCost)),
      atelierCost: round(atelierCost),
      productionCost: round(productionCost),
      adsCost: round(adsCost),
      shootingCost: round(shootingCost),
      influencerCost: round(influencerCost),
      marketingCost: round(marketingCost),
      transportCost: round(transportCost),
      otherCost: round(Number(otherCost)),
      returnMargin: round(Number(returnMargin)),
      totalCost: round(totalCost),
    };

    return NextResponse.json({
      success: true,
      model: { id: model.id, sku: model.sku, name: model.name },
      breakdown,
      suggestedPrices,
      currentPrice,
      currentMargin: currentMargin ? round(currentMargin) : null,
      currentMarginPercent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// POST: Create cost snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    // Get cost calculation
    const costResponse = await GET(req, { params });
    const costData = await costResponse.json();

    if (!costData.success) {
      return costResponse;
    }

    // Generate snapshot number
    const year = new Date().getFullYear();
    const prefix = `SNP-${year}-`;
    const last = await prisma.costSnapshot.findFirst({
      where: { snapshotNumber: { startsWith: prefix } },
      orderBy: { snapshotNumber: "desc" },
      select: { snapshotNumber: true },
    });
    let seq = 1;
    if (last?.snapshotNumber) {
      const parts = last.snapshotNumber.split("-");
      seq = parseInt(parts[parts.length - 1]) + 1;
    }
    const snapshotNumber = `${prefix}${seq.toString().padStart(4, "0")}`;

    const snapshot = await prisma.costSnapshot.create({
      data: {
        snapshotNumber,
        modelId: id,
        materialsCost: costData.breakdown.materialsCost,
        laborCost: costData.breakdown.laborCost,
        atelierCost: costData.breakdown.atelierCost,
        marketingCost: costData.breakdown.marketingCost,
        otherCost:
          costData.breakdown.otherCost + costData.breakdown.transportCost,
        totalCost: costData.breakdown.totalCost,
        sellingPrice: costData.currentPrice,
        margin: costData.currentMargin,
        marginPercent: costData.currentMarginPercent,
      },
    });

    return NextResponse.json({ success: true, snapshot }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
