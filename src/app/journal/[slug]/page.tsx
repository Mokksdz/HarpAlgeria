import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import sanitizeHtml from "sanitize-html";
import {
  BookOpen,
  Calendar,
  Eye,
  User,
  ArrowLeft,
  ChevronRight,
  Share2,
  Facebook,
  Twitter,
} from "lucide-react";

export const revalidate = 3600; // ISR: revalidate every hour

// =============================================================================
// Category helpers
// =============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  STYLE: "Style",
  LOOKBOOK: "Lookbook",
  TIPS: "Conseils",
  NEWS: "Actualités",
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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

  const shareUrl = `https://harp-web.com/journal/${post.slug}`;
  const shareText = encodeURIComponent(post.titleFr);

  return (
    <div className="min-h-screen bg-gradient-to-b from-harp-cream/30 to-white">
      {/* Breadcrumb */}
      <div className="bg-harp-sand/20 border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-harp-brown transition-colors">
              Accueil
            </Link>
            <ChevronRight size={14} />
            <Link
              href="/journal"
              className="hover:text-harp-brown transition-colors"
            >
              Journal
            </Link>
            <ChevronRight size={14} />
            <span className="text-harp-brown font-medium truncate max-w-[200px]">
              {post.titleFr}
            </span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <article>
        <header className="pt-12 pb-8 md:pt-16 md:pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              {/* Category Badge */}
              <div className="mb-6">
                <Link
                  href={`/journal?category=${post.category}`}
                  className="inline-block px-4 py-1.5 bg-harp-sand/50 text-harp-brown text-xs font-bold uppercase tracking-wider rounded-full hover:bg-harp-sand transition-colors"
                >
                  {CATEGORY_LABELS[post.category] || post.category}
                </Link>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-medium text-harp-brown mb-6 leading-tight">
                {post.titleFr}
              </h1>

              {/* Excerpt */}
              {post.excerptFr && (
                <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-light max-w-3xl mx-auto mb-8">
                  {post.excerptFr}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <User size={15} />
                  {post.authorName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye size={15} />
                  {post.views} lectures
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="container mx-auto px-4 mb-12">
            <div className="max-w-5xl mx-auto">
              <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-harp-sand/30">
                <Image
                  src={post.coverImage}
                  alt={post.titleFr}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              </div>
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-3xl mx-auto">
            {/* Content - rendered as HTML */}
            <div
              className={cn(
                "prose prose-lg max-w-none",
                "prose-headings:font-serif prose-headings:text-harp-brown prose-headings:font-medium",
                "prose-p:text-gray-600 prose-p:leading-relaxed",
                "prose-a:text-harp-caramel prose-a:no-underline hover:prose-a:underline",
                "prose-img:rounded-xl",
                "prose-blockquote:border-harp-caramel prose-blockquote:text-gray-500 prose-blockquote:font-serif prose-blockquote:italic",
                "prose-strong:text-harp-brown",
              )}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contentFr || "", {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "iframe", "h1", "h2"]),
                allowedAttributes: {
                  ...sanitizeHtml.defaults.allowedAttributes,
                  iframe: ["src", "allow", "allowfullscreen", "frameborder", "scrolling", "width", "height"],
                  img: ["src", "alt", "width", "height", "loading"],
                  a: ["href", "target", "rel"],
                },
                allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
              }) }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-sm text-gray-400 mr-2">Tags :</span>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-harp-sand/40 text-harp-brown text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Share2 size={16} />
                  Partager :
                </span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-harp-sand/40 flex items-center justify-center text-harp-brown hover:bg-harp-brown hover:text-white transition-all"
                  aria-label="Partager sur Facebook"
                >
                  <Facebook size={18} />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-harp-sand/40 flex items-center justify-center text-harp-brown hover:bg-harp-brown hover:text-white transition-all"
                  aria-label="Partager sur Twitter"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-harp-sand/40 flex items-center justify-center text-harp-brown hover:bg-harp-brown hover:text-white transition-all"
                  aria-label="Partager sur WhatsApp"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] fill-current"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Back to Journal */}
            <div className="mt-10">
              <Link
                href="/journal"
                className="inline-flex items-center gap-2 text-harp-caramel hover:text-harp-brown transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Retour au journal
              </Link>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-harp-sand/10 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-serif font-medium text-harp-brown mb-10 text-center">
                Articles similaires
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/journal/${related.slug}`}
                    className="group block"
                  >
                    <article>
                      <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-harp-sand/30 mb-4">
                        {related.coverImage ? (
                          <Image
                            src={related.coverImage}
                            alt={related.titleFr}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen
                              size={32}
                              className="text-harp-caramel/30"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-harp-caramel">
                          {CATEGORY_LABELS[related.category] ||
                            related.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(related.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-medium text-harp-brown group-hover:text-harp-caramel transition-colors line-clamp-2">
                        {related.titleFr}
                      </h3>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
