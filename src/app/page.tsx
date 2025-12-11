import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/home/HomeClient";

// Server Component - Data fetching at build/request time for better SEO and performance
export default async function Home() {
  // Fetch products server-side
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 4,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nameFr: true,
      nameAr: true,
      price: true,
      images: true,
    },
  });

  // Fetch collections server-side
  const collections = await prisma.collection.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nameFr: true,
      nameAr: true,
      image: true,
    },
  });

  // Convert Decimal to number for serialization
  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return (
    <HomeClient
      initialProducts={serializedProducts}
      initialCollections={collections}
    />
  );
}
