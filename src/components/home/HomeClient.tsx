"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";
import { Star, ArrowRight } from "lucide-react";
import { getActivePrice } from "@/lib/product-utils";
import { LoyaltySection } from "@/components/home/LoyaltySection";
import { InstagramFeed } from "@/components/home/InstagramFeed";

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1): [React.RefCallback<HTMLElement>, boolean] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [threshold, node]);

  return [setNode, isInView];
}

interface Product {
  id: string;
  nameFr: string;
  nameAr: string;
  price: number;
  promoPrice?: number | null;
  promoStart?: string | null;
  promoEnd?: string | null;
  images: string;
}

interface Collection {
  id: string;
  nameFr: string;
  nameAr: string;
  image: string | null;
}

interface FeaturedSettings {
  featuredImageUrl?: string | null;
  featuredBadgeFr?: string | null;
  featuredBadgeAr?: string | null;
  featuredTitleFr?: string | null;
  featuredTitleAr?: string | null;
  featuredDescFr?: string | null;
  featuredDescAr?: string | null;
  featuredCtaUrl?: string | null;
}

interface HomeClientProps {
  initialProducts: Product[];
  initialCollections: Collection[];
  siteSettings?: FeaturedSettings | null;
}

export function HomeClient({
  initialProducts,
  initialCollections,
  siteSettings,
}: HomeClientProps) {
  const { t, language } = useLanguage();

  // Animation hooks for each section
  const [collectionRef, collectionInView] = useInView();
  const [collectionsRef, _collectionsInView] = useInView();
  const [reviewsRef, _reviewsInView] = useInView();

  const reviews = [
    {
      text: t("home.reviews.1.text"),
      author: "Yasmin B.",
      rating: 5,
    },
    {
      text: t("home.reviews.2.text"),
      author: "Leti C.",
      rating: 5,
    },
    {
      text: t("home.reviews.3.text"),
      author: "Soraya B.",
      rating: 5,
    },
    {
      text: t("home.reviews.4.text"),
      author: "Amina",
      rating: 5,
    },
    {
      text: t("home.reviews.5.text"),
      author: "Nissa Z.",
      rating: 5,
    },
    {
      text: t("home.reviews.6.text"),
      author: "As.",
      rating: 5,
    },
    {
      text: t("home.reviews.7.text"),
      author: "Nour",
      rating: 5,
    },
    {
      text: t("home.reviews.8.text"),
      author: "Nivin B.",
      rating: 5,
    },
    {
      text: t("home.reviews.9.text"),
      author: "Boutayna S.",
      rating: 5,
    },
    {
      text: t("home.reviews.10.text"),
      author: "Fifi M.",
      rating: 5,
    },
  ];

  // Featured section content — uses admin settings with translation fallbacks
  const featuredImage =
    siteSettings?.featuredImageUrl ||
    "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=1200&q=80";
  const featuredBadge =
    language === "fr"
      ? siteSettings?.featuredBadgeFr || t("home.featured.badge")
      : siteSettings?.featuredBadgeAr || t("home.featured.badge");
  const featuredTitle =
    language === "fr"
      ? siteSettings?.featuredTitleFr || t("home.featured.title")
      : siteSettings?.featuredTitleAr || t("home.featured.title");
  const featuredDesc =
    language === "fr"
      ? siteSettings?.featuredDescFr || t("home.featured.desc")
      : siteSettings?.featuredDescAr || t("home.featured.desc");
  const featuredCtaUrl = siteSettings?.featuredCtaUrl || "/shop";

  return (
    <div className="flex flex-col bg-harp-cream">
      {/* Hero Section - Editorial Style */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/Image%20Hero.avif"
            alt="Harp Collection - Femme élégante"
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 container mx-auto px-6 h-full flex items-center justify-center text-center">
          <div className="max-w-4xl animate-fade-in-up">
            <span className="text-white text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
              {t("home.newCollection")}
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white mb-8 leading-tight">
              {t("hero.title")}
            </h1>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
              <Link
                href="/shop"
                className="bg-white text-harp-brown px-10 py-4 text-sm uppercase tracking-[0.15em] hover:bg-harp-cream transition-colors min-w-[200px]"
              >
                {t("hero.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Collection Section - Minimalist Grid */}
      <section ref={collectionRef} className="py-24 md:py-32 bg-harp-cream">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div
              className={`transition-all duration-700 ${collectionInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-2 block">
                {t("home.section.new")}
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown">
                {t("home.latestArrivals")}
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-2 text-sm uppercase tracking-widest text-harp-brown border-b border-harp-brown pb-1 hover:text-harp-caramel hover:border-harp-caramel transition-all"
            >
              {t("home.seeAll")} <ArrowRight size={16} />
            </Link>
          </div>

          {initialProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {initialProducts.map((product, index) => {
                const images = JSON.parse(product.images);
                const { price, originalPrice } = getActivePrice(product);
                return (
                  <div
                    key={product.id}
                    className={`transition-all duration-700 ${collectionInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <ProductCard
                      id={product.id}
                      name={language === "fr" ? product.nameFr : product.nameAr}
                      price={price}
                      originalPrice={originalPrice || undefined}
                      image={images[0]}
                      category={t("shop.badge.new")}
                      isNew={true}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">{t("home.noProducts")}</p>
            </div>
          )}

          <div className="mt-12 text-center md:hidden">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border-b border-harp-brown pb-1 text-sm uppercase tracking-widest text-harp-brown"
            >
              {t("home.seeAll")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Focus Product Section - Editorial Layout */}
      <section className="py-0 bg-harp-sand/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          <div className="relative h-[500px] lg:h-auto order-1">
            <Image
              src={featuredImage}
              alt={featuredBadge}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-center p-12 lg:p-24 order-2">
            <div className="max-w-md">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-6 block">
                {featuredBadge}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-harp-brown mb-6">
                {featuredTitle}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8 font-light">
                {featuredDesc}
              </p>
              <Link
                href={featuredCtaUrl}
                className="inline-block bg-harp-brown text-white px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-harp-caramel transition-colors"
              >
                {t("home.discover")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Darker Contrast */}
      <section className="py-24 bg-harp-brown text-harp-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <h3 className="font-serif font-medium text-xl text-white mb-3">
                {t("home.values.quality.title")}
              </h3>
              <p className="text-harp-beige/80 font-light text-sm leading-relaxed">
                {t("home.values.quality.desc")}
              </p>
            </div>
            <div>
              <h3 className="font-serif font-medium text-xl text-white mb-3">
                {t("home.values.delivery.title")}
              </h3>
              <p className="text-harp-beige/80 font-light text-sm leading-relaxed">
                {t("home.values.delivery.desc")}
              </p>
            </div>
            <div>
              <h3 className="font-serif font-medium text-xl text-white mb-3">
                {t("home.values.service.title")}
              </h3>
              <p className="text-harp-beige/80 font-light text-sm leading-relaxed">
                {t("home.values.service.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Loyalty Program Section */}
      <LoyaltySection />

      {/* Collections Showcase - Visual */}
      {initialCollections.length > 0 && (
        <section ref={collectionsRef} className="py-24 bg-harp-cream">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown">
                {t("home.collections.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {initialCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/shop?collection=${collection.id}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-gray-100"
                >
                  <Image
                    src={
                      collection.image ||
                      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&q=80"
                    }
                    alt={
                      language === "fr" ? collection.nameFr : collection.nameAr
                    }
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-2xl font-serif text-white font-medium tracking-widest uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      {language === "fr"
                        ? collection.nameFr
                        : collection.nameAr}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section - Minimal Cards */}
      <section ref={reviewsRef} className="py-24 bg-harp-beige/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-3 block">
              {t("home.testimonials.badge")}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown">
              {t("home.testimonials.title")}
            </h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide max-w-7xl mx-auto px-1">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white p-8 shadow-[0_2px_20px_-5px_rgba(61,35,20,0.05)] text-center min-w-[300px] md:min-w-[340px] snap-center flex-shrink-0"
              >
                <div className="flex justify-center gap-1 text-harp-caramel mb-6">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-6 font-light leading-relaxed">
                  &quot;{review.text}&quot;
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-harp-brown">
                  {review.author}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-4 md:hidden">
            ← {t("home.testimonials.swipe")} →
          </p>
        </div>
      </section>

      {/* Instagram Feed */}
      <InstagramFeed />

      {/* Simple CTA */}
      <section className="py-32 bg-white text-center border-t border-harp-sand/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-serif font-medium text-harp-brown mb-8">
            {t("home.join.title")}
          </h2>
          <Link
            href="/shop"
            className="inline-block border-b border-harp-brown pb-1 text-sm uppercase tracking-widest text-harp-brown hover:text-harp-caramel hover:border-harp-caramel transition-all"
          >
            {t("home.join.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
