import type { Metadata } from "next";
import { Inter, Playfair_Display, Fustat } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CartProvider } from "@/components/CartProvider";
import { MainLayout } from "@/components/MainLayout";
import { SessionProvider } from "@/components/SessionProvider";
import { Analytics } from "@/components/Analytics";
import { OrganizationJsonLd } from "@/components/JsonLd";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap", // Prevents FOIT (Flash of Invisible Text)
  preload: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const fustat = Fustat({
  variable: "--font-fustat",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Meta domain verification (set in .env.local when you configure Meta Business)
const fbDomainVerification = process.env.NEXT_PUBLIC_FB_DOMAIN_VERIFICATION;

export const metadata: Metadata = {
  title: {
    default: "Harp - Une élégance qui résonne",
    template: "%s | Harp",
  },
  description:
    "Prêt-à-porter féminin élégant et modeste. Découvrez nos collections uniques alliant confort, qualité et modernité.",
  keywords: [
    "mode",
    "femme",
    "modest fashion",
    "élégance",
    "vêtements",
    "harp",
    "algérie",
    "ملابس نسائية",
    "أزياء محتشمة",
    "هارب الجزائر",
  ],
  authors: [{ name: "Harp" }],
  openGraph: {
    title: "Harp - Une élégance qui résonne",
    description: "Prêt-à-porter féminin élégant et modeste.",
    url: "https://harp-dz.com",
    siteName: "Harp",
    locale: "fr_FR",
    alternateLocale: "ar_DZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harp - Une élégance qui résonne",
    description: "Prêt-à-porter féminin élégant et modeste.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Harp",
  },
  ...(fbDomainVerification && {
    verification: {
      other: {
        "facebook-domain-verification": fbDomainVerification,
      },
    },
  }),
};

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable} ${fustat.variable}`}>
      <head>
        {/* Meta Pixel — injected server-side in <head> for reliable firing */}
        {FB_PIXEL_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
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
                `,
              }}
            />
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
        )}
      </head>
      <body className="antialiased font-sans">
        <Analytics />
        <OrganizationJsonLd />
        <ServiceWorkerRegister />
        <SessionProvider>
          <ErrorBoundary>
            <LanguageProvider>
              <CartProvider>
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: "#1a1a1a",
                      color: "#fff",
                      borderRadius: "12px",
                      fontSize: "14px",
                      padding: "12px 20px",
                    },
                    success: {
                      iconTheme: { primary: "#22c55e", secondary: "#fff" },
                    },
                    error: {
                      iconTheme: { primary: "#ef4444", secondary: "#fff" },
                    },
                  }}
                />
                <MainLayout>{children}</MainLayout>
              </CartProvider>
            </LanguageProvider>
          </ErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  );
}
