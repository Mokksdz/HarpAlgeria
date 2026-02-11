import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import sanitizeHtml from "sanitize-html";
import JournalArticleClient from "@/components/journal/JournalArticleClient";

export const revalidate = 3600; // ISR: revalidate every hour

// =============================================================================
// SEO Metadata
// =============================================================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      titleFr: true,
      excerptFr: true,
      coverImage: true,
      seoTitleFr: true,
      seoDescFr: true,
    },
  });

  if (!post) {
    return {
      title: "Article non trouvé — Harp",
    };
  }

  const title = post.seoTitleFr || post.titleFr;
  const description = post.seoDescFr || post.excerptFr || "";

  return {
    title: `${title} — Harp`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(post.coverImage && {
        images: [{ url: post.coverImage, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.coverImage && { images: [post.coverImage] }),
    },
  };
}

// =============================================================================
// Page Component
// =============================================================================

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.isPublished) {
    notFound();
  }

  // Increment views (fire and forget)
  prisma.blogPost
    .update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => {});

  // Fetch related posts (same category, excluding current)
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      category: post.category,
      id: { not: post.id },
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      titleFr: true,
      excerptFr: true,
      coverImage: true,
      category: true,
      publishedAt: true,
      views: true,
    },
  });

  // Parse tags if available
  let tags: string[] = [];
  if (post.tags) {
    try {
      tags = JSON.parse(post.tags);
    } catch {
      tags = [];
    }
  }

  // Sanitize HTML content on the server
  const contentHtml = sanitizeHtml(post.contentFr || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "iframe",
      "h1",
      "h2",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      iframe: [
        "src",
        "allow",
        "allowfullscreen",
        "frameborder",
        "scrolling",
        "width",
        "height",
      ],
      img: ["src", "alt", "width", "height", "loading"],
      a: ["href", "target", "rel"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "player.vimeo.com",
    ],
  });

  // Serialize data for client component
  const postData = {
    id: post.id,
    slug: post.slug,
    titleFr: post.titleFr,
    excerptFr: post.excerptFr,
    contentHtml,
    coverImage: post.coverImage,
    category: post.category,
    authorName: post.authorName,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    views: post.views,
    tags,
  };

  const serializedRelated = relatedPosts.map((r) => ({
    id: r.id,
    slug: r.slug,
    titleFr: r.titleFr,
    excerptFr: r.excerptFr,
    coverImage: r.coverImage,
    category: r.category,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    views: r.views,
  }));

  return <JournalArticleClient post={postData} relatedPosts={serializedRelated} />;
}
