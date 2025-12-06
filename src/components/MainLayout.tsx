"use client";

import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import PromoBanner from "./PromoBanner";
import { useLanguage } from "./LanguageProvider";

// Custom hook to detect client-side mounting
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMounted = useIsMounted();
  const { language } = useLanguage();

  const isAdmin = useMemo(() => {
    return pathname?.startsWith("/admin") || false;
  }, [pathname]);

  // Show loading or neutral state during hydration
  if (!isMounted) {
    return (
      <div className="bg-harp-beige text-harp-brown">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  if (isAdmin) {
    // Admin pages have their own layout, no header/footer
    return <>{children}</>;
  }

  return (
    <div className="bg-harp-beige text-harp-brown">
      <PromoBanner lang={language} />
      <Header />
      <CartDrawer />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
