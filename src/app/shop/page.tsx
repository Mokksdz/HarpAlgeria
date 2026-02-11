"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeleton";
import { useLanguage } from "@/components/LanguageProvider";
import {
  ChevronDown,
  Package,
  ChevronRight,
  Search,
  Filter,
  X,
} from "lucide-react";
import { cn, safeParseImages } from "@/lib/utils";
import { trackEvent } from "@/components/Analytics";
import { getActivePrice } from "@/lib/product-utils";

type SortOption = "newest" | "price-asc" | "price-desc" | "name";

export default function ShopPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);

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

        // Track view_item_list for GA4 & FB
        if (productsList.length > 0) {
          trackEvent.ga.viewItemList(
            "Shop - All Products",
            productsList
              .slice(0, 20)
              .map((p: { id: string; nameFr: string; price: number }) => ({
                item_id: p.id,
                item_name: p.nameFr,
                price: Number(p.price),
              })),
          );
          trackEvent.fb.viewCategory(
            "Shop",
            productsList.slice(0, 20).map((p: { id: string }) => p.id),
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extract unique sizes and colors from all products
  const allSizes = [
    ...new Set(
      products.flatMap((p) => {
        try {
          return typeof p.sizes === "string"
            ? JSON.parse(p.sizes)
            : p.sizes || [];
        } catch {
          return [];
        }
      }),
    ),
  ].sort() as string[];

  const allColors = [
    ...new Set(
      products.flatMap((p) => {
        try {
          return typeof p.colors === "string"
            ? JSON.parse(p.colors)
            : p.colors || [];
        } catch {
          return [];
        }
      }),
    ),
  ].sort() as string[];

  // Filter products by collection, search, size, color, and price
  const filteredProducts = products.filter((p) => {
    const matchesCollection =
      !activeCollection || p.collectionId === activeCollection;
    const name = language === "fr" ? p.nameFr : p.nameAr;
    const matchesSearch =
      !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase());

    // Size filter
    let matchesSize = selectedSizes.length === 0;
    if (!matchesSize) {
      try {
        const productSizes =
          typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes || [];
        matchesSize = selectedSizes.some((s) => productSizes.includes(s));
      } catch {
        matchesSize = true;
      }
    }

    // Color filter
    let matchesColor = selectedColors.length === 0;
    if (!matchesColor) {
      try {
        const productColors =
          typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors || [];
        matchesColor = selectedColors.some((c) => productColors.includes(c));
      } catch {
        matchesColor = true;
      }
    }

    // Price filter
    const price = Number(p.promoPrice || p.price);
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

    return (
      matchesCollection &&
      matchesSearch &&
      matchesSize &&
      matchesColor &&
      matchesPrice
    );
  });

  // Build collection order map (collections already sorted by nameFr asc from API)
  const collectionOrder = new Map<string, number>();
  collections.forEach((c, i) => collectionOrder.set(c.id, i));

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
      default: {
        // Sort by collection order first (Abaya Kimono first), then by date within
        const colA = collectionOrder.get(a.collectionId) ?? 999;
        const colB = collectionOrder.get(b.collectionId) ?? 999;
        if (colA !== colB) return colA - colB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
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
                  className="w-[200px] pl-6 pr-6 py-1 bg-transparent border-b border-transparent focus:border-gray-900 text-sm outline-none transition-all placeholder:text-gray-400 text-gray-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-900 transition-colors"
                    aria-label="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-all uppercase tracking-wide",
                  showFilters
                    ? "text-harp-brown"
                    : "text-gray-400 hover:text-gray-900",
                )}
              >
                <Filter size={14} />
                <span className="hidden sm:inline">Filtres</span>
                {(selectedSizes.length > 0 ||
                  selectedColors.length > 0 ||
                  priceRange[1] < 50000) && (
                  <span className="w-5 h-5 rounded-full bg-harp-brown text-white text-[10px] flex items-center justify-center">
                    {selectedSizes.length +
                      selectedColors.length +
                      (priceRange[1] < 50000 ? 1 : 0)}
                  </span>
                )}
              </button>

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
                className="w-full pl-10 pr-10 py-2 bg-gray-50 rounded-full text-sm outline-none focus:bg-gray-100 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-900 transition-colors"
                  aria-label="Effacer la recherche"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out mb-8",
            showFilters ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Size Filter */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
                  Taille
                </h4>
                <div className="flex flex-wrap gap-2">
                  {allSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setSelectedSizes((prev) =>
                          prev.includes(size)
                            ? prev.filter((s) => s !== size)
                            : [...prev, size],
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                        selectedSizes.includes(size)
                          ? "border-harp-brown bg-harp-brown/10 text-harp-brown"
                          : "border-gray-200 text-gray-500 hover:border-gray-300",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                  {allSizes.length === 0 && (
                    <span className="text-xs text-gray-400">
                      Aucune taille disponible
                    </span>
                  )}
                </div>
              </div>

              {/* Color Filter */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
                  Couleur
                </h4>
                <div className="flex flex-wrap gap-2">
                  {allColors.map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setSelectedColors((prev) =>
                          prev.includes(color)
                            ? prev.filter((c) => c !== color)
                            : [...prev, color],
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                        selectedColors.includes(color)
                          ? "border-harp-brown bg-harp-brown/10 text-harp-brown"
                          : "border-gray-200 text-gray-500 hover:border-gray-300",
                      )}
                    >
                      {color}
                    </button>
                  ))}
                  {allColors.length === 0 && (
                    <span className="text-xs text-gray-400">
                      Aucune couleur disponible
                    </span>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">
                  Prix
                </h4>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={50000}
                    step={500}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full accent-harp-brown"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{priceRange[0].toLocaleString()} DZD</span>
                    <span>{priceRange[1].toLocaleString()} DZD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active filter count and clear */}
            {(selectedSizes.length > 0 ||
              selectedColors.length > 0 ||
              priceRange[1] < 50000) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {selectedSizes.length +
                    selectedColors.length +
                    (priceRange[1] < 50000 ? 1 : 0)}{" "}
                  filtre(s) actif(s)
                </span>
                <button
                  onClick={() => {
                    setSelectedSizes([]);
                    setSelectedColors([]);
                    setPriceRange([0, 50000]);
                  }}
                  className="text-xs text-harp-brown hover:underline"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count & Active Filters */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            {sortedProducts.length}{" "}
            {sortedProducts.length > 1 ? "Produits" : "Produit"}
          </span>

          {(activeCollection ||
            searchQuery ||
            selectedSizes.length > 0 ||
            selectedColors.length > 0 ||
            priceRange[1] < 50000) && (
            <button
              onClick={() => {
                setActiveCollection(null);
                setSearchQuery("");
                setSelectedSizes([]);
                setSelectedColors([]);
                setPriceRange([0, 50000]);
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
              const images = safeParseImages(product.images);
              const collection = collections.find(
                (c) => c.id === product.collectionId,
              );
              return (
                <div
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                >
                  {(() => {
                    const { price: activePrice, originalPrice } =
                      getActivePrice(product);
                    return (
                      <ProductCard
                        id={product.id}
                        name={
                          language === "fr" ? product.nameFr : product.nameAr
                        }
                        price={activePrice}
                        originalPrice={originalPrice ?? undefined}
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
                        stock={product.stock}
                      />
                    );
                  })()}
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
                setSelectedSizes([]);
                setSelectedColors([]);
                setPriceRange([0, 50000]);
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
