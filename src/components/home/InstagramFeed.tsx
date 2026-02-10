"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Instagram } from "lucide-react";

interface InstaProduct {
  id: string;
  images: string;
}

export function InstagramFeed() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/products?pageSize=6&isActive=true")
      .then((res) => res.json())
      .then((data) => {
        const products: InstaProduct[] = Array.isArray(data)
          ? data
          : data.items || [];
        const imgs: string[] = [];
        for (const p of products) {
          try {
            const parsed =
              typeof p.images === "string" ? JSON.parse(p.images) : p.images;
            if (Array.isArray(parsed) && parsed.length > 0) {
              imgs.push(parsed[0]);
            }
          } catch {
            // skip
          }
          if (imgs.length >= 6) break;
        }
        setImages(imgs);
      })
      .catch(() => {});
  }, []);

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
          {(images.length > 0 ? images : Array(6).fill(null)).map(
            (img, i) => (
              <a
                key={i}
                href="https://instagram.com/harp_algeria"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-harp-brown/20 to-harp-cream"
              >
                {img ? (
                  <Image
                    src={img}
                    alt={`Harp Algeria ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-harp-brown/20 to-harp-cream" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Instagram
                    size={24}
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </a>
            ),
          )}
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
