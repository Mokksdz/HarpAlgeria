import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const ApplySchema = z.object({
  purchaseId: z.string().min(1, "Achat requis"),
  amount: z.number().positive("Montant requis"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const data = ApplySchema.parse(body);

    const advance = await prisma.supplierAdvance.findUnique({ where: { id } });
    if (!advance) {
      return NextResponse.json(
        { success: false, error: "Avance non trouvée" },
        { status: 404 },
      );
    }

    if (Number(advance.amountRemaining) < data.amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Solde insuffisant: ${advance.amountRemaining} disponible, ${data.amount} demandé`,
        },
        { status: 422 },
      );
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: data.purchaseId },
    });
    if (!purchase) {
      return NextResponse.json(
        { success: false, error: "Achat non trouvé" },
        { status: 404 },
      );
    }

    if (purchase.supplierId !== advance.supplierId) {
      return NextResponse.json(
        {
          success: false,
          error: "L'avance et l'achat doivent appartenir au même fournisseur",
        },
        { status: 422 },
      );
    }

    if (data.amount > Number(purchase.amountDue)) {
      return NextResponse.json(
        {
          success: false,
          error: `Montant dû insuffisant: ${purchase.amountDue} restant à payer`,
        },
        { status: 422 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create application record
      const application = await tx.purchaseAdvance.create({
        data: {
          purchaseId: data.purchaseId,
          advanceId: id,
          amount: data.amount,
        },
      });

      // Update advance
      const newUsed = Number(advance.amountUsed) + data.amount;
      const newRemaining = Number(advance.amount) - newUsed;
      const newStatus = newRemaining <= 0 ? "APPLIED" : "PARTIAL";

      await tx.supplierAdvance.update({
        where: { id },
        data: {
          amountUsed: newUsed,
          amountRemaining: newRemaining,
          status: newStatus,
        },
      });

      // Update purchase
      const newAmountDue = Number(purchase.amountDue) - data.amount;
      await tx.purchase.update({
        where: { id: data.purchaseId },
        data: {
          amountDue: newAmountDue,
          advanceApplied: Number(purchase.advanceApplied) + data.amount,
        },
      });

      return application;
    });

    const updatedAdvance = await prisma.supplierAdvance.findUnique({
      where: { id },
      include: { supplier: true },
    });

    return NextResponse.json({
      success: true,
      application: result,
      advance: updatedAdvance,
      message: `${data.amount} DZD appliqués à l'achat`,
    });
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
