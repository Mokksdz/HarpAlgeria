import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateCode(name: string): string {
  const base = (name || "HARP")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}-${rand}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );

    let referral = await prisma.referralCode.findFirst({
      where: { userId: user.id },
    });

    if (!referral) {
      referral = await prisma.referralCode.create({
        data: {
          userId: user.id,
          code: generateCode(user.name || ""),
        },
      });
    }

    return NextResponse.json(referral);
  } catch (error) {
    console.error("Referral error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code)
      return NextResponse.json({ error: "Code requis" }, { status: 400 });

    const referral = await prisma.referralCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (
      !referral ||
      !referral.isActive ||
      referral.usageCount >= referral.maxUsage
    ) {
      return NextResponse.json({
        valid: false,
        error: "Code invalide ou expiré",
      });
    }

    return NextResponse.json({
      valid: true,
      discountPercent: referral.discountPercent,
      message: `Code valide ! -${referral.discountPercent}% sur votre commande`,
    });
  } catch (error) {
    console.error("Referral validation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
