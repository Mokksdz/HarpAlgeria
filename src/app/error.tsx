"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-white">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full text-red-500 mb-6">
          <AlertCircle size={32} />
        </div>

        <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">
          Une erreur est survenue
        </h2>
        <p className="text-gray-500 mb-10 font-light">
          Désolé, quelque chose s'est mal passé. Veuillez réessayer.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-harp-brown transition-colors"
          >
            <RefreshCcw size={16} />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-900 px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:border-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
