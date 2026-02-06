"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getWhatsAppLink } from "@/lib/config";
import { Gift, Copy, Check, MessageCircle } from "lucide-react";

interface ReferralData {
  code: string;
  discountPercent: number;
  rewardPoints: number;
  usageCount: number;
  maxUsage: number;
}

export function ReferralShare() {
  const { data: session } = useSession();
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;

    setLoading(true);
    fetch("/api/v3/referral")
      .then((res) => res.json())
      .then((data) => {
        if (data.code) setReferral(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  const handleCopy = async () => {
    if (!referral) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = referral.code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!session?.user?.email) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-12 bg-gray-200 rounded w-full" />
      </div>
    );
  }

  if (!referral) return null;

  const whatsAppMessage = `Découvrez Harp, ma marque préférée ! Utilisez mon code ${referral.code} pour obtenir -${referral.discountPercent}% sur votre première commande 🎁\n\nhttps://harpalgeria.com`;

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-harp-cream rounded-full flex items-center justify-center">
          <Gift size={20} className="text-harp-caramel" />
        </div>
        <div>
          <h3 className="font-serif font-medium text-harp-brown text-lg">
            Parrainez vos amis
          </h3>
          <p className="text-xs text-gray-500">
            Gagnez {referral.rewardPoints} pts ! Votre ami reçoit -
            {referral.discountPercent}%
          </p>
        </div>
      </div>

      <div className="bg-harp-cream/50 rounded-xl p-4 mb-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
          Votre code de parrainage
        </p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-widest text-harp-brown flex-1">
            {referral.code}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white text-harp-brown text-xs font-medium px-3 py-2 rounded-lg border border-harp-sand hover:bg-harp-sand/30 transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-600" />
                Copié !
              </>
            ) : (
              <>
                <Copy size={14} />
                Copier
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Utilisé {referral.usageCount}/{referral.maxUsage} fois
        </p>
      </div>

      <a
        href={getWhatsAppLink(whatsAppMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-green-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-green-700 transition-colors"
      >
        <MessageCircle size={18} />
        Partager via WhatsApp
      </a>
    </div>
  );
}
