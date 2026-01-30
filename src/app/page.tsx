import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/home/HomeClient";

// Force dynamic rendering - don't try to access DB at build time
export const dynamic = "force-dynamic";

// Skeleton for the entire homepage while data loads
function HomeSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[80vh] bg-gray-100" />
      {/* Products section skeleton */}
      <div className="container mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Collections section skeleton */}
      <div className="container mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Async data-fetching component
async function HomeContent() {
  // Fetch products & collections in parallel
  const [products, collections] = await Promise.all([
    prisma.product.findMany({
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
    }),
    prisma.collection.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nameFr: true,
        nameAr: true,
        image: true,
      },
    }),
  ]);

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

// Server Component with Suspense boundary
export default function Home() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
