"use client";

import { useLanguage } from "@/components/LanguageProvider";
import Image from "next/image";
import Link from "next/link";
import { Award, Heart, Sparkles, ArrowRight, Quote, Truck, MapPin, Shield, CheckCircle, Star, Package } from "lucide-react";

export default function AboutPage() {
    useLanguage(); // Keep for potential future i18n

    return (
        <div className="min-h-screen bg-gradient-to-b from-harp-cream/30 to-white">
            {/* Hero Section - Minimalist */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden bg-harp-sand/30">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
                            Notre Histoire
                        </span>
                        <h1 className="text-4xl md:text-6xl font-serif font-medium text-gray-900 mb-6 leading-tight">
                            L'Élégance Intemporelle,<br/>Redéfinie.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 leading-relaxed font-light max-w-2xl mx-auto">
                            Une ode à la femme moderne qui ne choisit jamais entre pudeur et style.
                            Harp incarne une vision nouvelle de la mode algérienne.
                        </p>
                    </div>
                </div>
                
                {/* Abstract Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-harp-beige/20 rounded-full blur-3xl" />
                    <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] bg-harp-gold/5 rounded-full blur-3xl" />
                </div>
            </section>

            {/* Section 1: Origine de la marque - Asymmetrical Layout */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Text Content */}
                        <div className="lg:col-span-5 order-2 lg:order-1">
                            <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-8">
                                Une histoire de passion <br/> et d'exigence.
                            </h2>
                            
                            <div className="space-y-6 text-gray-600 font-light leading-relaxed">
                                <p>
                                    <strong className="text-gray-900 font-medium">Harp</strong> est née d'une volonté simple mais ambitieuse : 
                                    offrir aux femmes algériennes une mode qui célèbre leur identité avec raffinement.
                                </p>
                                <p>
                                    Loin de la fast-fashion, nous prenons le temps. Le temps de dessiner, de choisir, 
                                    d'ajuster. Fondée en Algérie, notre maison s'inspire de l'héritage local tout en 
                                    regardant vers l'avenir.
                                </p>
                                <p>
                                    Nos collections sont le fruit d'un savoir-faire artisanal, où chaque couture raconte 
                                    une histoire de dévouement et de précision.
                                </p>
                            </div>

                            <div className="flex gap-12 mt-12 pt-8 border-t border-gray-100">
                                <div>
                                    <p className="text-3xl font-serif font-medium text-gray-900">2024</p>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Fondation</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-serif font-medium text-gray-900">100%</p>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mt-1">Algérien</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Composition */}
                        <div className="lg:col-span-6 lg:col-start-7 order-1 lg:order-2 relative">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4 mt-12">
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                                        <Image
                                            src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80"
                                            alt="Création Harp"
                                            fill
                                            className="object-cover hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                                        <Image
                                            src="https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80"
                                            alt="Style Harp"
                                            fill
                                            className="object-cover hover:scale-105 transition-transform duration-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Vision - Clean Grid */}
            <section className="py-24 bg-[#F9F9F9]">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-6">
                            Notre Philosophie
                        </h2>
                        <p className="text-lg text-gray-500 font-light">
                            L'équilibre parfait entre esthétique contemporaine et valeurs traditionnelles.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Heart, title: "Respectueuse", desc: "Des coupes fluides et couvrantes qui subliment sans dévoiler." },
                            { icon: Sparkles, title: "Moderne", desc: "Une esthétique épurée, ancrée dans son époque." },
                            { icon: Star, title: "Exclusive", desc: "Des petites séries pour garantir l'unicité de chaque pièce." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-10 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-1 duration-300">
                                <item.icon size={24} className="text-gray-900 mb-6" />
                                <h3 className="font-serif font-medium text-xl text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed font-light">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quote Section - Minimal */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <Quote size={32} className="text-gray-300 mx-auto mb-8" />
                        <blockquote className="text-2xl md:text-4xl font-serif text-gray-900 leading-relaxed mb-8">
                            "L'élégance n'est pas une question de vêtements, c'est une attitude. 
                            Harp vous donne simplement l'assurance de l'exprimer."
                        </blockquote>
                        <cite className="text-sm uppercase tracking-widest text-gray-400 not-italic">
                            — L'Équipe Harp
                        </cite>
                    </div>
                </div>
            </section>

            {/* Section 3: Engagement Qualité - Split */}
            <section className="py-0 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-square lg:aspect-auto lg:h-full min-h-[500px]">
                         <Image
                            src="https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1200&q=80"
                            alt="Qualité Harp"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="flex items-center justify-center p-12 lg:p-24 bg-gray-50">
                        <div className="max-w-md">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
                                Notre Promesse
                            </span>
                            <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-8">
                                L'Excellence sans compromis.
                            </h2>
                            
                            <div className="space-y-8">
                                {[
                                    { title: "Matières Nobles", desc: "Sélection rigoureuse de tissus pour leur tombé et leur confort." },
                                    { title: "Finitions Artisanales", desc: "Une attention obsessionnelle portée à chaque détail." },
                                    { title: "Contrôle Qualité", desc: "Chaque pièce est minutieusement inspectée avant de vous rejoindre." }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <h4 className="text-lg font-serif font-medium text-gray-900 mb-2">{item.title}</h4>
                                        <p className="text-gray-500 font-light text-sm">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 4: Livraison - Minimal Data */}
            <section className="py-24 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                     <h2 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 mb-16">
                        Service Premium
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        {[
                            { icon: MapPin, label: "58 Wilayas", sub: "Couverture nationale" },
                            { icon: Truck, label: "24h - 72h", sub: "Livraison express" },
                            { icon: Package, label: "Suivi Live", sub: "Via nos partenaires" },
                            { icon: CheckCircle, label: "Satisfait", sub: "Ou remboursé" }
                        ].map((item, i) => (
                            <div key={i} className="group p-6">
                                <item.icon size={28} className="text-gray-900 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                                <p className="text-lg font-medium text-gray-900 mb-1">{item.label}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">{item.sub}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-16">
                        <Link
                            href="/shop"
                            className="inline-block border-b border-gray-900 pb-1 text-sm uppercase tracking-widest hover:text-gray-600 hover:border-gray-600 transition-all"
                        >
                            Découvrir nos collections
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
