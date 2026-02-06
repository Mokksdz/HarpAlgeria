"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { cn, formatPrice } from "@/lib/utils";
import { getActivePrice } from "@/lib/product-utils";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchProduct {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  price: number;
  promoPrice: number | null;
  promoStart: string | null;
  promoEnd: string | null;
  images: string;
}

interface SearchCollection {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  image: string | null;
}

interface SearchResults {
  products: SearchProduct[];
  collections: SearchCollection[];
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { t, language, dir } = useLanguage();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    products: [],
    collections: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults({ products: [], collections: [] });
      setHasSearched(false);
      setSelectedIndex(-1);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ products: [], collections: [] });
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/v3/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const data = await res.json();
      setResults(data);
      setHasSearched(true);
    } catch {
      setResults({ products: [], collections: [] });
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        performSearch(value.trim());
      }, 300);
    } else {
      setResults({ products: [], collections: [] });
      setHasSearched(false);
      setIsLoading(false);
    }
  };

  // Get all navigable items for keyboard navigation
  const allItems = [
    ...results.products.map((p) => ({
      type: "product" as const,
      href: `/product/${p.slug}`,
    })),
    ...results.collections.map((c) => ({
      type: "collection" as const,
      href: `/shop?collection=${c.slug}`,
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < allItems.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && allItems[selectedIndex]) {
      e.preventDefault();
      router.push(allItems[selectedIndex].href);
      onClose();
    }
  };

  const handleNavigate = () => {
    onClose();
  };

  const getProductImage = (product: SearchProduct): string => {
    try {
      const images = JSON.parse(product.images);
      if (Array.isArray(images) && images.length > 0) return images[0];
    } catch {
      // images might be a direct URL string
      if (product.images && !product.images.startsWith("[")) return product.images;
    }
    return `https://placehold.co/200x260/F5F1EC/4A3A2A?text=${encodeURIComponent(
      language === "ar" ? product.nameAr : product.nameFr,
    )}`;
  };

  const noResults =
    hasSearched &&
    results.products.length === 0 &&
    results.collections.length === 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={t("search.title")}
      dir={dir}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Search Container */}
      <div className="relative w-full max-w-2xl mx-auto mt-0 md:mt-8 animate-in slide-in-from-top-4 fade-in duration-300">
        {/* Search Bar */}
        <div className="bg-white rounded-none md:rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-harp-sand/50">
            <Search size={20} className="text-harp-caramel shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("search.placeholder")}
              className="flex-1 bg-transparent text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none font-serif"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {isLoading && (
              <Loader2 size={18} className="text-harp-caramel animate-spin shrink-0" />
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-harp-sand/50 rounded-full transition-colors text-gray-500 hover:text-gray-900 shrink-0"
              aria-label={t("search.close")}
            >
              <X size={20} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[70vh] overflow-y-auto">
            {/* Loading State */}
            {isLoading && query.length >= 2 && !hasSearched && (
              <div className="px-5 py-8 text-center">
                <Loader2
                  size={24}
                  className="text-harp-caramel animate-spin mx-auto mb-2"
                />
                <p className="text-sm text-gray-500">{t("search.loading")}</p>
              </div>
            )}

            {/* No Results */}
            {noResults && (
              <div className="px-5 py-10 text-center">
                <div className="w-14 h-14 bg-harp-sand/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-harp-caramel" />
                </div>
                <p className="text-gray-900 font-medium mb-1">
                  {t("search.noResults")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("search.noResultsHint")}
                </p>
              </div>
            )}

            {/* Product Results */}
            {results.products.length > 0 && (
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-harp-caramel font-medium mb-3 px-1">
                  {t("search.products")}
                </p>
                <div className="space-y-1">
                  {results.products.map((product, index) => {
                    const { price, originalPrice, isPromo } = getActivePrice({
                      price: Number(product.price),
                      promoPrice: product.promoPrice
                        ? Number(product.promoPrice)
                        : null,
                      promoStart: product.promoStart,
                      promoEnd: product.promoEnd,
                    });
                    const name =
                      language === "ar" ? product.nameAr : product.nameFr;
                    const isSelected = selectedIndex === index;

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={handleNavigate}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 group",
                          isSelected
                            ? "bg-harp-sand/60"
                            : "hover:bg-harp-sand/40",
                        )}
                      >
                        <div className="relative w-14 h-[72px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={getProductImage(product)}
                            alt={name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-harp-brown transition-colors">
                            {name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                isPromo
                                  ? "text-red-600"
                                  : "text-harp-brown",
                              )}
                            >
                              {formatPrice(price)}
                            </span>
                            {isPromo && originalPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight
                          size={16}
                          className={cn(
                            "text-gray-300 group-hover:text-harp-caramel transition-all shrink-0",
                            dir === "rtl" && "rotate-180",
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Collection Results */}
            {results.collections.length > 0 && (
              <div className="p-4 pt-0">
                {results.products.length > 0 && (
                  <div className="border-t border-harp-sand/50 mb-4" />
                )}
                <p className="text-[10px] uppercase tracking-[0.2em] text-harp-caramel font-medium mb-3 px-1">
                  {t("search.collections")}
                </p>
                <div className="space-y-1">
                  {results.collections.map((collection, index) => {
                    const collIndex = results.products.length + index;
                    const isSelected = selectedIndex === collIndex;
                    const name =
                      language === "ar"
                        ? collection.nameAr
                        : collection.nameFr;

                    return (
                      <Link
                        key={collection.id}
                        href={`/shop?collection=${collection.slug}`}
                        onClick={handleNavigate}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 group",
                          isSelected
                            ? "bg-harp-sand/60"
                            : "hover:bg-harp-sand/40",
                        )}
                      >
                        <div className="w-10 h-10 bg-harp-sand/50 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-harp-brown uppercase">
                            {name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-harp-brown transition-colors">
                            {name}
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            {t("search.viewCollection")}
                          </p>
                        </div>
                        <ArrowRight
                          size={16}
                          className={cn(
                            "text-gray-300 group-hover:text-harp-caramel transition-all shrink-0",
                            dir === "rtl" && "rotate-180",
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hint when nothing typed yet */}
            {!hasSearched && !isLoading && query.length < 2 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400">
                  {t("search.hint")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
