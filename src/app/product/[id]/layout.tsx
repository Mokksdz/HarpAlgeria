import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

// Force dynamic rendering - don't try to access DB at build time
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  try {
    // Support both slug and id lookup
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ slug: id }, { id: id }],
      },
      select: {
        id: true,
        slug: true,
        nameFr: true,
        descriptionFr: true,
        images: true,
        price: true,
        promoPrice: true,
        collection: {
          select: { nameFr: true },
        },
      },
    });

    if (!product) {
      return {
        title: "Produit introuvable | Harp",
        description: "Ce produit n'existe pas ou a été supprimé.",
      };
    }

    // Parse images safely
    let allImages: string[] = [];
    try {
      const parsed =
        typeof product.images === "string" ? JSON.parse(product.images) : [];
      if (Array.isArray(parsed)) {
        allImages = parsed;
      }
    } catch {
      allImages = [];
    }

    const firstImage = allImages[0] || "";

    const description = product.descriptionFr
      ? product.descriptionFr.substring(0, 160)
      : `Découvrez ${product.nameFr} de Harp. Mode féminine élégante et modeste, fabriquée en Algérie.`;

    const productUrl = `${baseUrl}/product/${product.slug || product.id}`;

    const categoryLabel = product.collection?.nameFr || "Mode féminine";

    return {
      title: `${product.nameFr} | Harp`,
      description,
      openGraph: {
        title: `${product.nameFr} - ${categoryLabel} | Harp Algérie`,
        description,
        url: productUrl,
        images:
          allImages.length > 0
            ? allImages.map((img) => ({
                url: img,
                width: 600,
                height: 800,
                alt: product.nameFr,
              }))
            : [],
        type: "website",
        locale: "fr_FR",
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.nameFr} | Harp Algérie`,
        description,
        images: firstImage ? [firstImage] : [],
      },
      alternates: {
        canonical: productUrl,
      },
      other: {
        "product:price:amount": product.promoPrice
          ? product.promoPrice.toString()
          : product.price.toString(),
        "product:price:currency": "DZD",
      },
    };
  } catch (error) {
    console.warn("Product layout: failed to generate metadata", error);
    return {
      title: "Harp - Produit",
      description:
        "Découvrez les créations Harp. Mode féminine élégante et modeste, fabriquée en Algérie.",
    };
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
