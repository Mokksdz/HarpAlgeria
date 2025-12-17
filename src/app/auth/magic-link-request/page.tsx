"use client";
import { useState } from "react";
import Link from "next/link";

export default function MagicLinkRequest() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const guestKey = localStorage.getItem("guest_wishlist_key") || undefined;

      const res = await fetch("/api/v3/auth/auto-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, guestKey }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Erreur de connexion.");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-4">
        <div className="bg-white p-8 max-w-md w-full shadow-sm text-center">
          <h1 className="text-2xl font-serif text-[#5C4033] mb-4">
            Vérifiez votre email
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Nous avons envoyé un lien de connexion sécurisé à{" "}
            <strong>{email}</strong>.
            <br />
            Ce lien est valide pendant 15 minutes.
          </p>
          <Link
            href="/"
            className="text-[#5C4033] border-b border-[#5C4033] pb-0.5 text-sm uppercase tracking-widest hover:text-[#8B5E3C] hover:border-[#8B5E3C] transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-4">
      <div className="bg-white p-8 max-w-md w-full shadow-sm">
        <h1 className="text-2xl font-serif text-[#5C4033] mb-2 text-center">
          Connexion
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          Accédez à votre espace personnel sans mot de passe
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 p-4 text-sm focus:outline-none focus:border-[#5C4033] transition-colors"
              placeholder="votre@email.com"
              required
            />
          </div>

          {status === "error" && (
            <div className="text-red-500 text-sm bg-red-50 p-4 border border-red-100">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#5C4033] text-white py-4 uppercase tracking-widest text-xs hover:bg-[#4A332A] transition-colors disabled:opacity-70"
          >
            {status === "loading"
              ? "Envoi en cours..."
              : "Recevoir mon lien magique"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link
            href="/admin/login"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Administration
          </Link>
        </div>
      </div>
    </div>
  );
}
