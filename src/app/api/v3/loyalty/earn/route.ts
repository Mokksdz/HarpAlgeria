import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  earnPoints,
  LoyaltyAction,
} from "@/lib/loyalty/services/loyalty.service";
import { z } from "zod";

const earnSchema = z.object({
  amount: z.number().positive(),
  reason: z.enum([
    "PURCHASE",
    "SIGNUP",
    "BIRTHDAY",
    "REFERRAL",
    "REVIEW",
    "ABANDONED_CART_RECOVERY",
    "NEWSLETTER",
    "WHATSAPP_SHARE",
    "WISHLIST_ADD",
    "WISHLIST_PURCHASE",
  ]),
  referenceId: z.string().optional(),
  userId: z.string().optional(), // Admin can specify user, otherwise current user
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = earnSchema.parse(body);

    const currentUserId = (session.user as any).id || "1";
    const targetUserId = validated.userId || currentUserId;

    // Basic security: only ADMIN can award points arbitrarily to others.
    // Users can trigger specific actions if allowed (like share), but usually this is backend controlled.
    // For now, let's allow if it's self-triggerable actions or if admin.

    const isAdmin =
      (session.user as any).role === "ADMIN" ||
      (session.user as any).role === "admin";

    if (targetUserId !== currentUserId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await earnPoints(
      targetUserId,
      validated.amount,
      validated.reason as LoyaltyAction,
      validated.referenceId,
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 },
    );
  }
}
