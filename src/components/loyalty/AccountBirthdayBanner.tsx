"use client";

import { useState, useEffect } from "react";
import { Gift, Calendar, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountBirthdayBannerProps {
  initialBirthDate?: string | null;
}

export function AccountBirthdayBanner({
  initialBirthDate,
}: AccountBirthdayBannerProps) {
  const [birthDate, setBirthDate] = useState(
    initialBirthDate ? initialBirthDate.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBirthDate = !!initialBirthDate;

  // Calculate days until next birthday
  const getDaysUntilBirthday = () => {
    if (!birthDate) return null;
    const dob = new Date(birthDate);
    const today = new Date();
    const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) next.setFullYear(next.getFullYear() + 1);
    return Math.ceil(
      (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  const daysUntil = getDaysUntilBirthday();

  async function saveBirthDate() {
    if (!birthDate) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v3/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (hasBirthDate && daysUntil !== null) {
    // Already has birth date - show countdown
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="text-amber-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-serif font-semibold text-harp-brown text-lg">
              Cadeau d'anniversaire
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {daysUntil === 0 ? (
                <span className="font-semibold text-amber-600">
                  🎉 C'est votre anniversaire ! Vos 5 000 points ont été
                  ajoutés.
                </span>
              ) : daysUntil === 1 ? (
                <>
                  Demain c'est votre anniversaire ! Vous recevrez{" "}
                  <strong>5 000 points</strong>.
                </>
              ) : (
                <>
                  Votre anniversaire est dans <strong>{daysUntil} jours</strong>
                  . Vous recevrez <strong>5 000 points</strong> automatiquement.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No birth date - show form
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <Gift className="text-amber-600" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-harp-brown text-lg">
            Gagnez 5 000 points !
          </h3>
          <p className="text-sm text-gray-600 mt-1 mb-4">
            Renseignez votre date de naissance et recevez{" "}
            <strong>5 000 points</strong> le jour de votre anniversaire.
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-harp-brown/20 focus:border-harp-brown"
              />
            </div>

            <button
              onClick={saveBirthDate}
              disabled={saving || !birthDate}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                saving || !birthDate
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : saved
                    ? "bg-green-500 text-white"
                    : "bg-harp-brown text-white hover:bg-harp-brown/90",
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement...
                </>
              ) : saved ? (
                <>
                  <Check size={16} />
                  Enregistré !
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
