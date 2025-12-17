"use client";

import { useState, useEffect } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Truck,
  Gift,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useCart } from "./CartProvider";
import { useLanguage } from "./LanguageProvider";
import { cn, formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// Configuration livraison gratuite
const FREE_SHIPPING_THRESHOLD = 15000; // DZD

// Suggestions de produits (à remplacer par API)
interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function CartDrawer() {
  const {
    isOpen,
    setIsOpen,
    items,
    removeItem,
    updateQuantity,
    total,
    addItem: _addItem,
  } = useCart();
  const { t, dir } = useLanguage();
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([]);

  // Calculs livraison gratuite
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);
  const hasFreeShipping = total >= FREE_SHIPPING_THRESHOLD;

  // Charger suggestions
  useEffect(() => {
    if (isOpen && items.length > 0) {
      fetch("/api/products?limit=4")
        .then((res) => res.json())
        .then((data) => {
          // Filtrer les produits déjà dans le panier
          const cartProductIds = items.map((i) => i.productId);
          const filtered = (
            data as {
              id: string;
              nameFr: string;
              price: number;
              images: string;
            }[]
          )
            .filter((p) => !cartProductIds.includes(p.id))
            .slice(0, 3)
            .map((p) => ({
              id: p.id,
              name: p.nameFr,
              price: p.price,
              image: JSON.parse(p.images)[0],
            }));
          setSuggestions(filtered);
        })
        .catch(() => setSuggestions([]));
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          "relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300",
          dir === "rtl" ? "slide-in-from-left" : "",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-harp-beige flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-harp-brown">
              {t("cart.title")}
            </h2>
            <p className="text-xs text-gray-500">
              {items.length} {t("cart.items")}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="px-4 py-3 bg-gradient-to-r from-harp-cream to-harp-beige border-b border-harp-beige">
            {hasFreeShipping ? (
              <div className="flex items-center gap-2 text-harp-brown">
                <Gift size={18} className="text-harp-brown" />
                <span className="text-sm font-medium">
                  {t("cart.freeShipping.congrats")}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Truck size={14} />
                    {t("cart.freeShipping.title")}
                  </span>
                  <span className="font-medium text-harp-brown">
                    {t("cart.freeShipping.remaining")} {formatPrice(remaining)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-harp-brown rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Truck size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">{t("cart.empty")}</p>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="text-harp-brown font-medium hover:underline flex items-center gap-1"
              >
                {t("cart.discoverCollection")} <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-gray-50 rounded-xl p-3"
                >
                  <div className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {item.size} • {item.color}
                      </p>
                      <p className="text-sm font-bold text-harp-brown mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1.5 hover:text-harp-caramel"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm w-6 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1.5 hover:text-harp-caramel"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Cross-sell Section */}
              {suggestions.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" />
                    {t("cart.completeLook")}
                  </h4>
                  <div className="space-y-2">
                    {suggestions.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="relative w-12 h-14 bg-gray-100 rounded-md overflow-hidden shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-harp-brown font-semibold">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-gray-400 group-hover:text-harp-brown transition-colors"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-harp-beige bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("cart.subtotal")}</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("cart.shipping")}</span>
                {hasFreeShipping ? (
                  <span className="text-green-600 font-medium">
                    {t("cart.free")}
                  </span>
                ) : (
                  <span className="text-gray-500">
                    {t("cart.calculatedAtCheckout")}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-900">
                  {t("cart.total")}
                </span>
                <span className="font-serif font-bold text-xl text-harp-brown">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="block w-full bg-harp-brown text-white text-center py-4 rounded-xl font-medium hover:bg-harp-caramel transition-colors"
            >
              {t("cart.checkout")}
            </Link>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Truck size={12} />
                {t("cart.badges.delivery")}
              </span>
              <span>•</span>
              <span>{t("cart.badges.cod")}</span>
              <span>•</span>
              <span>{t("cart.badges.tracking")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
