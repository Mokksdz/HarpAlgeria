"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
    id: string;
    name: string;
    price: number | string | any; // Support Prisma Decimal
    image: string;
    category?: string;
    isNew?: boolean;
    originalPrice?: number | string | any;
}

export function ProductCard({ id, name, price, image, category, isNew, originalPrice }: ProductCardProps) {
    const { t } = useLanguage();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Fallback image
    const fallbackImage = `https://placehold.co/600x800/F5F1EC/4A3A2A?text=${encodeURIComponent(name)}`;

    const numericPrice = typeof price === 'object' && 'toNumber' in price ? price.toNumber() : Number(price);
    const numericOriginalPrice = originalPrice ? (typeof originalPrice === 'object' && 'toNumber' in originalPrice ? originalPrice.toNumber() : Number(originalPrice)) : 0;

    const discount = numericOriginalPrice ? Math.round((1 - numericPrice / numericOriginalPrice) * 100) : 0;

    return (
        <div className="group relative card-hover rounded-2xl overflow-hidden bg-white">
            <Link href={`/product/${id}`} className="block h-full">
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                        src={imageError ? fallbackImage : image}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover img-zoom"
                        onError={() => setImageError(true)}
                    />

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Quick View Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                        <span className="glass block text-harp-brown px-6 py-3 text-xs uppercase tracking-widest font-medium text-center rounded-xl hover:bg-harp-brown hover:text-white transition-all duration-300">
                            {t("product.card.view")}
                        </span>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {isNew && (
                            <span className="glass text-harp-brown text-[10px] uppercase tracking-widest px-3 py-1.5 font-semibold rounded-full shadow-sm">
                                ✨ {t("shop.badge.new")}
                            </span>
                        )}
                        {discount > 0 && (
                            <span className="bg-gradient-to-r from-harp-brown to-harp-caramel text-white text-[10px] uppercase tracking-widest px-3 py-1.5 font-semibold rounded-full shadow-sm">
                                -{discount}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div className="p-4 text-center">
                    {category && (
                        <p className="text-[10px] text-harp-caramel uppercase tracking-[0.2em] mb-2 font-medium">{category}</p>
                    )}
                    <h3 className="font-serif text-lg text-harp-brown mb-3 group-hover:text-harp-caramel transition-colors duration-300 line-clamp-1">
                        {name}
                    </h3>
                    <div className="flex items-center justify-center gap-3">
                        <p className="text-base font-semibold text-harp-brown">{formatPrice(price)}</p>
                        {originalPrice && (
                            <p className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</p>
                        )}
                    </div>
                </div>
            </Link>

            {/* Wishlist button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setIsWishlisted(!isWishlisted);
                }}
                className={`absolute top-4 right-4 p-3 rounded-full shadow-lg transition-all duration-300 z-10 ${
                    isWishlisted 
                        ? 'bg-red-50 scale-110' 
                        : 'glass opacity-0 group-hover:opacity-100'
                }`}
                aria-label={isWishlisted ? t("product.card.wishlist.remove") : t("product.card.wishlist.add")}
            >
                <Heart
                    size={18}
                    className={`transition-all duration-300 ${
                        isWishlisted ? "fill-red-500 text-red-500" : "text-harp-brown"
                    }`}
                />
            </button>
        </div>
    );
}
