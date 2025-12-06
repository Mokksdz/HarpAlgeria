"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-white">
      <div className="text-center max-w-lg">
        <h1 className="text-[120px] md:text-[180px] font-serif font-medium text-gray-900 leading-none tracking-tighter opacity-10 select-none">
          404
        </h1>

        <div className="-mt-12 relative z-10">
          <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">
            Page introuvable
          </h2>
          <p className="text-gray-500 mb-10 font-light">
            La page que vous recherchez a peut-être été déplacée ou n'existe
            plus.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-harp-brown transition-all"
          >
            Retour à l'accueil
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
