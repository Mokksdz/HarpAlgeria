"use client";

import { useState, useEffect } from "react";
import { Truck, Loader2, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteSettings {
  id: string;
  freeShippingPromoEnabled: boolean;
  promoCountdownEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = async (field: keyof SiteSettings, enabled: boolean) => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: enabled }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setMessage({
          type: "success",
          text: enabled
            ? "Paramètre activé !"
            : "Paramètre désactivé.",
        });
      } else {
        throw new Error();
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Paramètres
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Configuration générale de votre boutique
        </p>
      </div>

      {message && (
        <div
          className={cn(
            "p-4 rounded-xl text-sm font-medium border flex items-center gap-2 animate-in slide-in-from-top-2",
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100",
          )}
        >
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              message.type === "success" ? "bg-emerald-500" : "bg-red-500",
            )}
          />
          {message.text}
        </div>
      )}

      {/* Promo Livraison Gratuite */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Truck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Promo Livraison Gratuite
              </h2>
              <p className="text-sm text-gray-500">
                Activez une offre promotionnelle pour la livraison gratuite
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                Activer la promotion
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Affiche une bannière "Livraison offerte" sur tout le site
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.freeShippingPromoEnabled ?? false}
                onChange={(e) => handleToggle("freeShippingPromoEnabled", e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Prévisualisation */}
          {settings?.freeShippingPromoEnabled && (
            <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 animate-in fade-in duration-300">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
                Prévisualisation
              </p>

              <div className="bg-gray-900 text-white py-3 px-4 rounded-lg text-center shadow-sm max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <Zap size={14} className="text-emerald-400 fill-current" />
                  <p className="text-sm font-medium tracking-wide">
                    Livraison offerte · Du jeudi soir au samedi soir
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Cette bannière s'affichera en haut de toutes les pages
              </p>
            </div>
          )}

          {/* Textes de la promo */}
          {settings?.freeShippingPromoEnabled && (
            <div className="animate-in slide-in-from-top-4 duration-300 delay-100">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">
                Fonctionnalités actives
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Bannière promotionnelle (FR + AR)",
                  "Badge 'Livraison offerte' sur les produits",
                  "Message incitatif dans le panier",
                  "Réduction automatique au checkout",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100/50"
                  >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm ring-2 ring-emerald-100" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Promo Countdown Toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Compte à rebours promo
              </h2>
              <p className="text-sm text-gray-500">
                Affiche &quot;Offre expire dans 02j 5h 40m&quot; sur les produits en promotion
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                Activer le compte à rebours
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Affiche un compteur sur les produits ayant une date de fin de promo
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.promoCountdownEnabled ?? true}
                onChange={(e) => handleToggle("promoCountdownEnabled", e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {settings?.promoCountdownEnabled && (
            <div className="mt-6 bg-gray-50/50 rounded-xl p-6 border border-gray-100 animate-in fade-in duration-300">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
                Prévisualisation
              </p>
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-harp-sand/40 text-harp-caramel">
                  <Clock size={14} className="text-harp-caramel" />
                  <span>Offre expire dans 02j 5h 40m</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Ce compteur apparaîtra sur chaque produit ayant une promo avec date de fin
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
