"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import {
  ChevronDown,
  X,
  Filter,
  Package,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "price-asc" | "price-desc" | "name";

export default function ShopPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, collectionsRes] = await Promise.all([
          fetch("/api/products?pageSize=100&isActive=true"),
          fetch("/api/collections"),
        ]);
        const productsData = await productsRes.json();
        const collectionsData = await collectionsRes.json();
        // Handle paginated response format { items, meta }
        const productsList = Array.isArray(productsData)
          ? productsData
          : productsData.items || [];
        const collectionsList = Array.isArray(collectionsData)
          ? collectionsData
          : collectionsData.items || collectionsData;
        setProducts(productsList);
        setCollections(collectionsList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products by collection and search
  const filteredProducts = products.filter((p) => {
    const matchesCollection =
      !activeCollection || p.collectionId === activeCollection;
    const name = language === "fr" ? p.nameFr : p.nameAr;
    const matchesSearch =
      !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCollection && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name":
        return (language === "fr" ? a.nameFr : a.nameAr).localeCompare(
          language === "fr" ? b.nameFr : b.nameAr,
        );
      case "newest":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  const activeCollectionName = activeCollection
    ? collections.find((c) => c.id === activeCollection)?.[
        language === "fr" ? "nameFr" : "nameAr"
      ]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-harp-cream/50 to-white pt-24 pb-20">
      {/* Breadcrumb - Minimal */}
      <div className="container mx-auto px-4 mb-8">
        <nav className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Accueil
          </Link>
          <ChevronRight size={10} />
          <span className="text-gray-900 font-medium">
            {activeCollectionName || t("nav.shop")}
          </span>
        </nav>
      </div>

      {/* Hero Section - Text Only */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 mb-6">
              {activeCollectionName || "La Boutique"}
            </h1>
            <p className="text-gray-500 font-light text-lg leading-relaxed max-w-xl">
              {t("shop.hero.subtitle") ||
                "Une sélection de pièces pensées pour l'élégance du quotidien."}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Filters Bar */}
        <div className="sticky top-[80px] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 mb-12 -mx-4 px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left - Collection filters */}
            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={() => setActiveCollection(null)}
                className={cn(
                  "text-sm font-medium transition-all uppercase tracking-wide hover:text-gray-900",
                  !activeCollection ? "text-gray-900" : "text-gray-400",
                )}
              >
                Tous
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setActiveCollection(collection.id)}
                  className={cn(
                    "text-sm font-medium transition-all uppercase tracking-wide hover:text-gray-900",
                    activeCollection === collection.id
                      ? "text-gray-900"
                      : "text-gray-400",
                  )}
                >
                  {language === "fr" ? collection.nameFr : collection.nameAr}
                </button>
              ))}
            </div>

            {/* Right - Search & Sort */}
            <div className="flex items-center gap-6 ml-auto">
              {/* Search */}
              <div className="relative group hidden md:block">
                <Search
                  size={16}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] pl-6 pr-0 py-1 bg-transparent border-b border-transparent focus:border-gray-900 text-sm outline-none transition-all placeholder:text-gray-400 text-gray-900"
                />
              </div>

              {/* Sort */}
              <div className="relative flex items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">
                  Trier
                </span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none cursor-pointer pr-4"
                  >
                    <option value="newest">Nouveautés</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search (visible only on mobile) */}
          <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-full text-sm outline-none focus:bg-gray-100 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results Count & Active Filters */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            {sortedProducts.length}{" "}
            {sortedProducts.length > 1 ? "Produits" : "Produit"}
          </span>

          {(activeCollection || searchQuery) && (
            <button
              onClick={() => {
                setActiveCollection(null);
                setSearchQuery("");
              }}
              className="text-xs text-gray-400 hover:text-gray-900 underline transition-colors"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {sortedProducts.map((product, index) => {
              const images = JSON.parse(product.images);
              const collection = collections.find(
                (c) => c.id === product.collectionId,
              );
              return (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                >
                  <ProductCard
                    id={product.id}
                    name={language === "fr" ? product.nameFr : product.nameAr}
                    price={product.price}
                    image={images[0]}
                    category={
                      collection
                        ? language === "fr"
                          ? collection.nameFr
                          : collection.nameAr
                        : undefined
                    }
                    isNew={
                      new Date(product.createdAt) >
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-32 border-t border-gray-100">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Package size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-serif font-medium text-gray-900 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
              Nous ne trouvons pas ce que vous cherchez. Essayez de modifier vos
              filtres.
            </p>
            <button
              onClick={() => {
                setActiveCollection(null);
                setSearchQuery("");
              }}
              className="text-sm border-b border-gray-900 pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-all uppercase tracking-widest"
            >
              Voir tous les produits
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
