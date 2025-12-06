import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const PurchaseUpdateSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().datetime().optional(),
  expectedDate: z.string().datetime().optional(),
  taxAmount: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { inventoryItem: true } },
        advances: { include: { advance: true } },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { success: false, error: "Achat non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, purchase });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const data = PurchaseUpdateSchema.parse(body);

    const existing = await prisma.purchase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Achat non trouvé" },
        { status: 404 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Seuls les brouillons peuvent être modifiés" },
        { status: 422 }
      );
    }

    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        taxAmount: data.taxAmount,
        shippingCost: data.shippingCost,
        notes: data.notes,
      },
      include: { supplier: true, items: true },
    });

    return NextResponse.json({ success: true, purchase });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: err.issues },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const existing = await prisma.purchase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Achat non trouvé" },
        { status: 404 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, error: "Seuls les brouillons peuvent être supprimés" },
        { status: 422 }
      );
    }

    await prisma.$transaction([
      prisma.purchaseItem.deleteMany({ where: { purchaseId: id } }),
      prisma.purchase.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
