import Script from "next/script";

interface ProductJsonLdProps {
  product: {
    name: string;
    description: string;
    price: number;
    image: string;
    images?: string[];
    sku: string;
    slug?: string;
    stock?: number;
    colors?: string[];
    sizes?: string[];
    category?: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
  };
  reviews?: {
    rating: number;
    author: string;
    text: string;
  }[];
}

export function ProductJsonLd({ product, reviews = [] }: ProductJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  // Calculate aggregate rating from reviews
  const aggregateRating =
    reviews.length > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: (
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          ).toFixed(1),
          reviewCount: reviews.length,
          bestRating: "5",
          worstRating: "1",
        }
      : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images || [product.image],
    sku: product.sku,
    url: product.slug ? `${baseUrl}/product/${product.slug}` : undefined,
    brand: {
      "@type": "Brand",
      name: "Harp",
      logo: `${baseUrl}/logo.svg`,
    },
    category: product.category || "Vêtements femme",
    color: product.colors?.join(", "),
    size: product.sizes?.join(", "),
    offers: {
      "@type": "Offer",
      priceCurrency: "DZD",
      price: product.price,
      availability: `https://schema.org/${product.stock && product.stock > 0 ? "InStock" : product.availability || "InStock"}`,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Harp",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "400",
          currency: "DZD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "DZ",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "DZ",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 2,
        returnMethod: "https://schema.org/ReturnByMail",
      },
    },
    ...(aggregateRating && { aggregateRating }),
    ...(reviews.length > 0 && {
      review: reviews.map((r) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: r.author,
        },
        reviewBody: r.text,
      })),
    }),
  };

  return (
    <Script
      id="product-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// FAQ Schema for product pages
interface FAQJsonLdProps {
  questions: { question: string; answer: string }[];
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Collection/Category Schema
interface CollectionJsonLdProps {
  collection: {
    name: string;
    description?: string;
    slug: string;
    image?: string;
  };
  products?: { name: string; price: number; image: string; slug: string }[];
}

export function CollectionJsonLd({
  collection,
  products = [],
}: CollectionJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://harp-dz.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description:
      collection.description || `Collection ${collection.name} - Harp Algérie`,
    url: `${baseUrl}/collection/${collection.slug}`,
    image: collection.image,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${baseUrl}/product/${p.slug}`,
        name: p.name,
        image: p.image,
      })),
    },
  };

  return (
    <Script
      id="collection-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
}

export function OrganizationJsonLd({
  name = "Harp",
  url = "https://harp-web.com",
  logo = "/logo.svg",
}: OrganizationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: name,
    url: url,
    logo: logo,
    sameAs: [
      "https://www.instagram.com/harp_algeria",
      "https://www.facebook.com/profile.php?id=61566880453440",
      "https://www.tiktok.com/@harp.algeria",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+213561777397",
      contactType: "customer service",
      availableLanguage: ["French", "Arabic"],
    },
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
