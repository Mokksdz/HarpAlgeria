"use client";

import { useState } from "react";
import { Bell, Check, Loader2, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackInStockAlertProps {
  productId: string;
  productName: string;
  size?: string;
  color?: string;
  className?: string;
}

export function BackInStockAlert({
  productId,
  productName,
  size,
  color,
  className,
}: BackInStockAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"email" | "phone">("phone");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          email: method === "email" ? email : undefined,
          phone: method === "phone" ? phone : undefined,
          size,
          color,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Une erreur est survenue");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={cn(
          "bg-green-50 border border-green-200 rounded-xl p-4",
          className,
        )}
      >
        <div className="flex items-center gap-3 text-green-700">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check size={20} />
          </div>
          <div>
            <p className="font-medium">Alerte créée !</p>
            <p className="text-sm text-green-600">
              Vous serez notifié(e) dès que ce produit sera disponible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-amber-50 border border-amber-200 rounded-xl p-4",
        className,
      )}
    >
      {!isOpen ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Bell size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">Produit épuisé</p>
              <p className="text-sm text-amber-600">
                Ce produit est temporairement indisponible
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            M'alerter
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={20} className="text-amber-600" />
            <p className="font-medium text-amber-800">
              Recevoir une alerte pour "{productName}"
            </p>
          </div>

          {/* Method selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                method === "phone"
                  ? "bg-amber-600 text-white"
                  : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50",
              )}
            >
              <Phone size={16} />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                method === "email"
                  ? "bg-amber-600 text-white"
                  : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50",
              )}
            >
              <Mail size={16} />
              Email
            </button>
          </div>

          {/* Input */}
          {method === "phone" ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0550 12 34 56"
              className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          ) : (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 px-4 border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Bell size={18} />
                  Créer l'alerte
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
