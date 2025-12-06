"use client";

import Link from "next/link";
import { CheckCircle2, Package, ArrowRight, Clock, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { siteConfig } from "@/lib/config";

export default function OrderConfirmationPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-white pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto text-center">
                    {/* Success Animation */}
                    <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 text-green-600 animate-scale-in">
                        <CheckCircle2 size={40} strokeWidth={1.5} />
                    </div>

                    <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 mb-6">
                        Merci pour votre commande
                    </h1>

                    <p className="text-gray-500 text-lg font-light leading-relaxed mb-12">
                        Nous avons bien reçu votre commande. Un membre de notre équipe vous contactera 
                        très prochainement pour la confirmer.
                    </p>

                    {/* Next Steps Timeline */}
                    <div className="bg-gray-50 rounded-3xl p-8 md:p-12 text-left mb-12">
                        <h2 className="text-lg font-serif font-medium text-gray-900 mb-8 text-center">
                            Prochaines étapes
                        </h2>
                        
                        <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                            <div className="relative flex gap-6">
                                <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-gray-900">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">Confirmation</h3>
                                    <p className="text-sm text-gray-500 font-light">
                                        Validation téléphonique sous 24h
                                    </p>
                                </div>
                            </div>

                            <div className="relative flex gap-6">
                                <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">Expédition</h3>
                                    <p className="text-sm text-gray-500 font-light">
                                        Préparation et remise au transporteur
                                    </p>
                                </div>
                            </div>

                            <div className="relative flex gap-6">
                                <div className="relative z-10 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-1">Livraison</h3>
                                    <p className="text-sm text-gray-500 font-light">
                                        Réception à domicile ou en point relais
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/suivi"
                            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:bg-gray-800 transition-all"
                        >
                            Suivre ma commande
                        </Link>
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-900 px-8 py-4 rounded-full text-sm uppercase tracking-widest hover:border-gray-900 transition-all"
                        >
                            Continuer mes achats
                        </Link>
                    </div>

                    {/* Support */}
                    <div className="mt-16 pt-8 border-t border-gray-100">
                        <p className="text-sm text-gray-400 mb-4">Une question ?</p>
                        <a
                            href={`https://wa.me/${siteConfig.whatsapp.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-600 transition-colors"
                        >
                            <MessageCircle size={18} />
                            <span className="border-b border-gray-900 pb-0.5">Contacter le support</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
