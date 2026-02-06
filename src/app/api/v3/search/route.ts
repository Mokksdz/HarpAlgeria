import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], collections: [] });
  }

  try {
    const [products, collections] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { nameFr: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameFr: true,
          nameAr: true,
          price: true,
          promoPrice: true,
          promoStart: true,
          promoEnd: true,
          images: true,
        },
        take: 6,
      }),
      prisma.collection.findMany({
        where: {
          OR: [
            { nameFr: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          slug: true,
          nameFr: true,
          nameAr: true,
          image: true,
        },
        take: 3,
      }),
    ]);

    return NextResponse.json({ products, collections });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ products: [], collections: [] });
  }
}
