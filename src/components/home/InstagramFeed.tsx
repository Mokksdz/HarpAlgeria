"use client";

import { Instagram } from "lucide-react";

const INSTAGRAM_POSTS = [
  { gradient: "from-harp-brown/20 to-harp-cream" },
  { gradient: "from-harp-caramel/30 to-harp-sand" },
  { gradient: "from-harp-cream to-harp-brown/10" },
  { gradient: "from-harp-sand to-harp-caramel/20" },
  { gradient: "from-harp-brown/10 to-harp-cream" },
  { gradient: "from-harp-caramel/20 to-harp-sand" },
];

export function InstagramFeed() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-harp-caramel mb-3 block">
            @harp_algeria
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-medium text-harp-brown mb-4">
            Rejoignez la communauté
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Partagez vos looks avec #HarpAlgeria et inspirez d&apos;autres
            femmes élégantes
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-8">
          {INSTAGRAM_POSTS.map((post, i) => (
            <a
              key={i}
              href="https://instagram.com/harp_algeria"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${post.gradient}`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Instagram
                  size={24}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </a>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://instagram.com/harp_algeria"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-harp-brown hover:text-harp-caramel transition-colors uppercase tracking-widest"
          >
            <Instagram size={18} />
            Suivez-nous sur Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
