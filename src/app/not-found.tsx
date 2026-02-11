"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, ShoppingBag, BookOpen, Sparkles } from "lucide-react";

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
          <p className="text-gray-500 mb-8 font-light">
            La page que vous recherchez a peut-être été déplacée ou n&apos;existe
            plus.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-sm mx-auto">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-full text-sm outline-none focus:ring-2 focus:ring-harp-brown/20 focus:bg-white border border-gray-200 transition-all"
              />
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 rounded-full text-sm hover:bg-harp-cream/50 hover:text-harp-brown transition-all border border-gray-100"
            >
              <ShoppingBag size={14} />
              Boutique
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 rounded-full text-sm hover:bg-harp-cream/50 hover:text-harp-brown transition-all border border-gray-100"
            >
              <Sparkles size={14} />
              Collections
            </Link>
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 rounded-full text-sm hover:bg-harp-cream/50 hover:text-harp-brown transition-all border border-gray-100"
            >
              <BookOpen size={14} />
              Journal
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-harp-brown transition-all"
          >
            Retour à l&apos;accueil
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
