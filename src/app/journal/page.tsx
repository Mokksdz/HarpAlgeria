import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import JournalListClient from "@/components/journal/JournalListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal — Harp",
  description:
    "Découvrez nos articles sur la mode, le style, les tendances et les coulisses de Harp. Conseils, lookbooks et actualités.",
  openGraph: {
    title: "Journal — Harp",
    description:
      "Découvrez nos articles sur la mode, le style, les tendances et les coulisses de Harp.",
    type: "website",
  },
};

interface JournalPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const resolvedParams = await searchParams;
  const activeCategory = resolvedParams.category || "ALL";
  const currentPage = Math.max(1, parseInt(resolvedParams.page || "1"));
  const limit = 12;

  const where: Record<string, unknown> = {
    isPublished: true,
  };

  if (activeCategory && activeCategory !== "ALL") {
    where.category = activeCategory;
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        titleFr: true,
        excerptFr: true,
        coverImage: true,
        category: true,
        authorName: true,
        publishedAt: true,
        views: true,
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  // Serialize dates for client component
  const serializedPosts = posts.map((p) => ({
    ...p,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  }));

  return (
    <JournalListClient
      posts={serializedPosts}
      total={total}
      currentPage={currentPage}
      activeCategory={activeCategory}
    />
  );
}
