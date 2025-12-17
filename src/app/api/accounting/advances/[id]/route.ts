// =============================================================================
// API Route: /api/accounting/advances/[id]
// CRUD pour une avance individuelle
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdvanceById, refundAdvance } from "@/lib/accounting/services";

// GET - Récupérer une avance par ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const advance = await getAdvanceById(id);

    if (!advance) {
      return NextResponse.json(
        { error: "Avance non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json(advance);
  } catch (error) {
    console.error("Error fetching advance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'avance" },
      { status: 500 },
    );
  }
}

// PUT - Mettre à jour une avance (non utilisée uniquement)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.supplierAdvance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Avance non trouvée" },
        { status: 404 },
      );
    }

    if (Number(existing.amountUsed) > 0) {
      return NextResponse.json(
        { error: "Cette avance a déjà été utilisée et ne peut être modifiée" },
        { status: 400 },
      );
    }

    const advance = await prisma.supplierAdvance.update({
      where: { id },
      data: {
        amount: data.amount !== undefined ? data.amount : existing.amount,
        amountRemaining:
          data.amount !== undefined ? data.amount : existing.amountRemaining,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      },
      include: { supplier: true },
    });

    return NextResponse.json(advance);
  } catch (error) {
    console.error("Error updating advance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}

// PATCH - Actions sur l'avance (refund)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { action, userId } = await req.json();

    switch (action) {
      case "refund":
        const result = await refundAdvance(id, userId);
        return NextResponse.json(result);
      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    console.error("Error patching advance:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inconnue" || "Erreur lors de l'action" },
      { status: 400 },
    );
  }
}

// DELETE - Supprimer une avance (non utilisée uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.supplierAdvance.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Avance non trouvée" },
        { status: 404 },
      );
    }

    if (Number(existing.amountUsed) > 0) {
      return NextResponse.json(
        { error: "Cette avance a déjà été utilisée et ne peut être supprimée" },
        { status: 400 },
      );
    }

    await prisma.supplierAdvance.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting advance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
