import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSiteSettings,
  updateHomepageCollections,
} from "@/lib/site/settings.service";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Non autoris\u00e9" }, { status: 401 });
    }

    const settings = await getSiteSettings();
    const allCollections = await prisma.collection.findMany({
      orderBy: { nameFr: "asc" },
      select: { id: true, nameFr: true, nameAr: true, image: true },
    });

    let selectedIds: string[] = [];
    if (settings.homepageCollectionIds) {
      try {
        selectedIds = JSON.parse(settings.homepageCollectionIds);
      } catch {
        selectedIds = [];
      }
    }

    return NextResponse.json({
      selectedIds,
      collections: allCollections,
    });
  } catch (error) {
    console.error("Error fetching homepage collections:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Non autoris\u00e9" }, { status: 401 });
    }

    const body = await request.json();
    const { collectionIds } = body;

    if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
      return NextResponse.json(
        { error: "S\u00e9lectionnez au moins une collection" },
        { status: 400 },
      );
    }

    if (collectionIds.length > 6) {
      return NextResponse.json(
        { error: "Maximum 6 collections" },
        { status: 400 },
      );
    }

    const { updated } = await updateHomepageCollections(
      collectionIds,
      (session.user as any)?.id,
    );

    revalidatePath("/");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating homepage collections:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise \u00e0 jour" },
      { status: 500 },
    );
  }
}
