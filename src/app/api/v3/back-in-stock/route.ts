import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST: Register for back-in-stock alert
export async function POST(request: NextRequest) {
  try {
    const { email, productId, size, color } = await request.json();

    if (!email || !productId) {
      return NextResponse.json(
        { error: "Email et produit requis" },
        { status: 400 },
      );
    }

    const alert = await prisma.backInStockAlert.upsert({
      where: { email_productId: { email, productId } },
      update: {
        variantInfo: JSON.stringify({ size, color }),
        isNotified: false,
      },
      create: {
        email,
        productId,
        variantInfo: JSON.stringify({ size, color }),
      },
    });

    return NextResponse.json({ success: true, id: alert.id });
  } catch (error) {
    console.error("Back in stock alert error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
