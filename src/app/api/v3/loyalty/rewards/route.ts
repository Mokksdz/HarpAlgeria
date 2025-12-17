import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { cost: "asc" },
    });
    return NextResponse.json(rewards);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" || "Internal Server Error" },
      { status: 500 },
    );
  }
}
