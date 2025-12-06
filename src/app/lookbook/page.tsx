"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowRight, X, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

interface LookbookItem {
    id: string;
    image: string;
    caption?: string;
    productIds?: string[];
}

interface Lookbook {
    id: string;
    slug: string;
    title: string;
    description?: string;
    season?: string;
    coverImage?: string;
    items: LookbookItem[];
}

export default function LookbookPage() {
    const { t } = useLanguage();
    const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
    const [selectedLook, setSelectedLook] = useState<LookbookItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Placeholder lookbook data (will be replaced by API data)
    const placeholderLookbook: Lookbook = {
        id: "placeholder",
        slug: "printemps-2025",
        title: "Saison 01 — Printemps",
        description: "Une ode à la fluidité et à la lumière. Découvrez notre nouvelle collection inspirée des jardins andalous.",
        season: "Printemps 2025",
        coverImage: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=1600&q=90",
        items: [
            {
                id: "1",
                image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&q=85",
                caption: "Silhouette 01"
            },
            {
                id: "2",
                image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=1200&q=85",
                caption: "Silhouette 02"
            },
            {
                id: "3",
                image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85",
                caption: "Silhouette 03"
            },
            {
                id: "4",
                image: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1200&q=85",
                caption: "Silhouette 04"
            },
            {
                id: "5",
                image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=85",
                caption: "Silhouette 05"
            },
            {
                id: "6",
                image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=1200&q=85",
                caption: "Silhouette 06"
            },
        ]
    };

    useEffect(() => {
        // For now, use placeholder data
        // In production, fetch from API: /api/lookbooks
        setLookbooks([placeholderLookbook]);
        setLoading(false);
    }, []);

    const currentLookbook = lookbooks[0] || placeholderLookbook;

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Editorial */}
            <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <Image
                        src={currentLookbook.coverImage || "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=1600&q=90"}
                        alt={currentLookbook.title}
                        fill
                        className="object-cover object-center"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
                    <div className="max-w-3xl">
                        <span className="text-white text-xs font-bold uppercase tracking-[0.3em] mb-6 block">
                            Lookbook
                        </span>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white mb-8 leading-tight">
                            {currentLookbook.title}
                        </h1>
                        <p className="text-lg md:text-xl text-white/90 font-light max-w-xl mx-auto leading-relaxed">
                            {currentLookbook.description}
                        </p>
                    </div>
                </div>
            </section>

            {/* Gallery Grid - Minimalist */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                        {currentLookbook.items.map((item, index) => (
                            <div
                                key={item.id}
                                className="break-inside-avoid cursor-pointer group"
                                onClick={() => setSelectedLook(item)}
                            >
                                <div className="relative overflow-hidden mb-4">
                                    <Image
                                        src={item.image}
                                        alt={item.caption || `Look ${index + 1}`}
                                        width={800}
                                        height={1200}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs uppercase tracking-widest text-gray-900 font-medium">
                                        {item.caption}
                                    </p>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Shop CTA - Clean */}
            <section className="py-32 bg-[#F9F9F9] text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 mb-8">
                        Inspirée ?
                    </h2>
                    <Link
                        href="/shop"
                        className="inline-block border-b border-gray-900 pb-1 text-sm uppercase tracking-widest hover:text-gray-600 hover:border-gray-600 transition-all"
                    >
                        Explorer la collection
                    </Link>
                </div>
            </section>

            {/* Social - Footer Style */}
            <section className="py-20 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <a
                        href="https://www.instagram.com/harp_algeria"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-col items-center gap-4 group"
                    >
                        <Instagram size={32} className="text-gray-900" />
                        <span className="text-sm uppercase tracking-widest text-gray-900 group-hover:text-gray-600 transition-colors">
                            @harp_algeria
                        </span>
                    </a>
                </div>
            </section>

            {/* Lightbox Modal - Minimal */}
            {selectedLook && (
                <div 
                    className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                    onClick={() => setSelectedLook(null)}
                >
                    <button 
                        className="absolute top-8 right-8 text-gray-900 hover:text-gray-600 transition-colors"
                        onClick={() => setSelectedLook(null)}
                    >
                        <X size={32} strokeWidth={1} />
                    </button>
                    
                    <div className="relative max-w-5xl w-full flex flex-col items-center">
                        <div className="relative w-full max-h-[80vh] aspect-[3/4] md:aspect-auto md:h-[80vh]">
                            <Image
                                src={selectedLook.image}
                                alt={selectedLook.caption || "Look"}
                                fill
                                className="object-contain"
                            />
                        </div>
                        {selectedLook.caption && (
                            <p className="mt-8 text-sm uppercase tracking-widest text-gray-900 font-medium">
                                {selectedLook.caption}
                            </p>
                        )}
                        <Link
                            href="/shop"
                            className="mt-4 text-xs text-gray-500 hover:text-gray-900 border-b border-gray-300 hover:border-gray-900 transition-all pb-0.5"
                        >
                            Voir les produits
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
