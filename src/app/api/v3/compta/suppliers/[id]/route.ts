import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const SupplierUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: { take: 10, orderBy: { createdAt: "desc" } },
        advances: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Fournisseur non trouvé" },
        { status: 404 }
      );
    }

    // Calculer le solde
    const totalAdvances = supplier.advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const usedAdvances = supplier.advances.reduce((sum, a) => sum + Number(a.amountUsed), 0);
    const totalDue = supplier.purchases.reduce((sum, p) => sum + Number(p.amountDue), 0);
    const balance = totalAdvances - usedAdvances - totalDue;

    return NextResponse.json({
      success: true,
      supplier,
      stats: { totalAdvances, usedAdvances, totalDue, balance },
    });
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
    const data = SupplierUpdateSchema.parse(body);

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, supplier });
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

    // Soft delete
    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
