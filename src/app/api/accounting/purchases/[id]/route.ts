// =============================================================================
// API Route: /api/accounting/purchases/[id]
// CRUD pour un achat individuel
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getPurchaseById,
  orderPurchase,
  cancelPurchase,
} from "@/lib/accounting/services";

// GET - Récupérer un achat par ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const purchase = await getPurchaseById(id);

    if (!purchase) {
      return NextResponse.json({ error: "Achat non trouvé" }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'achat" },
      { status: 500 },
    );
  }
}

// PUT - Mettre à jour un achat (brouillon uniquement)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await req.json();

    // Vérifier que l'achat existe et est en brouillon
    const existing = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Achat non trouvé" }, { status: 404 });
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Seuls les achats en brouillon peuvent être modifiés" },
        { status: 400 },
      );
    }

    // Mettre à jour l'achat
    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        expectedDate: data.expectedDate
          ? new Date(data.expectedDate)
          : undefined,
        taxAmount: data.taxAmount,
        shippingCost: data.shippingCost,
        notes: data.notes,
      },
      include: {
        supplier: true,
        items: {
          include: { inventoryItem: true },
        },
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("Error updating purchase:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}

// PATCH - Actions sur l'achat (order, cancel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { action } = await req.json();

    let result;

    switch (action) {
      case "order":
        result = await orderPurchase(id);
        break;
      case "cancel":
        result = await cancelPurchase(id);
        break;
      default:
        return NextResponse.json(
          { error: `Action inconnue: ${action}` },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error patching purchase:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'action" },
      { status: 400 },
    );
  }
}

// DELETE - Supprimer un achat (brouillon uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Achat non trouvé" }, { status: 404 });
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Seuls les achats en brouillon peuvent être supprimés" },
        { status: 400 },
      );
    }

    await prisma.purchase.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}
