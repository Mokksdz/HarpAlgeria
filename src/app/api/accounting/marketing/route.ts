import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Marketing categories (charges with marketing type)
const MARKETING_CATEGORIES = ["ADS", "SHOOTING", "INFLUENCER"];

// GET all marketing expenses (now using Charge model)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const modelId = searchParams.get("modelId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {
      category: { in: category ? [category] : MARKETING_CATEGORIES },
    };
    if (modelId) where.modelId = modelId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate)
        (where.date as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate);
    }

    const expenses = await prisma.charge.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        model: { select: { id: true, sku: true, name: true } },
      },
    });

    // Calculate totals by category
    const totals: Record<string, number> = {
      ADS: 0,
      SHOOTING: 0,
      INFLUENCER: 0,
      OTHER: 0,
      total: 0,
    };

    expenses.forEach((exp) => {
      if (totals[exp.category] !== undefined) {
        totals[exp.category] += Number(exp.amount);
      } else {
        totals.OTHER += Number(exp.amount);
      }
      totals.total += Number(exp.amount);
    });

    return NextResponse.json({ expenses, totals });
  } catch (error) {
    console.error("Error fetching marketing expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing expenses" },
      { status: 500 },
    );
  }
}

// POST create marketing expense (creates a Charge with marketing category)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.category || data.amount === undefined) {
      return NextResponse.json(
        { error: "Category and amount are required" },
        { status: 400 },
      );
    }

    // Generate charge number
    const year = new Date().getFullYear();
    const prefix = `MKT-${year}-`;
    const last = await prisma.charge.findFirst({
      where: { chargeNumber: { startsWith: prefix } },
      orderBy: { chargeNumber: "desc" },
      select: { chargeNumber: true },
    });
    let seq = 1;
    if (last?.chargeNumber) {
      const lastSeq = parseInt(last.chargeNumber.split("-").pop() || "0");
      seq = lastSeq + 1;
    }
    const chargeNumber = `${prefix}${seq.toString().padStart(4, "0")}`;

    const expense = await prisma.charge.create({
      data: {
        chargeNumber,
        category: data.category, // ADS | SHOOTING | INFLUENCER
        description:
          data.campaign || data.description || `Marketing ${data.category}`,
        amount: data.amount,
        currency: data.currency || "DZD",
        date: data.date ? new Date(data.date) : new Date(),
        scope: data.modelId ? "MODEL" : "GLOBAL",
        modelId: data.modelId || null,
        platform: data.platform,
        campaign: data.campaign,
        notes: data.note || data.notes,
      },
      include: {
        model: { select: { id: true, sku: true, name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating marketing expense:", error);
    return NextResponse.json(
      { error: "Failed to create marketing expense" },
      { status: 500 },
    );
  }
}
