"use client";

import { useState, useEffect } from "react";
import { useCart } from "./CartProvider";
import { getWhatsAppLink } from "@/lib/config";
import { MessageCircle, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function AbandonedCartReminder() {
  const { items } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setShow(false);
      return;
    }

    const lastReminder = localStorage.getItem("harp_cart_reminder");
    if (lastReminder && Date.now() - parseInt(lastReminder) < 3600000) return; // 1 hour cooldown

    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem("harp_cart_reminder", String(Date.now()));
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [items]);

  if (!show || items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartSummary = items
    .map((i) => `${i.name} (${i.size}/${i.color}) x${i.quantity}`)
    .join("\n");
  const message = `Bonjour, je souhaite finaliser ma commande :\n\n${cartSummary}\n\nTotal: ${total.toLocaleString()} DZD`;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-50",
        "bg-white rounded-2xl shadow-2xl border border-gray-100 p-5",
        "animate-slide-up",
      )}
    >
      <button
        onClick={() => setShow(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shrink-0">
          <ShoppingBag size={18} className="text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {items.length} article{items.length > 1 ? "s" : ""} dans votre
            panier
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Finalisez votre commande avant que les stocks ne s&apos;épuisent !
          </p>
          <a
            href={getWhatsAppLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-green-700 transition-colors"
          >
            <MessageCircle size={16} />
            Commander via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
