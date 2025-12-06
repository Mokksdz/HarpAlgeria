// =============================================================================
// API Route: /api/accounting/charges/[id]
// CRUD pour une charge individuelle
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer une charge par ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const charge = await prisma.charge.findUnique({
      where: { id },
      include: {
        model: { select: { id: true, name: true, sku: true } },
        collection: { select: { id: true, nameFr: true } },
      },
    });
    
    if (!charge) {
      return NextResponse.json(
        { error: "Charge non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(charge);
  } catch (error) {
    console.error("Error fetching charge:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la charge" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une charge
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.charge.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Charge non trouvée" },
        { status: 404 }
      );
    }

    // Déterminer le scope
    let scope = "GLOBAL";
    if (data.modelId) scope = "MODEL";
    else if (data.collectionId) scope = "COLLECTION";

    const charge = await prisma.charge.update({
      where: { id },
      data: {
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
        currency: data.currency,
        date: data.date ? new Date(data.date) : undefined,
        scope,
        modelId: data.modelId || null,
        collectionId: data.collectionId || null,
        vendor: data.vendor,
        invoiceRef: data.invoiceRef,
        campaign: data.campaign,
        platform: data.platform,
        notes: data.notes,
      },
      include: {
        model: { select: { id: true, name: true } },
        collection: { select: { id: true, nameFr: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Charge",
        entityId: id,
        before: JSON.stringify(existing),
        after: JSON.stringify(charge),
      },
    });

    return NextResponse.json(charge);
  } catch (error) {
    console.error("Error updating charge:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une charge
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.charge.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Charge non trouvée" },
        { status: 404 }
      );
    }

    await prisma.charge.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Charge",
        entityId: id,
        before: JSON.stringify(existing),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting charge:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
