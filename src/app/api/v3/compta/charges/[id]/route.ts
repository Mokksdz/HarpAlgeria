import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const ChargeUpdateSchema = z.object({
  category: z
    .enum([
      "ATELIER",
      "SHOOTING",
      "ADS",
      "INFLUENCER",
      "TRANSPORT",
      "LABOR",
      "RENT",
      "UTILITIES",
      "PACKAGING",
      "SAMPLES",
      "OTHER",
    ])
    .optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  platform: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const charge = await prisma.charge.findUnique({
      where: { id },
      include: { model: true },
    });

    if (!charge) {
      return NextResponse.json(
        { success: false, error: "Charge non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, charge });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const data = ChargeUpdateSchema.parse(body);

    const charge = await prisma.charge.update({
      where: { id },
      data,
      include: { model: true },
    });

    return NextResponse.json({ success: true, charge });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: err.issues },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    await prisma.charge.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
