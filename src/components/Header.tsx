"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import { useCart } from "./CartProvider";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Header() {
  const { t, language, setLanguage } = useLanguage();
  const { setIsOpen: setCartOpen, items } = useCart();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [pathname, isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "ar" : "fr");
  };

  const navLinks = [
    { href: "/", label: "nav.home" },
    { href: "/shop", label: "nav.shop" },
    { href: "/about", label: "nav.about" },
    { href: "/contact", label: "nav.contact" },
  ];

  return (
    <>
      <header
        role="banner"
        aria-label="Navigation principale"
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_2px_10px_-2px_rgba(61,35,20,0.05)] border-harp-sand/50"
            : "bg-harp-cream/80 backdrop-blur-md border-harp-sand/30",
        )}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-harp-sand/50 rounded-full transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <Menu
              size={22}
              className={cn(
                "transition-transform duration-300 text-gray-900",
                isMenuOpen && "rotate-90 opacity-0",
              )}
            />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="transition-opacity hover:opacity-80 relative"
          >
            <Image
              src="/logo.svg"
              alt="Harp"
              width={150}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm uppercase tracking-[0.15em] transition-colors py-2 relative group",
                  pathname === link.href
                    ? "text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                {t(link.label)}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left transition-transform duration-300",
                    pathname === link.href
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleLanguage}
              className="hidden md:block px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-harp-caramel hover:text-harp-brown hover:bg-harp-sand/50 rounded-full transition-all"
            >
              {language === "fr" ? "العربية" : "FR"}
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 hover:bg-harp-sand/50 rounded-full transition-colors group text-harp-brown"
              aria-label="Panier"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0 bg-harp-brown text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            <Link
              href={session ? "/account" : "/auth/magic-link-request"}
              className="p-2.5 hover:bg-harp-sand/50 rounded-full transition-colors text-harp-brown"
              aria-label="Compte"
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Navigation Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-50 md:hidden transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) shadow-2xl",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <Image
              src="/logo.svg"
              alt="Harp"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-6 flex flex-col h-[calc(100%-80px)] justify-between">
          <div className="space-y-1">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block py-4 text-2xl font-serif font-medium transition-all duration-300",
                  pathname === link.href
                    ? "text-gray-900 pl-4 border-l-2 border-harp-brown"
                    : "text-gray-400 hover:text-gray-900 hover:pl-4",
                  isMenuOpen && "animate-fade-in-up",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setIsMenuOpen(false)}
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="space-y-6 pt-8 border-t border-gray-100">
            <Link
              href={session ? "/account" : "/auth/magic-link-request"}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <User size={20} />
              <span className="text-sm uppercase tracking-widest">
                {session ? "Mon Compte" : "Se connecter"}
              </span>
            </Link>

            <button
              onClick={() => {
                toggleLanguage();
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-sm uppercase tracking-widest">
                {t("nav.language")}
              </span>
              <span className="font-medium">
                {language === "fr" ? "العربية" : "Français"}
              </span>
            </button>

            <div className="flex gap-4">
              {/* Social icons placeholder if needed */}
            </div>

            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-auto">
              © {t("footer.copyright")}
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
