import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateProduct, sanitizeString } from "@/lib/validations";
import { parsePagination, paginatedResponse } from "@/lib/pagination";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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

export async function GET(request: NextRequest) {
  // Rate limit public reads
  const rateLimited = withRateLimit(request, RATE_LIMITS.API, "products:get");
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = parsePagination(searchParams);

    // Optional filters
    const collectionId = searchParams.get("collectionId");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (collectionId) {
      where.collectionId = collectionId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { nameFr: { contains: search } },
        { nameAr: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    // Only include collection data when filtering or explicitly requested
    const includeCollection =
      !!collectionId || searchParams.get("include") === "collection";

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        ...(includeCollection ? { include: { collection: true } } : {}),
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    // Add cache headers for public product listing
    const response = NextResponse.json(
      paginatedResponse(products, page, pageSize, total),
    );
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateProduct(body);
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
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    const product = await prisma.product.create({
      data: {
        slug: finalSlug,
        nameFr: sanitizeString(body.nameFr),
        nameAr: sanitizeString(body.nameAr),
        descriptionFr: sanitizeString(body.descriptionFr),
        descriptionAr: sanitizeString(body.descriptionAr),
        price: parseFloat(body.price),
        promoPrice: body.promoPrice ? parseFloat(body.promoPrice) : null,
        promoStart: body.promoStart ? new Date(body.promoStart) : null,
        promoEnd: body.promoEnd ? new Date(body.promoEnd) : null,
        images: JSON.stringify(body.images),
        sizes: JSON.stringify(body.sizes),
        colors: JSON.stringify(body.colors),
        stock: parseInt(body.stock) || 0,
        isActive: body.isActive !== false,
        showSizeGuide: body.showSizeGuide !== false,
        freeShipping: body.freeShipping === true,
        freeShippingThreshold: parseFloat(body.freeShippingThreshold) || 0,
        collectionId: body.collectionId || null,
      },
    });

    // Create variants if provided
    if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: body.variants.map((v: { size: string; color: string; stock: number }) => ({
          productId: product.id,
          size: v.size,
          color: v.color,
          stock: v.stock || 0,
        })),
      });

      const totalStock = body.variants.reduce((sum: number, v: { stock: number }) => sum + (v.stock || 0), 0);
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: totalStock },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 },
    );
  }
}
