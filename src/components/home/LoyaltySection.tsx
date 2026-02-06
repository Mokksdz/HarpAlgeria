"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { Gift, Star, Crown, Truck, ShoppingBag, Heart, MessageCircle, Camera, Mail, Cake } from "lucide-react";
import Link from "next/link";

const EARN_WAYS = [
  { icon: ShoppingBag, pointsFr: "1 pt / DZD", pointsAr: "1 نقطة / دج", labelFr: "Achats", labelAr: "المشتريات" },
  { icon: Heart, pointsFr: "+10 pts", pointsAr: "+10 نقاط", labelFr: "Ajout wishlist", labelAr: "إضافة للمفضلة" },
  { icon: ShoppingBag, pointsFr: "+50 pts", pointsAr: "+50 نقطة", labelFr: "Achat wishlist", labelAr: "شراء من المفضلة" },
  { icon: MessageCircle, pointsFr: "+20 pts", pointsAr: "+20 نقطة", labelFr: "Partage WhatsApp", labelAr: "مشاركة واتساب" },
  { icon: Camera, pointsFr: "+150 pts", pointsAr: "+150 نقطة", labelFr: "Avis avec photo", labelAr: "تقييم بصورة" },
  { icon: Mail, pointsFr: "+50 pts", pointsAr: "+50 نقطة", labelFr: "Newsletter", labelAr: "النشرة البريدية" },
  { icon: Cake, pointsFr: "+2 000 pts", pointsAr: "+2,000 نقطة", labelFr: "Anniversaire", labelAr: "عيد الميلاد" },
  { icon: Gift, pointsFr: "+100 pts", pointsAr: "+100 نقطة", labelFr: "Inscription", labelAr: "التسجيل" },
];

const VIP_TIERS = [
  {
    name: "Silver",
    icon: Star,
    thresholdFr: "0 pts",
    thresholdAr: "0 نقطة",
    color: "from-gray-200 to-gray-300",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    benefitsFr: ["Accès standard", "Cumul de points sur chaque achat"],
    benefitsAr: ["وصول عادي", "تجميع النقاط على كل عملية شراء"],
  },
  {
    name: "Gold",
    icon: Crown,
    thresholdFr: "50 000 pts",
    thresholdAr: "50,000 نقطة",
    color: "from-amber-300 to-amber-500",
    textColor: "text-amber-800",
    borderColor: "border-amber-400",
    benefitsFr: ["Multiplicateur x1.2", "Livraison gratuite > 5 000 DA", "Accès ventes privées"],
    benefitsAr: ["مضاعف x1.2", "توصيل مجاني > 5,000 دج", "وصول للعروض الخاصة"],
  },
  {
    name: "Black",
    icon: Crown,
    thresholdFr: "150 000 pts",
    thresholdAr: "150,000 نقطة",
    color: "from-gray-800 to-gray-950",
    textColor: "text-white",
    borderColor: "border-gray-700",
    benefitsFr: ["Multiplicateur x1.5", "Livraison gratuite illimitée", "Cadeau surprise"],
    benefitsAr: ["مضاعف x1.5", "توصيل مجاني بدون حد أدنى", "هدية مفاجئة"],
  },
];

export function LoyaltySection() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-24 bg-gradient-to-b from-harp-cream to-white" dir={isAr ? "rtl" : "ltr"}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {VIP_TIERS.map((tier) => {
              const Icon = tier.icon;
              const benefits = isAr ? tier.benefitsAr : tier.benefitsFr;
              return (
                <div
                  key={tier.name}
                  className={`rounded-2xl overflow-hidden border ${tier.borderColor}`}
                >
                  <div className={`bg-gradient-to-br ${tier.color} p-5 text-center`}>
                    <Icon size={28} className={`mx-auto mb-2 ${tier.textColor}`} />
                    <h4 className={`text-xl font-serif font-bold ${tier.textColor}`}>
                      {tier.name}
                    </h4>
                    <p className={`text-sm mt-1 ${tier.textColor} opacity-80`}>
                      {isAr ? tier.thresholdAr : tier.thresholdFr}
                    </p>
                  </div>
                  <div className="bg-white p-5">
                    <ul className="space-y-2">
                      {benefits.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-harp-caramel mt-0.5 shrink-0">&#10003;</span>
                          {b}
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
        <div className="text-center">
          <Link
            href="/loyalty"
            className="inline-block bg-harp-brown text-white px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-harp-caramel transition-colors"
          >
            {t("home.loyalty.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
