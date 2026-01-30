import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Generate URL-friendly slug from name
function _generateSlug(name: string): string {
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
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seed endpoint is disabled in production" },
      { status: 403 },
    );
  }

  // Require admin authentication
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "admin") {
    return NextResponse.json(
      { error: "Admin authentication required" },
      { status: 401 },
    );
  }

  try {
    // Clear existing products to ensure clean state for the new catalog
    await prisma.orderItem.deleteMany({}); // Delete order items first due to foreign key constraints
    await prisma.product.deleteMany({});

    const products = [
      {
        slug: "abaya-soie-medine-noire",
        nameFr: "Abaya Soie de Médine Noire",
        nameAr: "عباية حرير المدينة سوداء",
        descriptionFr:
          "Abaya fluide en soie de Médine, coupe papillon pour une élégance modeste. Tissu opaque et léger, idéal pour toutes les saisons.",
        descriptionAr:
          "عباية انسيابية من حرير المدينة، قصة فراشة لأناقة محتشمة. قماش غير شفاف وخفيف، مثالي لجميع الفصول.",
        price: 5500,
        images: JSON.stringify([
          "https://placehold.co/600x800/1a1a1a/ffffff?text=Abaya+Noire+Face",
          "https://placehold.co/600x800/1a1a1a/ffffff?text=Abaya+Noire+Dos",
        ]),
        sizes: JSON.stringify([
          "Taille 1 (1m55-1m62)",
          "Taille 2 (1m63-1m70)",
          "Taille 3 (1m70+)",
        ]),
        colors: JSON.stringify(["Noir"]),
        collectionId: null,
      },
      {
        slug: "ensemble-kimono-lin-beige",
        nameFr: "Ensemble Kimono Lin Beige",
        nameAr: "طقم كيمونو كتان بيج",
        descriptionFr:
          "Ensemble 3 pièces : Kimono, sous-abaya et ceinture. Confectionné en lin premium respirant.",
        descriptionAr:
          "طقم 3 قطع: كيمونو، عباية داخلية وحزام. مصنوع من الكتان الفاخر جيد التهوية.",
        price: 8900,
        images: JSON.stringify([
          "https://placehold.co/600x800/e6dcc8/5c4b35?text=Kimono+Beige",
          "https://placehold.co/600x800/e6dcc8/5c4b35?text=Detail+Lin",
        ]),
        sizes: JSON.stringify(["Standard"]),
        colors: JSON.stringify(["Beige", "Blanc Cassé", "Taupe"]),
        collectionId: null,
      },
      {
        slug: "robe-satinee-emeraude",
        nameFr: "Robe Satinée Émeraude",
        nameAr: "فستان ساتان زمردي",
        descriptionFr:
          "Robe longue satinée pour occasions spéciales. Manches ballons et ceinture assortie.",
        descriptionAr:
          "فستان طويل من الساتان للمناسبات الخاصة. أكمام منفوخة وحزام متناسق.",
        price: 7500,
        images: JSON.stringify([
          "https://placehold.co/600x800/0f5c38/ffffff?text=Robe+Emeraude",
        ]),
        sizes: JSON.stringify(["S", "M", "L", "XL"]),
        colors: JSON.stringify(["Émeraude", "Bordeaux", "Champagne"]),
        collectionId: null,
      },
      {
        slug: "abaya-khimar-set",
        nameFr: "Abaya Khimar Set",
        nameAr: "طقم عباية وخمار",
        descriptionFr:
          "Ensemble pratique composé d'une abaya ample et d'un khimar assorti. Tissu jazz infroissable.",
        descriptionAr:
          "طقم عملي مكون من عباية واسعة وخمار متناسق. قماش جاز لا يتجعد.",
        price: 4500,
        images: JSON.stringify([
          "https://placehold.co/600x800/4a4a4a/ffffff?text=Set+Abaya+Khimar",
        ]),
        sizes: JSON.stringify(["Unique"]),
        colors: JSON.stringify(["Gris Souris", "Bleu Nuit", "Prune"]),
        collectionId: null,
      },
      {
        slug: "robe-coton-boheme",
        nameFr: "Robe Coton Bohème",
        nameAr: "معطف ترنش محتشم",
        descriptionFr:
          "Trench long oversize, parfait pour la mi-saison. Double boutonnage et ceinture.",
        descriptionAr:
          "معطف ترنش طويل واسع، مثالي لفصل الربيع والخريف. أزرار مزدوجة وحزام.",
        price: 12500,
        images: JSON.stringify([
          "https://placehold.co/600x800/c2b280/333333?text=Trench+Coat",
        ]),
        sizes: JSON.stringify(["S/M", "L/XL"]),
        colors: JSON.stringify(["Camel", "Kaki"]),
        collectionId: null,
      },
      {
        slug: "ensemble-tailleur-modest",
        nameFr: "Ensemble Tailleur Modest",
        nameAr: "طقم رسمي محتشم",
        descriptionFr:
          "Veste blazer longue et pantalon large à pinces. Look professionnel et élégant.",
        descriptionAr:
          "جاكيت بليزر طويل وبنطلون واسع بكسرات. مظهر احترافي وأنيق.",
        price: 10500,
        images: JSON.stringify([
          "https://placehold.co/600x800/303030/ffffff?text=Tailleur+Modest",
        ]),
        sizes: JSON.stringify(["38", "40", "42", "44"]),
        colors: JSON.stringify(["Noir", "Bleu Marine", "Marron Glacé"]),
        collectionId: null,
      },
      {
        slug: "jilbab-deux-pieces-classique",
        nameFr: "Jilbab Deux-Pièces Classique",
        nameAr: "عباية تطريز إنجليزي",
        descriptionFr:
          "Abaya d'été en coton avec détails en broderie anglaise sur les manches et le bas.",
        descriptionAr:
          "عباية صيفية قطنية مع تفاصيل تطريز إنجليزي على الأكمام والحافة.",
        price: 6800,
        images: JSON.stringify([
          "https://placehold.co/600x800/ffffff/333333?text=Abaya+Broderie",
        ]),
        sizes: JSON.stringify(["Standard"]),
        colors: JSON.stringify(["Blanc", "Rose Poudré"]),
        collectionId: null,
      },
      {
        slug: "cape-hivernale-laine",
        nameFr: "Cape Hivernale Laine",
        nameAr: "كيب شتوي صوف",
        descriptionFr:
          "Cape chaude en laine mélangée, ouverture fente pour les bras. Chic et couvrant.",
        descriptionAr: "كيب دافئ من مزيج الصوف، فتحة للذراعين. شيك ومحتشم.",
        price: 9200,
        images: JSON.stringify([
          "https://placehold.co/600x800/5c4b35/ffffff?text=Cape+Laine",
        ]),
        sizes: JSON.stringify(["Unique"]),
        colors: JSON.stringify(["Gris Chiné", "Noir", "Beige"]),
        collectionId: null,
      },
    ];

    for (const product of products) {
      await prisma.product.create({
        data: product,
      });
    }

    return NextResponse.json({
      message: "Seeding successful",
      count: products.length,
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Error seeding database" },
      { status: 500 },
    );
  }
}
