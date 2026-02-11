"use client";

import { useLanguage } from "@/components/LanguageProvider";
import {
  Gift,
  Star,
  Crown,
  Truck,
  ShoppingBag,
  Heart,
  MessageCircle,
  Camera,
  Mail,
  Cake,
} from "lucide-react";
import Link from "next/link";

const EARN_WAYS = [
  {
    icon: ShoppingBag,
    pointsFr: "1 pt / DZD",
    pointsAr: "1 نقطة / دج",
    labelFr: "Achats",
    labelAr: "المشتريات",
  },
  {
    icon: Heart,
    pointsFr: "+10 pts",
    pointsAr: "+10 نقاط",
    labelFr: "Ajout wishlist",
    labelAr: "إضافة للمفضلة",
  },
  {
    icon: ShoppingBag,
    pointsFr: "+50 pts",
    pointsAr: "+50 نقطة",
    labelFr: "Achat wishlist",
    labelAr: "شراء من المفضلة",
  },
  {
    icon: MessageCircle,
    pointsFr: "+20 pts",
    pointsAr: "+20 نقطة",
    labelFr: "Partage WhatsApp",
    labelAr: "مشاركة واتساب",
  },
  {
    icon: Camera,
    pointsFr: "+150 pts",
    pointsAr: "+150 نقطة",
    labelFr: "Avis avec photo",
    labelAr: "تقييم بصورة",
  },
  {
    icon: Mail,
    pointsFr: "+50 pts",
    pointsAr: "+50 نقطة",
    labelFr: "Newsletter",
    labelAr: "النشرة البريدية",
  },
  {
    icon: Cake,
    pointsFr: "+2 000 pts",
    pointsAr: "+2,000 نقطة",
    labelFr: "Anniversaire",
    labelAr: "عيد الميلاد",
  },
  {
    icon: Gift,
    pointsFr: "+100 pts",
    pointsAr: "+100 نقطة",
    labelFr: "Inscription",
    labelAr: "التسجيل",
  },
];

const VIP_TIERS = [
  {
    name: "Silver",
    icon: Star,
    thresholdFr: "0 pts",
    thresholdAr: "0 نقطة",
    headerBg: "bg-gradient-to-br from-[#f5f0eb] to-[#e8e0d8]",
    headerText: "text-harp-brown",
    thresholdText: "text-harp-caramel",
    cardBorder: "border-[#e8e0d8]",
    iconBg: "bg-harp-brown/10",
    iconColor: "text-harp-brown",
    checkColor: "text-harp-caramel",
    benefitsFr: ["Acc\u00e8s standard", "Cumul de points sur chaque achat"],
    benefitsAr: ["وصول عادي", "تجميع النقاط على كل عملية شراء"],
  },
  {
    name: "Gold",
    icon: Crown,
    thresholdFr: "50 000 pts",
    thresholdAr: "50,000 نقطة",
    headerBg: "bg-gradient-to-br from-[#c9a96e] to-[#a07d4a]",
    headerText: "text-white",
    thresholdText: "text-white/80",
    cardBorder: "border-[#c9a96e]/40",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    checkColor: "text-[#a07d4a]",
    benefitsFr: [
      "Multiplicateur x1.2",
      "Livraison gratuite > 5 000 DA",
      "Acc\u00e8s ventes priv\u00e9es",
    ],
    benefitsAr: ["مضاعف x1.2", "توصيل مجاني > 5,000 دج", "وصول للعروض الخاصة"],
  },
  {
    name: "Black",
    icon: Crown,
    thresholdFr: "150 000 pts",
    thresholdAr: "150,000 نقطة",
    headerBg: "bg-gradient-to-br from-[#2a2420] to-[#1a1410]",
    headerText: "text-white",
    thresholdText: "text-white/70",
    cardBorder: "border-[#3a3430]",
    iconBg: "bg-white/10",
    iconColor: "text-[#c9a96e]",
    checkColor: "text-harp-brown",
    benefitsFr: [
      "Multiplicateur x1.5",
      "Livraison gratuite illimit\u00e9e",
      "Cadeau surprise",
    ],
    benefitsAr: ["مضاعف x1.5", "توصيل مجاني بدون حد أدنى", "هدية مفاجئة"],
  },
];

export function LoyaltySection() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section
      className="py-24 bg-gradient-to-b from-harp-cream to-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-3 block">
            {t("home.loyalty.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown mb-4">
            {t("home.loyalty.title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("home.loyalty.desc")}
          </p>
        </div>

        {/* How to Earn Points */}
        <div className="mb-16">
          <h3 className="text-lg font-semibold text-harp-brown mb-6 text-center">
            {t("home.loyalty.earnTitle")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {EARN_WAYS.map((way, i) => {
              const Icon = way.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:border-harp-caramel/30 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 mx-auto bg-harp-brown/10 rounded-full flex items-center justify-center mb-3">
                    <Icon size={18} className="text-harp-brown" />
                  </div>
                  <p className="text-sm font-bold text-harp-brown mb-1">
                    {isAr ? way.pointsAr : way.pointsFr}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAr ? way.labelAr : way.labelFr}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* VIP Tiers */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-harp-brown mb-6 text-center">
            {t("home.loyalty.vipTitle")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {VIP_TIERS.map((tier, index) => {
              const Icon = tier.icon;
              const benefits = isAr ? tier.benefitsAr : tier.benefitsFr;
              return (
                <div
                  key={tier.name}
                  className={`group relative rounded-2xl overflow-hidden border ${tier.cardBorder} transition-all duration-500 hover:shadow-xl hover:-translate-y-1`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Header */}
                  <div className={`${tier.headerBg} px-6 py-8 text-center relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                    <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />

                    <div className={`w-12 h-12 mx-auto rounded-full ${tier.iconBg} flex items-center justify-center mb-4 relative`}>
                      <Icon size={22} className={tier.iconColor} />
                    </div>
                    <h4 className={`text-2xl font-serif font-bold ${tier.headerText} tracking-wide`}>
                      {tier.name}
                    </h4>
                    <p className={`text-sm mt-2 ${tier.thresholdText} font-medium tracking-wider uppercase`}>
                      {isAr ? tier.thresholdAr : tier.thresholdFr}
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="bg-white px-6 py-6">
                    <ul className="space-y-3">
                      {benefits.map((b, j) => (
                        <li
                          key={j}
                          className="flex items-center gap-3 text-sm text-gray-600"
                        >
                          <span className={`w-5 h-5 rounded-full ${tier.checkColor} bg-current/10 flex items-center justify-center shrink-0`}>
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-current">
                              <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                          <span className="font-medium text-gray-700">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/loyalty"
            className="inline-block bg-harp-brown text-white px-10 py-4 text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-harp-caramel transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            {t("home.loyalty.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
