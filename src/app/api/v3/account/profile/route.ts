import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateProfileSchema } from "@/lib/validations/profile";

// GET - Récupérer le profil (crée l'utilisateur s'il n'existe pas)
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Upsert: create user if not exists
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      create: {
        email: session.user.email,
        name: session.user.name || null,
      },
      update: {}, // No updates on GET
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        loyaltyPoints: true,
        vipLevel: true,
        createdAt: true,
      },
    });

    // Award profile completion points if profile is complete but points
    // were never granted (catches users who completed profile before this feature)
    if (user.name && user.phone && user.birthDate) {
      try {
        const { earnPoints, LOYALTY_RULES } = await import("@/lib/loyalty/services/loyalty.service");
        await earnPoints(
          user.id,
          LOYALTY_RULES.PROFILE_COMPLETE_BONUS,
          "PROFILE_COMPLETE",
          `profile-complete-${user.id}`,
        );
        // Re-fetch to include newly awarded points
        const freshUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            birthDate: true,
            loyaltyPoints: true,
            vipLevel: true,
            createdAt: true,
          },
        });
        return NextResponse.json(freshUser || user);
      } catch {
        // Points already awarded (idempotent) — just return user as-is
      }
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH - Mettre à jour le profil (crée l'utilisateur s'il n'existe pas)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const parsed = UpdateProfileSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation échouée" },
        { status: 400 },
      );
    }

    const body = parsed.data;

    // Build update data
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.birthDate !== undefined) {
      data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    }

    // Upsert: create user if not exists, update if exists
    const updated = await prisma.user.upsert({
      where: { email: session.user.email },
      create: {
        email: session.user.email,
        name: session.user.name || body.name || null,
        ...data,
      },
      update: data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        loyaltyPoints: true,
        vipLevel: true,
      },
    });

    // Award profile completion points if profile is now complete
    // and user hasn't already received them (idempotent via referenceId)
    if (updated.name && updated.phone && updated.birthDate) {
      try {
        const { earnPoints, LOYALTY_RULES } = await import("@/lib/loyalty/services/loyalty.service");
        await earnPoints(
          updated.id,
          LOYALTY_RULES.PROFILE_COMPLETE_BONUS,
          "PROFILE_COMPLETE",
          `profile-complete-${updated.id}`,
        );
      } catch (e) {
        // Points already awarded (idempotent) or error — don't fail the request
        console.log("Profile completion points:", e);
      }
    }

    // Re-fetch user to include any points just awarded
    const freshUser = await prisma.user.findUnique({
      where: { id: updated.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        loyaltyPoints: true,
        vipLevel: true,
      },
    });

    return NextResponse.json({ success: true, user: freshUser || updated });
  } catch (error: unknown) {
    console.error("Profile PATCH error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
