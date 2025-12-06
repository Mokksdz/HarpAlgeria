import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CartProvider } from "@/components/CartProvider";
import { MainLayout } from "@/components/MainLayout";
import { SessionProvider } from "@/components/SessionProvider";
import { Analytics } from "@/components/Analytics";
import { OrganizationJsonLd } from "@/components/JsonLd";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  ],
  authors: [{ name: "Harp" }],
  openGraph: {
    title: "Harp - Une élégance qui résonne",
    description: "Prêt-à-porter féminin élégant et modeste.",
    url: "https://harp-web.com",
    siteName: "Harp",
    locale: "fr_FR",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans">
        <Analytics />
        <OrganizationJsonLd />
        <SessionProvider>
          <ErrorBoundary>
            <LanguageProvider>
              <CartProvider>
                <MainLayout>{children}</MainLayout>
              </CartProvider>
            </LanguageProvider>
          </ErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  );
}
