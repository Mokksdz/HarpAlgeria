"use client";

import Script from "next/script";

// Configuration - Update these values with your tracking IDs
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

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

// Facebook Pixel Component
export function FacebookPixel() {
  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${FB_PIXEL_ID}');
                    fbq('track', 'PageView');
                `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Combined Analytics Component
export function Analytics() {
  return (
    <>
      <GoogleAnalytics />
      <FacebookPixel />
    </>
  );
}

// Analytics Event Tracking Functions
export const trackEvent = {
  // Google Analytics Events
  ga: {
    pageView: (url: string) => {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("config", GA_MEASUREMENT_ID, { page_path: url });
      }
    },
    event: (
      action: string,
      category: string,
      label?: string,
      value?: number,
    ) => {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", action, {
          event_category: category,
          event_label: label,
          value: value,
        });
      }
    },
    purchase: (orderId: string, total: number, items: any[]) => {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "purchase", {
          transaction_id: orderId,
          value: total,
          currency: "DZD",
          items: items,
        });
      }
    },
    addToCart: (productId: string, name: string, price: number) => {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "add_to_cart", {
          currency: "DZD",
          value: price,
          items: [{ item_id: productId, item_name: name, price: price }],
        });
      }
    },
  },

  // Facebook Pixel Events
  fb: {
    pageView: () => {
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "PageView");
      }
    },
    viewContent: (productId: string, name: string, price: number) => {
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "ViewContent", {
          content_ids: [productId],
          content_name: name,
          content_type: "product",
          value: price,
          currency: "DZD",
        });
      }
    },
    addToCart: (productId: string, name: string, price: number) => {
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "AddToCart", {
          content_ids: [productId],
          content_name: name,
          content_type: "product",
          value: price,
          currency: "DZD",
        });
      }
    },
    initiateCheckout: (total: number, itemCount: number) => {
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "InitiateCheckout", {
          value: total,
          currency: "DZD",
          num_items: itemCount,
        });
      }
    },
    purchase: (orderId: string, total: number, items: any[]) => {
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
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
