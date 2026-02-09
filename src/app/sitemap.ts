import { MetadataRoute } from "next";

// Force dynamic generation - don't try to build at compile time
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/loyalty`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/suivi`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamically fetch products & collections — gracefully fallback if DB unavailable (e.g. during build)
  try {
    const { prisma } = await import("@/lib/prisma");

    const [products, collections] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          nameFr: true,
          images: true,
          updatedAt: true,
        },
      }),
      prisma.collection.findMany({
        select: { id: true, slug: true, updatedAt: true },
      }),
    ]);

    const productUrls: MetadataRoute.Sitemap = products.map((product) => {
      // Parse product images for sitemap image data
      let firstImage: string | undefined;
      try {
        const parsed =
          typeof product.images === "string" ? JSON.parse(product.images) : [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          firstImage = parsed[0];
        }
      } catch {
        // ignore parse errors
      }

      return {
        url: `${baseUrl}/product/${product.slug || product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        ...(firstImage
          ? {
              images: [firstImage],
            }
          : {}),
      };
    });

    const collectionUrls: MetadataRoute.Sitemap = collections.map(
      (collection) => ({
        url: `${baseUrl}/collection/${collection.slug || collection.id}`,
        lastModified: collection.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }),
    );

    return [...staticPages, ...productUrls, ...collectionUrls];
  } catch (error) {
    console.warn(
      "Sitemap: DB unavailable during build, returning static pages only",
      error,
    );
    return staticPages;
  }
}
