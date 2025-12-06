"use client";

import { useEffect, useState } from "react";
import { promoTexts } from "@/lib/promo-texts";

interface PromoBannerProps {
  lang?: "fr" | "ar";
}

export default function PromoBanner({ lang = "fr" }: PromoBannerProps) {
  const [isPromoEnabled, setIsPromoEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setIsPromoEnabled(data.freeShippingPromoEnabled ?? false);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading || !isPromoEnabled) return null;

  const bannerText = promoTexts.banner[lang][0]; // Version 1

  return (
    <div
      className="bg-gradient-to-r from-green-600 to-green-500 text-white py-2.5 px-4 text-center"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <p className="text-sm font-medium tracking-wide">{bannerText}</p>
    </div>
  );
}
