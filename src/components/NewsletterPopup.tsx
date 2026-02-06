"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Gift, CheckCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "harp_newsletter_seen";
const EMAIL_KEY = "harp_newsletter_email";
const POPUP_DELAY_MS = 8000;
const SUCCESS_AUTO_CLOSE_MS = 3000;
const COOLDOWN_DAYS = 7;

export function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS) return;
      }
    } catch {
      // localStorage not available
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  // Focus input when popup opens
  useEffect(() => {
    if (isVisible && !isClosing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible, isClosing]);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch {
        // silent fail
      }
    }, 300);
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, close]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      localStorage.setItem(EMAIL_KEY, email.trim());
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // silent fail
    }

    setIsSubmitted(true);

    setTimeout(() => {
      close();
    }, SUCCESS_AUTO_CLOSE_MS);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        opacity: isClosing ? 0 : 1,
        transition: "opacity 0.3s ease-in-out",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Newsletter inscription"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md bg-harp-cream rounded-2xl shadow-elevated overflow-hidden",
          !isClosing && "animate-scale-in",
        )}
        style={{
          opacity: isClosing ? 0 : undefined,
          transform: isClosing ? "scale(0.95)" : undefined,
          transition: isClosing
            ? "opacity 0.3s ease-in-out, transform 0.3s ease-in-out"
            : undefined,
        }}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 p-2 rounded-full text-harp-brown/60 hover:text-harp-brown hover:bg-harp-sand/50 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        {/* Decorative top accent */}
        <div className="h-1.5 bg-gradient-to-r from-harp-brown via-harp-caramel to-harp-gold" />

        <div className="px-8 py-10 text-center">
          {!isSubmitted ? (
            <>
              {/* Icon */}
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gradient-to-br from-harp-sand to-harp-beige flex items-center justify-center">
                <Gift size={28} className="text-harp-brown" />
              </div>

              {/* Headline */}
              <h2 className="font-serif text-2xl font-bold text-harp-brown mb-2">
                Bienvenue chez Harp
              </h2>

              {/* Subtext */}
              <p className="text-harp-caramel text-sm leading-relaxed mb-6 max-w-xs mx-auto">
                Inscrivez-vous à notre newsletter et recevez{" "}
                <span className="font-semibold text-harp-brown">-5%</span> sur
                votre première commande.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-harp-caramel/60"
                  />
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className={cn(
                      "w-full pl-11 pr-4 py-3.5 rounded-xl border border-harp-sand",
                      "bg-white text-harp-brown placeholder:text-harp-caramel/40",
                      "focus:outline-none focus:ring-2 focus:ring-harp-caramel/30 focus:border-harp-caramel",
                      "text-sm transition-all",
                    )}
                  />
                </div>

                <button
                  type="submit"
                  className={cn(
                    "w-full py-3.5 rounded-full bg-harp-brown text-white font-medium",
                    "hover:bg-harp-caramel transition-colors duration-300",
                    "text-sm tracking-wide",
                  )}
                >
                  S&apos;inscrire
                </button>
              </form>

              {/* No thanks */}
              <button
                onClick={close}
                className="mt-4 text-xs text-harp-caramel/60 hover:text-harp-caramel transition-colors"
              >
                Non merci
              </button>
            </>
          ) : (
            /* Success state */
            <>
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center animate-scale-in">
                <CheckCircle size={32} className="text-green-500" />
              </div>

              <h2 className="font-serif text-2xl font-bold text-harp-brown mb-2">
                Merci !
              </h2>

              <p className="text-harp-caramel text-sm mb-4">
                Votre code de réduction :
              </p>

              <div className="inline-block px-6 py-3 bg-harp-sand/60 rounded-xl border border-harp-sand">
                <span className="font-mono font-bold text-lg text-harp-brown tracking-widest">
                  BIENVENUE5
                </span>
              </div>

              <p className="text-xs text-harp-caramel/60 mt-4">
                -5% sur votre première commande
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
