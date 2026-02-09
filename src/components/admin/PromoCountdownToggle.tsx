"use client";

import { useState, useEffect } from "react";
import { Clock, Loader2 } from "lucide-react";

export default function PromoCountdownToggle() {
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setEnabled(data.promoCountdownEnabled ?? true);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCountdownEnabled: value }),
      });

      if (res.ok) {
        setEnabled(value);
        setMessage({
          type: "success",
          text: value
            ? "Compte à rebours activé !"
            : "Compte à rebours désactivé.",
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error();
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la mise à jour." });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">
              Compte à rebours promo
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Affiche &quot;Offre expire dans...&quot; sur les produits en
              promotion
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={saving}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
        </label>
      </div>

      {message && (
        <p
          className={`text-xs font-medium ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}

      {enabled && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
            Aperçu
          </p>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-harp-sand/40 text-harp-caramel">
              <Clock size={14} className="text-harp-caramel" />
              <span>Offre expire dans 02j 5h 40m</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
