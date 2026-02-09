"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Instagram,
  Phone,
  Mail,
  ArrowRight,
  Facebook,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { siteConfig, getWhatsAppLink } from "@/lib/config";

// TikTok icon (not in Lucide)
const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

export function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer
      role="contentinfo"
      aria-label="Pied de page"
      className="mt-auto bg-gradient-to-b from-white to-harp-cream/30 border-t border-harp-sand/50"
    >
      {/* Newsletter Section */}
      <section className="py-16 md:py-20 border-b border-harp-sand/50 bg-harp-sand/20">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-3xl font-serif font-medium text-gray-900 mb-4">
              {t("footer.newsletter.title")}
            </h3>
            <p className="text-gray-500 mb-8 font-light">
              {t("footer.newsletter.desc")}
            </p>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-3"
              aria-label="Newsletter inscription"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.newsletter.placeholder")}
                aria-label="Adresse email pour newsletter"
                required
                className="flex-1 px-5 py-3.5 bg-white border border-harp-sand rounded-full text-sm focus:border-harp-caramel focus:ring-0 outline-none transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="group px-8 py-3.5 bg-harp-brown text-white rounded-full font-medium text-sm uppercase tracking-wider hover:bg-harp-caramel transition-colors flex items-center justify-center gap-2"
              >
                {isSubscribed
                  ? t("footer.newsletter.subscribed")
                  : t("footer.newsletter.button")}
                {!isSubscribed && (
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <div className="pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand - 4 cols */}
            <div className="md:col-span-4 space-y-6">
              <Link href="/" className="block">
                <Image
                  src="/logo.svg"
                  alt="Harp"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
              <p className="text-gray-500 leading-relaxed font-light max-w-sm">
                {t("hero.subtitle")}
              </p>
              <div className="flex gap-4 pt-2">
                <SocialLink
                  href="https://instagram.com/harp_algeria"
                  icon={Instagram}
                />
                <SocialLink
                  href="https://www.facebook.com/profile.php?id=61566880453440"
                  icon={Facebook}
                />
                <SocialLink
                  href="https://www.tiktok.com/@harp.algeria"
                  icon={TikTokIcon}
                />
                <SocialLink href={getWhatsAppLink()} icon={Phone} />
              </div>
            </div>

            {/* Navigation - 2 cols */}
            <div className="md:col-span-2">
              <h4 className="font-serif font-medium text-gray-900 text-lg mb-6">
                {t("footer.nav.title")}
              </h4>
              <ul className="space-y-4">
                <FooterLink href="/">{t("nav.home")}</FooterLink>
                <FooterLink href="/shop">{t("nav.shop")}</FooterLink>
                <FooterLink href="/about">{t("nav.about")}</FooterLink>
                <FooterLink href="/contact">{t("nav.contact")}</FooterLink>
              </ul>
            </div>

            {/* Service - 3 cols */}
            <div className="md:col-span-3">
              <h4 className="font-serif font-medium text-gray-900 text-lg mb-6">
                {t("footer.service.title")}
              </h4>
              <ul className="space-y-4">
                <li className="text-gray-500 text-sm">
                  {t("footer.service.delivery")}
                </li>
                <li className="text-gray-500 text-sm">
                  {t("footer.service.payment")}
                </li>
                <li className="text-gray-500 text-sm">
                  {t("footer.service.exchange")}
                </li>
                <li className="text-gray-500 text-sm">
                  {t("footer.service.support")}
                </li>
              </ul>
            </div>

            {/* Contact - 3 cols */}
            <div className="md:col-span-3">
              <h4 className="font-serif font-medium text-gray-900 text-lg mb-6">
                {t("footer.contact.title")}
              </h4>
              <ul className="space-y-4">
                <ContactItem
                  icon={Phone}
                  text={siteConfig.whatsapp.display}
                  href={getWhatsAppLink()}
                />
                <ContactItem
                  icon={Mail}
                  text="contact@harpalgeria.com"
                  href="mailto:contact@harpalgeria.com"
                />
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-harp-sand/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              © {t("footer.copyright")}
            </p>
            <div className="flex items-center gap-8">
              <Link
                href="/privacy"
                className="text-xs text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                {t("footer.legal.privacy")}
              </Link>
              <Link
                href="/terms"
                className="text-xs text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                {t("footer.legal.terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: any }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-harp-sand/50 flex items-center justify-center text-harp-brown hover:bg-harp-brown hover:text-white transition-all"
    >
      <Icon size={18} />
    </a>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-gray-500 hover:text-harp-brown transition-colors block"
      >
        {children}
      </Link>
    </li>
  );
}

function ContactItem({
  icon: Icon,
  text,
  href,
}: {
  icon: any;
  text: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 group">
      <Icon
        size={18}
        className="text-gray-400 group-hover:text-harp-brown transition-colors mt-0.5"
      />
      <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors">
        {text}
      </span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return <li>{content}</li>;
}
