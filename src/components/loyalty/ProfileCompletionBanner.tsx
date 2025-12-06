"use client";

import { useState } from "react";
import { Gift, Calendar, Phone, Check, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { algerianPhoneRegex } from "@/lib/validations/profile";

interface ProfileCompletionBannerProps {
  initialName?: string | null;
  initialPhone?: string | null;
  initialBirthDate?: string | null;
}

export function ProfileCompletionBanner({
  initialName,
  initialPhone,
  initialBirthDate,
}: ProfileCompletionBannerProps) {
  const [name, setName] = useState(initialName || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [birthDate, setBirthDate] = useState(
    initialBirthDate ? initialBirthDate.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProfileComplete =
    !!initialName && !!initialPhone && !!initialBirthDate;

  // Calculate days until next birthday
  const getDaysUntilBirthday = () => {
    const date = initialBirthDate || birthDate;
    if (!date) return null;
    const dob = new Date(date);
    const today = new Date();
    const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) next.setFullYear(next.getFullYear() + 1);
    return Math.ceil(
      (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  };

  // Phone input handler - only allow digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Remove non-digits
    setPhone(val.slice(0, 10)); // Limit to 10 digits
  };

  // Validate phone
  const isPhoneValid = !phone || algerianPhoneRegex.test(phone);

  async function saveProfile() {
    if (!birthDate) {
      setError("Veuillez renseigner votre date de naissance");
      return;
    }

    if (phone && !algerianPhoneRegex.test(phone)) {
      setError("Le numéro doit contenir 10 chiffres (ex: 0551234567)");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/v3/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          phone: phone || undefined,
          birthDate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        // Reload page to update state
        window.location.reload();
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const daysUntil = getDaysUntilBirthday();

  // Profile is complete - show birthday countdown
  if (isProfileComplete && daysUntil !== null) {
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

  // Profile incomplete - show form
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
          <Gift className="text-amber-600" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-serif font-semibold text-harp-brown text-lg">
            🎁 Complétez votre profil — Gagnez 5 000 points !
          </h3>
          <p className="text-sm text-gray-600 mt-1 mb-4">
            Renseignez vos informations et recevez <strong>5 000 points</strong>{" "}
            le jour de votre anniversaire.
          </p>

          <div className="grid sm:grid-cols-3 gap-3">
            {/* Name */}
            {!initialName && (
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-harp-brown/20 focus:border-harp-brown"
                />
              </div>
            )}

            {/* Phone */}
            {!initialPhone && (
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="0551234567"
                  maxLength={10}
                  pattern="^0[1-9][0-9]{8}$"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-harp-brown/20",
                    phone && !isPhoneValid
                      ? "border-red-300 focus:border-red-400"
                      : "border-gray-200 focus:border-harp-brown",
                  )}
                />
              </div>
            )}

            {/* Birthday */}
            {!initialBirthDate && (
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-harp-brown/20 focus:border-harp-brown"
                />
              </div>
            )}
          </div>

          {/* Phone format hint */}
          {!initialPhone && phone && !isPhoneValid && (
            <p className="text-xs text-red-500 mt-2">
              Format: 10 chiffres commençant par 0 (ex: 0551234567)
            </p>
          )}

          {/* Save button */}
          <div className="mt-4">
            <button
              onClick={saveProfile}
              disabled={
                saving || !birthDate || (phone.length > 0 && !isPhoneValid)
              }
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                saving || !birthDate || (phone.length > 0 && !isPhoneValid)
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
                "Enregistrer mes informations"
              )}
            </button>
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
