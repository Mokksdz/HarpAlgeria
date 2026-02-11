import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCollection, sanitizeString } from "@/lib/validations";

// Generate URL-friendly slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove multiple hyphens
    .trim();
}

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      include: { products: true },
      orderBy: { nameFr: "asc" },
    });

    // Add cache headers for public collection listing
    const response = NextResponse.json(collections);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    return response;
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Error fetching collections" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateCollection(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    const slug = body.slug || generateSlug(body.nameFr);

    // Check if slug already exists
    const existingSlug = await prisma.collection.findUnique({
      where: { slug },
    });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const collection = await prisma.collection.create({
      data: {
        slug: finalSlug,
        nameFr: sanitizeString(body.nameFr),
        nameAr: sanitizeString(body.nameAr),
        description: body.description || null,
        image: body.image || null,
        budget:
          body.budget || body.initialBudget
            ? parseFloat(body.budget || body.initialBudget)
            : 0,
        budgetUsed: 0,
      },
    });
    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Error creating collection" },
      { status: 500 },
    );
  }
}
