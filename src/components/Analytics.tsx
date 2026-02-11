"use client";

import Script from "next/script";

// Configuration - Update these values with your tracking IDs
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

// Type-safe window accessor for analytics globals
interface AnalyticsWindow extends Window {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
}

function getWindow(): AnalyticsWindow | undefined {
  if (typeof window !== "undefined") return window as AnalyticsWindow;
  return undefined;
}

// Shared item type for GA4 e-commerce events
interface GAItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
}

interface FBItem {
  productId: string;
  name?: string;
  price?: number;
  quantity?: number;
}

// Google Analytics Component
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}', {
                        page_path: window.location.pathname,
                    });
                `}
      </Script>
    </>
  );
}

// NOTE: Facebook Pixel is injected directly in <head> via layout.tsx
// for reliable server-side rendering. The trackEvent.fb.* functions
// below still work because they reference window.fbq set by that script.

// Combined Analytics Component
export function Analytics() {
  return <GoogleAnalytics />;
}

// Analytics Event Tracking Functions
export const trackEvent = {
  // Google Analytics Events
  ga: {
    pageView: (url: string) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
      }
    },
    event: (
      action: string,
      category: string,
      label?: string,
      value?: number,
    ) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", action, {
          event_category: category,
          event_label: label,
          value: value,
        });
      }
    },
    // GA4 Enhanced E-commerce: view_item
    viewItem: (item: GAItem) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", "view_item", {
          currency: "DZD",
          value: item.price,
          items: [item],
        });
      }
    },
    // GA4 Enhanced E-commerce: view_item_list
    viewItemList: (listName: string, items: GAItem[]) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", "view_item_list", {
          item_list_name: listName,
          items: items,
        });
      }
    },
    addToCart: (productId: string, name: string, price: number) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", "add_to_cart", {
          currency: "DZD",
          value: price,
          items: [{ item_id: productId, item_name: name, price: price }],
        });
      }
    },
    // GA4 Enhanced E-commerce: begin_checkout
    beginCheckout: (total: number, items: GAItem[]) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", "begin_checkout", {
          currency: "DZD",
          value: total,
          items: items,
        });
      }
    },
    // GA4 Enhanced E-commerce: add_shipping_info
    addShippingInfo: (total: number, shippingTier: string) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", "add_shipping_info", {
          currency: "DZD",
          value: total,
          shipping_tier: shippingTier,
        });
      }
    },
    // GA4 Enhanced E-commerce: add_payment_info
    addPaymentInfo: (total: number, paymentType: string) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", "add_payment_info", {
          currency: "DZD",
          value: total,
          payment_type: paymentType,
        });
      }
    },
    purchase: (orderId: string, total: number, items: GAItem[]) => {
      const w = getWindow();
      if (w?.gtag) {
        w.gtag("event", "purchase", {
          transaction_id: orderId,
          value: total,
          currency: "DZD",
          items: items,
        });
      }
    },
  },

  // Facebook Pixel Events
  fb: {
    pageView: () => {
      const w = getWindow();
      if (w?.fbq) {
        w.fbq("track", "PageView");
      }
    },
    viewContent: (productId: string, name: string, price: number) => {
      const w = getWindow();
      if (w?.fbq) {
        w.fbq("track", "ViewContent", {
          content_ids: [productId],
          content_name: name,
          content_type: "product",
          value: price,
          currency: "DZD",
        });
      }
    },
    // Facebook: ViewCategory (custom event for collection/category pages)
    viewCategory: (categoryName: string, productIds: string[]) => {
      const w = getWindow();
      if (w?.fbq) {
        w.fbq("track", "ViewContent", {
          content_type: "product_group",
          content_name: categoryName,
          content_ids: productIds,
          currency: "DZD",
        });
      }
    },
    addToCart: (productId: string, name: string, price: number) => {
      const w = getWindow();
      if (w?.fbq) {
        w.fbq("track", "AddToCart", {
          content_ids: [productId],
          content_name: name,
          content_type: "product",
          value: price,
          currency: "DZD",
        });
      }
    },
    initiateCheckout: (total: number, itemCount: number) => {
      const w = getWindow();
      if (w?.fbq) {
        w.fbq("track", "InitiateCheckout", {
          value: total,
          currency: "DZD",
          num_items: itemCount,
        });
      }
    },
    // Facebook: AddPaymentInfo
    addPaymentInfo: (total: number) => {
      const w = getWindow();
      if (w?.fbq) {
        w.fbq("track", "AddPaymentInfo", {
          value: total,
          currency: "DZD",
        });
      }
    },
    purchase: (orderId: string, total: number, items: FBItem[]) => {
      const w = getWindow();
      if (w?.fbq) {
        w.fbq("track", "Purchase", {
          value: total,
          currency: "DZD",
          content_ids: items.map((i) => i.productId),
          content_type: "product",
          num_items: items.length,
        });
      }
    },
  },
};
