"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { Star, ArrowRight, Quote, CheckCircle2 } from "lucide-react";

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export default function Home() {
  const { t, language } = useLanguage();
  const [newCollection, setNewCollection] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Animation hooks for each section
  const collectionSection = useInView();
  const collectionsSection = useInView();
  const reviewsSection = useInView();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products (handle paginated response)
        const productsRes = await fetch(
          "/api/products?pageSize=4&isActive=true",
        );
        const productsData = await productsRes.json();
        const productsList = Array.isArray(productsData)
          ? productsData
          : productsData.items || [];
        setNewCollection(productsList.slice(0, 4));

        // Fetch collections
        const collectionsRes = await fetch("/api/collections");
        const collectionsData = await collectionsRes.json();
        const collectionsList = Array.isArray(collectionsData)
          ? collectionsData
          : collectionsData?.items || [];
        setCollections(collectionsList.slice(0, 3));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const reviews = [
    {
      text: t("home.reviews.1.text"),
      author: "Yasmin B.",
      rating: 5,
    },
    {
      text: t("home.reviews.2.text"),
      author: "Amina",
      rating: 5,
    },
    {
      text: t("home.reviews.3.text"),
      author: "Mima B.",
      rating: 5,
    },
  ];

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
      <section
        ref={collectionSection.ref}
        className="py-24 md:py-32 bg-harp-cream"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div
              className={`transition-all duration-700 ${collectionSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
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

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : newCollection.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {newCollection.map((product, index) => {
                const images = JSON.parse(product.images);
                return (
                  <div
                    key={product.id}
                    className={`transition-all duration-700 ${collectionSection.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <ProductCard
                      id={product.id}
                      name={language === "fr" ? product.nameFr : product.nameAr}
                      price={product.price}
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
              src="https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=1200&q=80"
              alt="La pièce du moment"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-center p-12 lg:p-24 order-2">
            <div className="max-w-md">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-6 block">
                {t("home.featured.badge")}
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-medium text-harp-brown mb-6">
                {t("home.featured.title")}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8 font-light">
                {t("home.featured.desc")}
              </p>
              <Link
                href="/shop"
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

      {/* Collections Showcase - Visual */}
      {collections.length > 0 && (
        <section ref={collectionsSection.ref} className="py-24 bg-harp-cream">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown">
                {t("home.collections.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {collections.map((collection, index) => (
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
      <section ref={reviewsSection.ref} className="py-24 bg-harp-beige/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-3 block">
              {t("home.testimonials.badge")}
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown">
              {t("home.testimonials.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white p-8 shadow-[0_2px_20px_-5px_rgba(61,35,20,0.05)] text-center"
              >
                <div className="flex justify-center gap-1 text-harp-caramel mb-6">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 italic mb-6 font-light leading-relaxed">
                  "{review.text}"
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-harp-brown">
                  {review.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
