import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const advance = await prisma.supplierAdvance.findUnique({
      where: { id },
      include: {
        supplier: true,
        applications: {
          include: {
            purchase: {
              select: { id: true, purchaseNumber: true, totalAmount: true },
            },
          },
        },
      },
    });

    if (!advance) {
      return NextResponse.json(
        { success: false, error: "Avance non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, advance });
  } catch (err) {
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

    const advance = await prisma.supplierAdvance.findUnique({ where: { id } });
    if (!advance) {
      return NextResponse.json(
        { success: false, error: "Avance non trouvée" },
        { status: 404 },
      );
    }

    if (Number(advance.amountUsed) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de supprimer une avance déjà utilisée",
        },
        { status: 422 },
      );
    }

    await prisma.supplierAdvance.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
