import { MetadataRoute } from "next";
import { PrismaClient } from "@prisma/client";

// Force dynamic generation - don't try to build at compile time
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  // Pages statiques
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/suivi`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  // Récupérer les produits pour le sitemap (utilise slug si disponible, sinon id)
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      updatedAt: true,
    },
  });

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Récupérer les collections pour le sitemap
  const collections = await prisma.collection.findMany({
    select: {
      id: true,
      slug: true,
      updatedAt: true,
    },
  });

  const collectionUrls = collections.map((collection) => ({
    url: `${baseUrl}/collection/${collection.slug || collection.id}`,
    lastModified: collection.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productUrls, ...collectionUrls];
}
