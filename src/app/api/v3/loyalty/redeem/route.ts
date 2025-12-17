import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redeemReward } from "@/lib/loyalty/services/loyalty.service";
import { z } from "zod";

const redeemSchema = z.object({
  rewardId: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = redeemSchema.parse(body);
    const userId = (session.user as any).id || "1";

    const result = await redeemReward(userId, validated.rewardId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" || "Internal Server Error" },
      { status: 500 },
    );
  }
}
