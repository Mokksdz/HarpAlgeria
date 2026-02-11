"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, MessageCircle, Copy, Check } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { siteConfig } from "@/lib/config";
import { useState } from "react";

function OrderConfirmationContent() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const totalParam = searchParams.get("total");
  const wilaya = searchParams.get("wilaya");
  const [copied, setCopied] = useState(false);

  const orderRef = orderId ? orderId.slice(0, 8).toUpperCase() : null;
  const totalAmount = totalParam ? parseInt(totalParam) : null;

  // Estimate delivery based on wilaya zone
  const getEstimate = () => {
    if (!wilaya) return t("order.estimate2to5");
    const code = parseInt(wilaya);
    // Major cities — faster delivery
    if ([16, 9, 31, 25, 19, 23, 15, 6, 35, 42].includes(code)) return t("order.estimate24");
    // South / remote wilayas
    if (code >= 47) return t("order.estimate3to7");
    return t("order.estimate2to4");
  };

  const handleCopy = async () => {
    if (orderRef) {
      await navigator.clipboard.writeText(orderRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20" dir={isAr ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Animation */}
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 animate-scale-in">
            <CheckCircle2 size={40} strokeWidth={1.5} />
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 mb-4">
            {t("order.thankYou")}
          </h1>

          {/* Order Reference */}
          {orderRef && (
            <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-5 py-2 mb-4">
              <span className="text-sm text-gray-500">{t("order.ref")}</span>
              <span className="font-mono font-bold text-gray-900 tracking-wider" dir="ltr">
                {orderRef}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                aria-label={t("order.copyRef")}
              >
                {copied ? (
                  <Check size={14} className="text-green-600" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </button>
            </div>
          )}

          <p className="text-gray-500 text-lg font-light leading-relaxed mb-8">
            {t("order.thankYouDesc")}
          </p>

          {/* Order Summary Card */}
          {(totalAmount || wilaya) && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-start grid grid-cols-2 sm:grid-cols-3 gap-4">
              {totalAmount && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {t("order.total")}
                  </p>
                  <p className="text-lg font-bold text-harp-brown" dir="ltr">
                    {totalAmount.toLocaleString()} DZD
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {t("order.payment")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {t("order.paymentAtDelivery")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {t("order.estimatedDelivery")}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {getEstimate()}
                </p>
              </div>
            </div>
          )}

          {/* Next Steps Timeline */}
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 text-start mb-12">
            <h2 className="text-lg font-serif font-medium text-gray-900 mb-8 text-center">
              {t("order.nextSteps")}
            </h2>

            <div className={`space-y-8 relative before:absolute ${isAr ? "before:right-[15px]" : "before:left-[15px]"} before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200`}>
              <div className="relative flex gap-6">
                <div className="relative z-10 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <Check size={14} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {t("order.step1.title")}
                  </h3>
                  <p className="text-sm text-gray-500 font-light">
                    {t("order.step1.desc")}
                  </p>
                </div>
              </div>

              <div className="relative flex gap-6">
                <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center text-xs font-bold text-amber-500 shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {t("order.step2.title")}
                  </h3>
                  <p className="text-sm text-gray-500 font-light">
                    {t("order.step2.desc")}
                  </p>
                </div>
              </div>

              <div className="relative flex gap-6">
                <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {t("order.step3.title")}
                  </h3>
                  <p className="text-sm text-gray-500 font-light">
                    {t("order.step3.desc")}
                  </p>
                </div>
              </div>

              <div className="relative flex gap-6">
                <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {t("order.step4.title")}
                  </h3>
                  <p className="text-sm text-gray-500 font-light">
                    {t("order.step4.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/suivi"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              {t("order.trackOrder")}
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-900 px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:border-gray-900 transition-all"
            >
              {t("order.continueShopping")}
            </Link>
          </div>

          {/* Support */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-400 mb-4">{t("order.question")}</p>
            <a
              href={`https://wa.me/${siteConfig.whatsapp.number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="border-b border-gray-900 pb-0.5">
                {t("order.contactSupport")}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
