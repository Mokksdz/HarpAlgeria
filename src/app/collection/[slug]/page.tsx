import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Package } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { CollectionJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { getActivePrice } from "@/lib/product-utils";

export const dynamic = "force-dynamic";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
function isRecentProduct(createdAt: Date | string): boolean {
  return new Date(createdAt) > new Date(Date.now() - SEVEN_DAYS_MS);
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await prisma.collection.findUnique({
    where: { slug },
    select: { nameFr: true, description: true, image: true },
  });

  if (!collection) return { title: "Collection introuvable" };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  return {
    title: `${collection.nameFr} | Harp`,
    description:
      collection.description ||
      `Découvrez la collection ${collection.nameFr} de Harp. Mode féminine élégante et modeste, fabriquée en Algérie.`,
    openGraph: {
      title: `${collection.nameFr} - Harp Algérie`,
      description:
        collection.description || `Collection ${collection.nameFr}`,
      images: collection.image ? [{ url: collection.image }] : [],
      url: `${baseUrl}/collection/${slug}`,
    },
    alternates: {
      canonical: `${baseUrl}/collection/${slug}`,
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  const collection = await prisma.collection.findUnique({
    where: { slug },
  });

  if (!collection) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: {
      collectionId: collection.id,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Parse images safely for each product
  const productsWithImages = products.map((product) => {
    let images: string[] = [];
    try {
      images =
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : [];
    } catch {
      images = [];
    }
    return { ...product, parsedImages: images };
  });

  // Prepare data for CollectionJsonLd
  const jsonLdProducts = productsWithImages.map((p) => ({
    name: p.nameFr,
    price: Number(getActivePrice({ price: Number(p.price), promoPrice: p.promoPrice ? Number(p.promoPrice) : undefined, promoStart: p.promoStart, promoEnd: p.promoEnd }).price),
    image: p.parsedImages[0] || "",
    slug: p.slug || p.id,
  }));

  const breadcrumbItems = [
    { name: "Accueil", url: `${baseUrl}/` },
    { name: "Boutique", url: `${baseUrl}/shop` },
    { name: collection.nameFr, url: `${baseUrl}/collection/${slug}` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-harp-cream/50 to-white pt-24 pb-20">
      {/* Structured Data */}
      <CollectionJsonLd
        collection={{
          name: collection.nameFr,
          description: collection.description || undefined,
          slug: collection.slug,
          image: collection.image || undefined,
        }}
        products={jsonLdProducts}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 mb-8">
        <nav className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Accueil
          </Link>
          <ChevronRight size={10} />
          <Link href="/shop" className="hover:text-gray-900 transition-colors">
            Boutique
          </Link>
          <ChevronRight size={10} />
          <span className="text-gray-900 font-medium">
            {collection.nameFr}
          </span>
        </nav>
      </div>

      {/* Collection Hero Banner */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          {collection.image && (
            <div className="relative w-full h-[240px] md:h-[360px] rounded-2xl overflow-hidden mb-8">
              <Image
                src={collection.image}
                alt={collection.nameFr}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <h1 className="text-3xl md:text-5xl font-serif font-medium text-white mb-2">
                  {collection.nameFr}
                </h1>
                {collection.description && (
                  <p className="text-white/80 font-light text-base md:text-lg max-w-xl">
                    {collection.description}
                  </p>
                )}
                <p className="text-white/60 text-sm mt-3 uppercase tracking-widest">
                  {productsWithImages.length}{" "}
                  {productsWithImages.length > 1 ? "produits" : "produit"}
                </p>
              </div>
            </div>
          )}

          {!collection.image && (
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 mb-6">
                {collection.nameFr}
              </h1>
              {collection.description && (
                <p className="text-gray-500 font-light text-lg leading-relaxed max-w-xl mb-3">
                  {collection.description}
                </p>
              )}
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                {productsWithImages.length}{" "}
                {productsWithImages.length > 1 ? "produits" : "produit"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <div className="container mx-auto px-4">
        {productsWithImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {productsWithImages.map((product, index) => {
              const { price: activePrice, originalPrice } = getActivePrice({
                price: Number(product.price),
                promoPrice: product.promoPrice
                  ? Number(product.promoPrice)
                  : undefined,
                promoStart: product.promoStart,
                promoEnd: product.promoEnd,
              });
              const isNew = isRecentProduct(product.createdAt);
              return (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{
                    animationDelay: `${Math.min(index * 50, 400)}ms`,
                  }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.nameFr}
                    price={activePrice}
                    originalPrice={originalPrice ?? undefined}
                    image={product.parsedImages[0] || ""}
                    category={collection.nameFr}
                    isNew={isNew}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 border-t border-gray-100">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Package size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-serif font-medium text-gray-900 mb-2">
              Aucun produit dans cette collection
            </h3>
            <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
              Cette collection ne contient pas encore de produits. Revenez
              bientôt !
            </p>
            <Link
              href="/shop"
              className="text-sm border-b border-gray-900 pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-all uppercase tracking-widest"
            >
              Voir tous les produits
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
