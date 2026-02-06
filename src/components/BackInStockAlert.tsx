"use client";

import { useState } from "react";
import { Bell, CheckCircle, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackInStockAlertProps {
  productId: string;
  size?: string;
  color?: string;
  isOutOfStock: boolean;
  className?: string;
}

export function BackInStockAlert({
  productId,
  size,
  color,
  isOutOfStock,
  className,
}: BackInStockAlertProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOutOfStock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v3/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productId, size, color }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
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
          "flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl",
          className,
        )}
      >
        <CheckCircle size={20} className="text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-700">
          Nous vous préviendrons !
        </p>
      </div>
    );
  }

  return (
    <div className={cn("mt-2", className)}>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <Bell size={14} className="text-harp-brown" />
          <span>Soyez alerté(e) du retour en stock</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harp-brown/30 focus:border-harp-brown"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="px-4 py-2.5 bg-harp-brown text-white rounded-xl text-sm font-medium hover:bg-harp-caramel transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Bell size={14} />
                Me prévenir
              </>
            )}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>
    </div>
  );
}
