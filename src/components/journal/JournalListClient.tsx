"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookOpen, Calendar, Eye, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface PostSummary {
  id: string;
  slug: string;
  titleFr: string;
  excerptFr: string | null;
  coverImage: string | null;
  category: string;
  authorName: string;
  publishedAt: string | null;
  views: number;
}

interface Props {
  posts: PostSummary[];
  total: number;
  currentPage: number;
  activeCategory: string;
}

export default function JournalListClient({
  posts,
  total,
  currentPage,
  activeCategory,
}: Props) {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const totalPages = Math.ceil(total / 12);

  const CATEGORIES = [
    { key: "ALL", label: t("journal.all") },
    { key: "STYLE", label: t("journal.style") },
    { key: "LOOKBOOK", label: t("journal.lookbook") },
    { key: "TIPS", label: t("journal.tips") },
    { key: "NEWS", label: t("journal.news") },
  ];

  function getCategoryLabel(key: string): string {
    return CATEGORIES.find((c) => c.key === key)?.label || key;
  }

  function formatDate(date: string | null): string {
    if (!date) return "";
    return new Date(date).toLocaleDateString(isAr ? "ar-DZ" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-harp-cream/50 to-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden bg-harp-sand/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-4 block">
              {t("journal.badge")}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-harp-brown mb-6 leading-tight">
              {t("journal.title")}
            </h1>
            <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-light max-w-2xl mx-auto">
              {t("journal.desc")}
            </p>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-harp-sand/20 rounded-full blur-3xl" />
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-harp-caramel/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Category Tabs */}
      <section className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-4 -mb-px scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={
                  cat.key === "ALL"
                    ? "/journal"
                    : `/journal?category=${cat.key}`
                }
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                  activeCategory === cat.key
                    ? "bg-harp-brown text-white shadow-sm"
                    : "text-gray-500 hover:bg-harp-sand/50 hover:text-harp-brown",
                )}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-serif text-gray-400 mb-2">
                {t("journal.noArticles")}
              </h3>
              <p className="text-gray-400 text-sm">
                {t("journal.noArticlesDesc")}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {currentPage === 1 && posts.length > 0 && (
                <div className="mb-16">
                  <Link
                    href={`/journal/${posts[0].slug}`}
                    className="group block"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-harp-sand/30">
                        {posts[0].coverImage ? (
                          <Image
                            src={posts[0].coverImage}
                            alt={posts[0].titleFr}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen
                              size={64}
                              className="text-harp-caramel/30"
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-harp-sand/50 text-harp-brown text-xs font-bold uppercase tracking-wider rounded-full">
                            {getCategoryLabel(posts[0].category)}
                          </span>
                          <span className="text-sm text-gray-400 flex items-center gap-1.5">
                            <Calendar size={14} />
                            {formatDate(posts[0].publishedAt)}
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown group-hover:text-harp-caramel transition-colors leading-tight">
                          {posts[0].titleFr}
                        </h2>
                        {posts[0].excerptFr && (
                          <p className="text-gray-500 leading-relaxed text-lg line-clamp-3">
                            {posts[0].excerptFr}
                          </p>
                        )}
                        <div className="flex items-center gap-4 pt-2">
                          <span className="text-sm text-gray-400">
                            {t("journal.by")} {posts[0].authorName}
                          </span>
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Eye size={14} />
                            {posts[0].views}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-harp-caramel font-medium text-sm group-hover:gap-3 transition-all">
                          {t("journal.readArticle")}
                          <ArrowIcon size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Remaining Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.slice(currentPage === 1 ? 1 : 0).map((post) => (
                  <Link
                    key={post.id}
                    href={`/journal/${post.slug}`}
                    className="group block"
                  >
                    <article className="h-full flex flex-col">
                      <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-harp-sand/30 mb-5">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.titleFr}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen
                              size={40}
                              className="text-harp-caramel/30"
                            />
                          </div>
                        )}
                        <div className={`absolute top-3 ${isAr ? "right-3" : "left-3"}`}>
                          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-harp-brown text-[10px] font-bold uppercase tracking-wider rounded-full">
                            {getCategoryLabel(post.category)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(post.publishedAt)}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Eye size={12} />
                            {post.views}
                          </span>
                        </div>
                        <h3 className="text-xl font-serif font-medium text-harp-brown group-hover:text-harp-caramel transition-colors mb-2 line-clamp-2">
                          {post.titleFr}
                        </h3>
                        {post.excerptFr && (
                          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1">
                            {post.excerptFr}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            {post.authorName}
                          </span>
                          <span className="text-xs text-harp-caramel font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            {t("journal.read")}
                            <ArrowIcon size={12} />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16">
                  {currentPage > 1 && (
                    <Link
                      href={`/journal?${activeCategory !== "ALL" ? `category=${activeCategory}&` : ""}page=${currentPage - 1}`}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-harp-sand/30 transition-colors"
                    >
                      {t("journal.previous")}
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <Link
                        key={pageNum}
                        href={`/journal?${activeCategory !== "ALL" ? `category=${activeCategory}&` : ""}page=${pageNum}`}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                          pageNum === currentPage
                            ? "bg-harp-brown text-white"
                            : "text-gray-500 hover:bg-harp-sand/50",
                        )}
                      >
                        {pageNum}
                      </Link>
                    ),
                  )}
                  {currentPage < totalPages && (
                    <Link
                      href={`/journal?${activeCategory !== "ALL" ? `category=${activeCategory}&` : ""}page=${currentPage + 1}`}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-harp-sand/30 transition-colors"
                    >
                      {t("journal.next")}
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
