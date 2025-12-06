import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIP_LEVELS } from "@/lib/loyalty/services/loyalty.service";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Upsert user: create if not exists
    const user = await prisma.user.upsert({ 
      where: { email: session.user.email },
      create: {
        email: session.user.email,
        name: session.user.name || null
      },
      update: {},
      select: {
        id: true,
        loyaltyPoints: true,
        vipLevel: true,
        pointHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    // Calculate progress to next level
    let nextLevel = null;
    let progress = 0;
    
    const history = await prisma.loyaltyPoint.aggregate({
      where: { userId: user.id, amount: { gt: 0 } },
      _sum: { amount: true }
    });
    const totalLifetimePoints = history._sum.amount || 0;

    if (user.vipLevel === "SILVER") {
      nextLevel = { name: "GOLD", threshold: VIP_LEVELS.GOLD.threshold };
      progress = Math.min(100, (totalLifetimePoints / VIP_LEVELS.GOLD.threshold) * 100);
    } else if (user.vipLevel === "GOLD") {
      nextLevel = { name: "BLACK", threshold: VIP_LEVELS.BLACK.threshold };
      progress = Math.min(100, (totalLifetimePoints / VIP_LEVELS.BLACK.threshold) * 100);
    }

    return NextResponse.json({
      balance: user.loyaltyPoints,
      vipLevel: user.vipLevel,
      benefits: VIP_LEVELS[user.vipLevel as keyof typeof VIP_LEVELS]?.benefits || VIP_LEVELS.SILVER.benefits,
      nextLevel,
      progress,
      history: user.pointHistory
    });
  } catch (error: any) {
    console.error("Loyalty balance error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
