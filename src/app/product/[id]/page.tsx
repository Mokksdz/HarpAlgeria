"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useLanguage } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import {
  Truck,
  ShieldCheck,
  ChevronRight,
  Minus,
  Plus,
  Heart,
  Share2,
  Check,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  MessageCircle,
  Sparkles,
  ZoomIn,
  X,
  Ruler,
  Star,
  Quote,
} from "lucide-react";
import { getWhatsAppLink } from "@/lib/config";
import { cn } from "@/lib/utils";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/JsonLd";
import { getActivePrice } from "@/lib/product-utils";
import { PromoCountdown } from "@/components/PromoCountdown";
import { BackInStockAlert } from "@/components/BackInStockAlert";
import { trackEvent } from "@/components/Analytics";

const FREE_SHIPPING_THRESHOLD = 15000; // DZD

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, language } = useLanguage();
  const { addItem } = useCart();

  interface ProductVariant {
    id: string;
    size: string;
    color: string;
    stock: number;
  }

  interface ProductData {
    id: string;
    nameFr: string;
    nameAr: string;
    descriptionFr: string;
    descriptionAr: string;
    price: number;
    promoPrice?: number | null;
    promoStart?: string | null;
    promoEnd?: string | null;
    stock: number;
    images: string[];
    sizes: string[];
    colors: string[];
    variants?: ProductVariant[];
    collectionId?: string | null;
    showSizeGuide?: boolean;
  }

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [isZoomed, setIsZoomed] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<
    { id: string; nameFr: string; price: number; images: string[] }[]
  >([]);
  const [promoCountdownEnabled, setPromoCountdownEnabled] = useState(true);
  const [viewerCount] = useState(() => Math.floor(Math.random() * 12) + 5);

  // Fetch promo countdown setting
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setPromoCountdownEnabled(data.promoCountdownEnabled ?? true);
      })
      .catch(() => {});
  }, []);

  // Real customer reviews
  const allReviews = [
    {
      id: 1,
      author: "Yasmin B.",
      location: "Alger",
      rating: 5,
      text: "J'adore vraiment ! Top qualité et finitions impeccables. Merci beaucoup, je suis ravie !",
      date: "Il y a 2 jours",
    },
    {
      id: 2,
      author: "Leti C.",
      location: "Oran",
      rating: 5,
      text: "Merci beaucoup pour la veste, je l'ai bien reçue. Elle est magnifique, vraiment ! À la prochaine inshallah et bonne continuation.",
      date: "Il y a 5 jours",
    },
    {
      id: 3,
      author: "Soraya B.",
      location: "Constantine",
      rating: 5,
      text: "Je vous remercie, il me va super bien. Très beau modèle et très belle qualité. Merci beaucoup !",
      date: "Il y a 1 semaine",
    },
    {
      id: 4,
      author: "Amina",
      location: "Alger",
      rating: 5,
      text: "Ma shaa Allah, que Dieu vous accorde la santé. Je ne trouve pas les mots… merci énormément ! Le cadeau m'a touchée, la qualité est magnifique, la coupe est parfaite et le rendu est encore plus beau en vrai. Je vous souhaite encore plus de réussite et de belles créations. Vous le méritez vraiment.",
      date: "Il y a 1 semaine",
    },
    {
      id: 5,
      author: "Nissa Z.",
      location: "Blida",
      rating: 5,
      text: "Merci beaucoup ma chérie 🥰 J'ai reçu les blazers, c'est bon. Chabiin qualité, finition, tissu lah ybarek. Vraiment top du top ❤️ Lah yaâtik saha !",
      date: "Il y a 2 semaines",
    },
    {
      id: 6,
      author: "As.",
      location: "Tizi Ouzou",
      rating: 5,
      text: "Ohhh wow ! Rabi yehfedlek ♥️ J'ai bien reçu le colis, je suis trop contente, mille merci pour la qualité, le soin et la coupe ! Wallah j'ai adoré.",
      date: "Il y a 2 semaines",
    },
    {
      id: 7,
      author: "Nour",
      location: "Sétif",
      rating: 5,
      text: "Oui je l'ai récupéré ce matin, J'AI ADORÉ 😍😍😍 yâtikoum saha ! Je suis vraiment contente. J'ai montré à ma sœur et elle veut passer une deuxième commande. Je vous enverrai une photo une fois porté.",
      date: "Il y a 3 semaines",
    },
    {
      id: 8,
      author: "Nivin B.",
      location: "Annaba",
      rating: 5,
      text: "La pièce est magnifique, je suis trop contente. Le tissu, la finition, la coupe… tout est parfait. Rabi yberek ! Merci infiniment pour votre adorable retour.",
      date: "Il y a 3 semaines",
    },
    {
      id: 9,
      author: "Boutayna S.",
      location: "Oran",
      rating: 5,
      text: "Merci beaucoup madame, vous avez fait un excellent travail, que ce soit du côté couture ou commercial. Bravo, bon courage et plein de succès ! Je serai une cliente fidèle à votre marque sublime.",
      date: "Il y a 1 mois",
    },
    {
      id: 10,
      author: "Fifi M.",
      location: "Alger",
      rating: 5,
      text: "J'ai reçu mon ensemble d'été, merci ! 😍 C'est exactement la taille qu'il me fallait ❤️ La couleur me plaît beaucoup, c'est un magnifique ensemble. Bravo à vous, c'est un plaisir de traiter avec vous.",
      date: "Il y a 1 mois",
    },
  ];

  // Show 6 random reviews per page load
  const [reviews] = useState(() => {
    const shuffled = [...allReviews].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();

        // Parse JSON fields safely
        try {
          data.images =
            typeof data.images === "string"
              ? JSON.parse(data.images)
              : data.images || [];
          data.sizes =
            typeof data.sizes === "string"
              ? JSON.parse(data.sizes)
              : data.sizes || [];
          data.colors =
            typeof data.colors === "string"
              ? JSON.parse(data.colors)
              : data.colors || [];
        } catch {
          data.images = [];
          data.sizes = [];
          data.colors = [];
        }

        setProduct(data);
        // Set default selections
        if (data.sizes.length > 0) setSelectedSize(data.sizes[0]);
        if (data.colors.length > 0) setSelectedColor(data.colors[0]);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch related products
  useEffect(() => {
    if (product?.collectionId) {
      fetch(`/api/products?collection=${product.collectionId}&limit=4`)
        .then((res) => res.json())
        .then((data) => {
          const items = Array.isArray(data) ? data : data.items || [];
          const filtered = items
            .filter((p: Record<string, unknown>) => p.id !== id)
            .slice(0, 3)
            .map((p: Record<string, unknown>) => {
              let images: string[] = [];
              try {
                images =
                  typeof p.images === "string"
                    ? JSON.parse(p.images)
                    : (p.images as string[]) || [];
              } catch {
                images = [];
              }
              return { ...p, images };
            });
          setRelatedProducts(filtered);
        })
        .catch(() => setRelatedProducts([]));
    } else if (product) {
      // Fallback: get any products
      fetch("/api/products?limit=4")
        .then((res) => res.json())
        .then((data) => {
          const items = Array.isArray(data) ? data : data.items || [];
          const filtered = items
            .filter((p: Record<string, unknown>) => p.id !== id)
            .slice(0, 3)
            .map((p: Record<string, unknown>) => {
              let images: string[] = [];
              try {
                images =
                  typeof p.images === "string"
                    ? JSON.parse(p.images)
                    : (p.images as string[]) || [];
              } catch {
                images = [];
              }
              return { ...p, images };
            });
          setRelatedProducts(filtered);
        })
        .catch(() => setRelatedProducts([]));
    }
  }, [product, id]);

  // Get variant stock for the currently selected size+color
  const getVariantStock = (): number | null => {
    if (!product || !product.variants || product.variants.length === 0)
      return null;
    if (!selectedSize || !selectedColor) return null;
    const v = product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor,
    );
    return v ? v.stock : 0;
  };

  const variantStock = getVariantStock();
  const isOutOfStock = variantStock !== null && variantStock <= 0;
  const availableStock =
    variantStock !== null ? variantStock : (product?.stock ?? 0);

  // Track ViewContent — fires once when product loads (Meta Pixel + GA4)
  useEffect(() => {
    if (!product) return;
    const { price: activePrice } = getActivePrice(product);
    trackEvent.fb.viewContent(product.id, product.nameFr, activePrice);
    trackEvent.ga.viewItem({
      item_id: product.id,
      item_name: product.nameFr,
      price: activePrice,
    });
  }, [product]);

  // Reset quantity when size/color changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColor]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize || !selectedColor) {
      toast.error("Veuillez sélectionner une taille et une couleur");
      return;
    }
    if (isOutOfStock) {
      toast.error("Rupture de stock pour cette combinaison taille/couleur");
      return;
    }
    if (availableStock > 0 && quantity > availableStock) {
      toast.error(`Stock insuffisant. Seulement ${availableStock} disponible(s).`);
      return;
    }
    const { price: activePrice } = getActivePrice(product);
    addItem({
      productId: product.id,
      name: language === "fr" ? product.nameFr : product.nameAr,
      price: activePrice,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
    });

    // Track AddToCart — Meta Pixel + GA4
    trackEvent.fb.addToCart(product.id, product.nameFr, activePrice * quantity);
    trackEvent.ga.addToCart(product.id, product.nameFr, activePrice * quantity);

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const productName = language === "fr" ? product.nameFr : product.nameAr;
    const { price: activePrice } = getActivePrice(product);
    const message = `Bonjour, je souhaite commander:\n\n🛍️ ${productName}\n📏 Taille: ${selectedSize}\n🎨 Couleur: ${selectedColor}\n🔢 Quantité: ${quantity}\n💰 Prix: ${activePrice * quantity} DZD`;
    window.open(getWhatsAppLink(message), "_blank");
  };

  const getFallbackImage = (name: string) =>
    `https://placehold.co/600x800/F5F1EC/4A3A2A?text=${encodeURIComponent(name || "Produit")}`;

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-harp-beige/30 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image skeleton */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-gray-200 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
            {/* Details skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              </div>
              <div className="flex gap-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-20 bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <ShoppingBag size={32} className="text-gray-400" />
        </div>
        <h1 className="text-2xl font-serif font-bold mb-2 text-gray-900">
          Produit non trouvé
        </h1>
        <p className="text-gray-500 mb-6">
          Ce produit n'existe pas ou a été supprimé
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-harp-brown text-white px-6 py-3 rounded-full hover:bg-harp-caramel transition-colors"
        >
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const name = language === "fr" ? product.nameFr : product.nameAr;
  const description =
    language === "fr" ? product.descriptionFr : product.descriptionAr;

  return (
    <div className="min-h-screen bg-gradient-to-b from-harp-beige/20 to-white">
      {/* Structured Data */}
      <ProductJsonLd
        product={{
          name,
          description: description || "",
          price: getActivePrice(product).price,
          image: product.images[0] || "",
          images: product.images,
          sku: product.id,
          slug: product.id,
          colors: product.colors,
          sizes: product.sizes,
        }}
        reviews={reviews.map((r) => ({
          rating: r.rating,
          author: r.author,
          text: r.text,
        }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "https://harp-dz.com/" },
          { name: "Boutique", url: "https://harp-dz.com/shop" },
          { name, url: `https://harp-dz.com/product/${product.id}` },
        ]}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-gray-500 hover:text-harp-brown transition-colors"
            >
              Accueil
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link
              href="/shop"
              className="text-gray-500 hover:text-harp-brown transition-colors"
            >
              Boutique
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-harp-brown font-medium truncate max-w-[200px]">
              {name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              role="button"
              tabIndex={0}
              aria-label={isZoomed ? "Dézoomer l'image" : "Zoomer l'image"}
              className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden group cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsZoomed(!isZoomed);
                }
              }}
            >
              <Image
                src={
                  imageError[activeImage]
                    ? getFallbackImage(name)
                    : product.images[activeImage]
                }
                alt={name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={cn(
                  "object-cover transition-transform duration-500",
                  isZoomed ? "scale-150" : "group-hover:scale-105",
                )}
                priority
                onError={() =>
                  setImageError((prev) => ({ ...prev, [activeImage]: true }))
                }
              />

              {/* Zoom indicator */}
              <div
                aria-hidden="true"
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ZoomIn size={20} className="text-gray-600" />
              </div>

              {/* New badge */}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-harp-brown text-xs uppercase tracking-widest px-3 py-1.5 rounded-full font-medium">
                  <Sparkles size={12} />
                  Nouveau
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImage(idx);
                    setIsZoomed(false);
                  }}
                  className={cn(
                    "relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden transition-all duration-300",
                    activeImage === idx
                      ? "ring-2 ring-harp-brown ring-offset-2"
                      : "hover:opacity-80",
                  )}
                >
                  <Image
                    src={imageError[idx] ? getFallbackImage(name) : img}
                    alt={`${name} - Vue ${idx + 1} sur ${product.images.length}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 12vw"
                    className="object-cover"
                    onError={() =>
                      setImageError((prev) => ({ ...prev, [idx]: true }))
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
                  {name}
                </h1>
                {(() => {
                  const {
                    price: activePrice,
                    originalPrice,
                    isPromo,
                  } = getActivePrice(product);
                  return (
                    <div className="flex items-baseline gap-3">
                      <p className="text-2xl md:text-3xl font-bold text-harp-brown">
                        {activePrice.toLocaleString()}{" "}
                        <span className="text-lg font-normal">DZD</span>
                      </p>
                      {isPromo && originalPrice && (
                        <>
                          <p className="text-lg text-gray-400 line-through">
                            {originalPrice.toLocaleString()} DZD
                          </p>
                          <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                            -
                            {Math.round(
                              ((originalPrice - activePrice) / originalPrice) *
                                100,
                            )}
                            %
                          </span>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Star Rating + Reviews count */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        className="text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    5.0 ({allReviews.length} avis)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  aria-label={
                    isWishlisted
                      ? "Retirer de la liste de souhaits"
                      : "Ajouter à la liste de souhaits"
                  }
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn(
                    "p-3 rounded-full transition-all",
                    isWishlisted
                      ? "bg-red-50 text-red-500"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  <Heart
                    size={20}
                    className={isWishlisted ? "fill-current" : ""}
                  />
                </button>
                <button
                  aria-label="Partager ce produit"
                  className="p-3 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                  onClick={async () => {
                    const shareData = {
                      title: product
                        ? language === "ar"
                          ? product.nameAr
                          : product.nameFr
                        : "Harp",
                      url: window.location.href,
                    };
                    if (navigator.share) {
                      try {
                        await navigator.share(shareData);
                      } catch {
                        /* user cancelled */
                      }
                    } else {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("Lien copié !");
                    }
                  }}
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Promo Countdown */}
            {promoCountdownEnabled && product.promoEnd && new Date(product.promoEnd) > new Date() && (
              <PromoCountdown endDate={product.promoEnd} />
            )}

            {/* Delivery Estimate Badge */}
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <Truck size={18} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">
                  ⏱ Livraison estimée 24-72h
                </p>
                <p className="text-xs text-green-600">
                  Suivi en temps réel Yalidine ou ZR Express
                </p>
              </div>
              <Link
                href="/suivi"
                className="text-xs text-green-700 hover:underline shrink-0"
              >
                Suivre un colis →
              </Link>
            </div>

            {/* Live Viewers + Free Shipping Progress */}
            <div className="space-y-2">
              {/* Live viewers */}
              <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                <span className="font-medium">{viewerCount} personnes regardent ce produit</span>
              </div>

              {/* Free shipping progress */}
              {(() => {
                const { price: activePrice } = getActivePrice(product);
                const cartValue = activePrice * quantity;
                const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartValue);
                const progress = Math.min(100, (cartValue / FREE_SHIPPING_THRESHOLD) * 100);
                return remaining > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-blue-700 font-medium">
                        Plus que {remaining.toLocaleString()} DZD pour la livraison gratuite !
                      </span>
                      <Truck size={14} className="text-blue-500" />
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <Truck size={14} className="text-green-600" />
                    <span className="font-medium">Livraison GRATUITE !</span>
                  </div>
                );
              })()}
            </div>

            {/* Mobile Trust Strip — visible only on mobile, above fold */}
            <div className="flex items-center justify-between gap-2 lg:hidden text-[11px] text-gray-600">
              <span className="flex items-center gap-1">
                <CreditCard size={13} className="text-harp-brown" />
                Paiement à la livraison
              </span>
              <span className="w-px h-3 bg-gray-300" />
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-harp-brown" />
                Qualité garantie
              </span>
              <span className="w-px h-3 bg-gray-300" />
              <span className="flex items-center gap-1">
                <RotateCcw size={13} className="text-harp-brown" />
                Échange 48h
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{description}</p>

            {/* Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Couleur
                </label>
                <span className="text-sm text-harp-brown font-medium">
                  {selectedColor}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "relative px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                      selectedColor === color
                        ? "bg-harp-brown text-white shadow-lg shadow-harp-brown/20"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    )}
                  >
                    {selectedColor === color && (
                      <Check size={14} className="inline mr-1.5" />
                    )}
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Taille
                </label>
                {product.showSizeGuide !== false && (
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs text-harp-brown hover:underline flex items-center gap-1"
                  >
                    <Ruler size={12} />
                    Guide des tailles
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2",
                      selectedSize === size
                        ? "border-harp-brown bg-harp-brown/5 text-harp-brown"
                        : "border-gray-200 text-gray-600 hover:border-gray-300",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Variant Stock Indicator — only show when out of stock */}
            {selectedSize && selectedColor && isOutOfStock && (
              <div className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Rupture de stock
              </div>
            )}

            {/* Back in Stock Alert */}
            {isOutOfStock && (
              <BackInStockAlert
                productId={product.id}
                size={selectedSize}
                color={selectedColor}
                isOutOfStock={isOutOfStock}
              />
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-900 uppercase tracking-wide mb-3">
                Quantité
              </label>
              <div className="inline-flex items-center bg-gray-100 rounded-xl">
                <button
                  aria-label="Diminuer la quantité"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-200 rounded-l-xl transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span
                  aria-live="polite"
                  className="px-6 py-3 font-medium text-lg min-w-[60px] text-center"
                >
                  {quantity}
                </span>
                <button
                  aria-label="Augmenter la quantité"
                  onClick={() =>
                    setQuantity(
                      Math.min(
                        quantity + 1,
                        availableStock > 0 ? availableStock : quantity + 1,
                      ),
                    )
                  }
                  disabled={availableStock > 0 && quantity >= availableStock}
                  className={cn(
                    "p-3 rounded-r-xl transition-colors",
                    availableStock > 0 && quantity >= availableStock
                      ? "text-gray-300 cursor-not-allowed"
                      : "hover:bg-gray-200",
                  )}
                >
                  <Plus size={18} />
                </button>
              </div>
              {availableStock > 0 && availableStock <= 20 && !isOutOfStock && (
                <div className="flex items-center gap-2 mt-2 text-sm font-medium text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                  </span>
                  Plus que {availableStock} en stock — commandez vite !
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={addedToCart || isOutOfStock}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-3",
                  isOutOfStock
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : addedToCart
                      ? "bg-green-600 text-white"
                      : "bg-harp-brown text-white hover:bg-harp-caramel shadow-lg shadow-harp-brown/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
                )}
              >
                {isOutOfStock ? (
                  "Rupture de stock"
                ) : addedToCart ? (
                  <>
                    <Check size={20} />
                    Ajouté au panier !
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    <span>Ajouter au panier</span>
                    <span className="mx-1">—</span>
                    <span>{(getActivePrice(product).price * quantity).toLocaleString()} DZD</span>
                  </>
                )}
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-full py-4 rounded-xl font-medium uppercase tracking-widest border-2 border-green-600 text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Commander via WhatsApp
              </button>
            </div>

            {/* COD Highlight */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <CreditCard size={22} className="text-green-700" />
              </div>
              <div>
                <p className="font-bold text-green-900 text-sm">Paiement à la livraison</p>
                <p className="text-xs text-green-700">Payez en cash à réception. 0 risque pour vous.</p>
              </div>
            </div>

            {/* Trust Badges - Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5">
                <Truck size={18} className="text-harp-brown shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Livraison 58 wilayas</p>
                  <p className="text-[11px] text-gray-500">24-72h Yalidine/ZR</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5">
                <ShieldCheck size={18} className="text-harp-brown shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Qualité Garantie</p>
                  <p className="text-[11px] text-gray-500">Contrôle rigoureux</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5">
                <RotateCcw size={18} className="text-harp-brown shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Échange 48h</p>
                  <p className="text-[11px] text-gray-500">Satisfaite ou échangée</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5">
                <Star size={18} className="text-amber-500 fill-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">+500 clientes</p>
                  <p className="text-[11px] text-gray-500">Note 5/5 étoiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add to Cart Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 lg:hidden z-40 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2",
              isOutOfStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : addedToCart
                  ? "bg-green-600 text-white"
                  : "bg-harp-brown text-white active:scale-[0.98]",
            )}
          >
            {isOutOfStock ? (
              "Rupture de stock"
            ) : addedToCart ? (
              <>
                <Check size={18} />
                Ajouté !
              </>
            ) : (
              <>
                <ShoppingBag size={18} />
                <span>Ajouter — {(getActivePrice(product).price * quantity).toLocaleString()} DZD</span>
              </>
            )}
          </button>
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 text-white p-3.5 rounded-xl active:scale-95"
          >
            <MessageCircle size={22} />
          </button>
        </div>
      </div>

      {/* Cross-sell Section */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-gray-100 pt-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Complétez votre look
            </h2>
            <p className="text-gray-500 mb-8">
              D&apos;autres pièces qui pourraient vous plaire
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
                    <Image
                      src={item.images[0]}
                      alt={item.nameFr}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.nameFr}
                    </h3>
                    <p className="text-harp-brown font-bold mt-1">
                      {item.price.toLocaleString()} DZD
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      <section className="mt-16 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
                Avis Clients
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  5.0 • {allReviews.length} avis vérifiés
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-6 rounded-2xl border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i <= review.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed line-clamp-4">
                  <Quote size={14} className="inline text-gray-300 mr-1" />
                  {review.text}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{review.author}</p>
                    <p className="text-gray-500">{review.location}</p>
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Guide des tailles"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSizeGuide(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowSizeGuide(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-harp-brown/10 rounded-full flex items-center justify-center">
                  <Ruler size={20} className="text-harp-brown" />
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-900">
                  Guide des Tailles
                </h3>
              </div>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* How to Measure - Visual Guide */}
              <div className="bg-gradient-to-br from-harp-beige/30 to-harp-gold/10 p-5 rounded-2xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-harp-brown"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Comment prendre vos mesures
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* Poitrine */}
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto mb-3 relative">
                      {/* Silhouette buste femme */}
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        {/* Corps */}
                        <path
                          d="M32 8c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z"
                          fill="#fce7f3"
                          stroke="#ec4899"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M20 28c0-6 5-8 12-8s12 2 12 8v12c0 2-2 4-4 4h-16c-2 0-4-2-4-4V28z"
                          fill="#fce7f3"
                          stroke="#ec4899"
                          strokeWidth="1.5"
                        />
                        {/* Ligne mesure poitrine */}
                        <path
                          d="M16 32h32"
                          stroke="#ec4899"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                        <circle cx="16" cy="32" r="2" fill="#ec4899" />
                        <circle cx="48" cy="32" r="2" fill="#ec4899" />
                        {/* Flèches */}
                        <path
                          d="M18 30l-2 2 2 2M46 30l2 2-2 2"
                          stroke="#ec4899"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Poitrine
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Mesurez au niveau le plus fort
                    </p>
                  </div>
                  {/* Taille */}
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto mb-3 relative">
                      {/* Silhouette taille femme */}
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        {/* Corps - forme sablier */}
                        <path
                          d="M22 8c-2 8 0 16 0 24 0 8-4 16-4 24h28c0-8-4-16-4-24 0-8 2-16 0-24H22z"
                          fill="#fef3c7"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                        />
                        {/* Ligne mesure taille (partie étroite) */}
                        <path
                          d="M14 32h36"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                        <circle cx="14" cy="32" r="2" fill="#f59e0b" />
                        <circle cx="50" cy="32" r="2" fill="#f59e0b" />
                        {/* Flèches */}
                        <path
                          d="M16 30l-2 2 2 2M48 30l2 2-2 2"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          fill="none"
                        />
                        {/* Indication creux */}
                        <path
                          d="M26 32c2-2 4-2 6-2s4 0 6 2"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          fill="none"
                          opacity="0.5"
                        />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Taille
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Mesurez au creux naturel
                    </p>
                  </div>
                  {/* Hanches */}
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="w-16 h-16 mx-auto mb-3 relative">
                      {/* Silhouette hanches femme */}
                      <svg viewBox="0 0 64 64" className="w-full h-full">
                        {/* Corps - hanches larges */}
                        <path
                          d="M26 4h12v8c4 4 10 12 10 20v8c0 4-2 8-6 12H22c-4-4-6-8-6-12v-8c0-8 6-16 10-20V4z"
                          fill="#f3e8ff"
                          stroke="#a855f7"
                          strokeWidth="1.5"
                        />
                        {/* Ligne mesure hanches (partie large) */}
                        <path
                          d="M10 38h44"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                        <circle cx="10" cy="38" r="2" fill="#a855f7" />
                        <circle cx="54" cy="38" r="2" fill="#a855f7" />
                        {/* Flèches */}
                        <path
                          d="M12 36l-2 2 2 2M52 36l2 2-2 2"
                          stroke="#a855f7"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Hanches
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Mesurez au niveau le plus large
                    </p>
                  </div>
                </div>
              </div>

              {/* Height Reference */}
              <div className="bg-gray-50 p-5 rounded-2xl">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M12 22V2M12 2l4 4M12 2L8 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Selon votre hauteur
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {/* Taille S */}
                  <div className="bg-white rounded-xl p-3 text-center border-2 border-transparent hover:border-harp-brown/30 transition-colors">
                    <div className="h-16 flex items-end justify-center mb-2">
                      <svg viewBox="0 0 40 64" className="h-10">
                        <ellipse cx="20" cy="8" rx="6" ry="6" fill="#E8D5C4" />
                        <path
                          d="M12 18c0-2 4-4 8-4s8 2 8 4v14c0 1-1 2-2 2h-2l-2 24h-4l-2-24h-2c-1 0-2-1-2-2V18z"
                          fill="#D4C4B0"
                        />
                        <path
                          d="M14 58h12"
                          stroke="#8B7355"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="w-10 h-10 mx-auto bg-harp-brown text-white rounded-full flex items-center justify-center font-bold text-sm mb-1">
                      S
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      1m55-1m60
                    </p>
                  </div>
                  {/* Taille M */}
                  <div className="bg-white rounded-xl p-3 text-center border-2 border-transparent hover:border-harp-brown/30 transition-colors">
                    <div className="h-16 flex items-end justify-center mb-2">
                      <svg viewBox="0 0 40 64" className="h-12">
                        <ellipse cx="20" cy="6" rx="5" ry="5" fill="#E8D5C4" />
                        <path
                          d="M13 14c0-2 3-3 7-3s7 1 7 3v12c0 1-1 2-2 2h-2l-2 28h-2l-2-28h-2c-1 0-2-1-2-2V14z"
                          fill="#D4C4B0"
                        />
                        <path
                          d="M15 58h10"
                          stroke="#8B7355"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="w-10 h-10 mx-auto bg-harp-brown text-white rounded-full flex items-center justify-center font-bold text-sm mb-1">
                      M
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      1m60-1m68
                    </p>
                  </div>
                  {/* Taille L */}
                  <div className="bg-white rounded-xl p-3 text-center border-2 border-transparent hover:border-harp-brown/30 transition-colors">
                    <div className="h-16 flex items-end justify-center mb-2">
                      <svg viewBox="0 0 40 64" className="h-14">
                        <ellipse
                          cx="20"
                          cy="5"
                          rx="4.5"
                          ry="4.5"
                          fill="#E8D5C4"
                        />
                        <path
                          d="M14 12c0-1.5 3-2.5 6-2.5s6 1 6 2.5v11c0 1-1 1.5-1.5 1.5H23l-1.5 32h-3l-1.5-32h-1.5c-.5 0-1.5-.5-1.5-1.5V12z"
                          fill="#D4C4B0"
                        />
                        <path
                          d="M16 58h8"
                          stroke="#8B7355"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="w-10 h-10 mx-auto bg-harp-brown text-white rounded-full flex items-center justify-center font-bold text-sm mb-1">
                      L
                    </div>
                    <p className="text-xs text-gray-600 font-medium">
                      1m68-1m75
                    </p>
                  </div>
                  {/* Taille XL */}
                  <div className="bg-white rounded-xl p-3 text-center border-2 border-transparent hover:border-harp-brown/30 transition-colors">
                    <div className="h-16 flex items-end justify-center mb-2">
                      <svg viewBox="0 0 40 64" className="h-16">
                        <ellipse cx="20" cy="4" rx="4" ry="4" fill="#E8D5C4" />
                        <path
                          d="M14 10c0-1 2.5-2 6-2s6 1 6 2v10c0 .8-.8 1.2-1.2 1.2H23l-1.5 36h-3l-1.5-36h-1.8c-.4 0-1.2-.4-1.2-1.2V10z"
                          fill="#D4C4B0"
                        />
                        <path
                          d="M17 58h6"
                          stroke="#8B7355"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="w-10 h-10 mx-auto bg-harp-brown text-white rounded-full flex items-center justify-center font-bold text-sm mb-1">
                      XL
                    </div>
                    <p className="text-xs text-gray-600 font-medium">1m75+</p>
                  </div>
                </div>
              </div>

              {/* Size Table */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 3v18" />
                  </svg>
                  Tableau des mesures (cm)
                </h4>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-harp-brown text-white">
                        <th className="p-3 text-left font-medium">Taille</th>
                        <th className="p-3 text-center font-medium">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-pink-300 rounded-full"></span>
                            Poitrine
                          </span>
                        </th>
                        <th className="p-3 text-center font-medium">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-300 rounded-full"></span>
                            Taille
                          </span>
                        </th>
                        <th className="p-3 text-center font-medium">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 bg-purple-300 rounded-full"></span>
                            Hanches
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-harp-brown">S</td>
                        <td className="p-3 text-center">86-90</td>
                        <td className="p-3 text-center">66-70</td>
                        <td className="p-3 text-center">92-96</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-harp-brown">M</td>
                        <td className="p-3 text-center">90-94</td>
                        <td className="p-3 text-center">70-74</td>
                        <td className="p-3 text-center">96-100</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-harp-brown">L</td>
                        <td className="p-3 text-center">94-98</td>
                        <td className="p-3 text-center">74-78</td>
                        <td className="p-3 text-center">100-104</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-harp-brown">XL</td>
                        <td className="p-3 text-center">98-102</td>
                        <td className="p-3 text-center">78-82</td>
                        <td className="p-3 text-center">104-108</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tips */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 text-sm">
                        Conseil
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Entre deux tailles ? Prenez la plus grande pour un
                        confort optimal.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <MessageCircle size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900 text-sm">
                        Besoin d&apos;aide ?
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        WhatsApp pour conseils personnalisés
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
