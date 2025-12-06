import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rewards = await prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' }
    });
    return NextResponse.json(rewards);
  } catch (error: any) {
    return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
    );
  }
}
