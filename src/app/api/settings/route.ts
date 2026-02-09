import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET site settings
export async function GET() {
  try {
    let settings = await prisma.siteSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.siteSetting.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json(settings);
  } catch {
    // Fallback to static defaults if DB fails
    return NextResponse.json({
      id: "default",
      freeShippingPromoEnabled: false,
      promoCountdownEnabled: true,
    });
  }
}

// PATCH site settings
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields: Record<string, boolean> = {
      freeShippingPromoEnabled: true,
      promoCountdownEnabled: true,
    };

    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields[key]) {
        data[key] = value;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Ensure settings exist
    const existing = await prisma.siteSetting.findUnique({
      where: { id: "default" },
    });

    if (!existing) {
      await prisma.siteSetting.create({
        data: { id: "default" },
      });
    }

    const updated = await prisma.siteSetting.update({
      where: { id: "default" },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
