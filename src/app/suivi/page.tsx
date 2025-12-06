"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { 
    Search, 
    Package, 
    Truck, 
    CheckCircle2, 
    Clock, 
    MapPin,
    Phone,
    Loader2,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

interface TrackingStep {
    status: string;
    date: string;
    location?: string;
    completed: boolean;
    current: boolean;
}

interface TrackingResult {
    found: boolean;
    provider: string;
    tracking: string;
    status: string;
    customerName?: string;
    destination?: string;
    history?: TrackingStep[];
    estimatedDelivery?: string;
    error?: string;
}

export default function TrackingPage() {
    const { t } = useLanguage();
    const [trackingNumber, setTrackingNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TrackingResult | null>(null);
    const [error, setError] = useState("");

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) return;

        setLoading(true);
        setError("");
        setResult(null);

        try {
            // Determine provider from tracking number format
            const isYalidine = trackingNumber.toLowerCase().startsWith("yal-");
            const provider = isYalidine ? "yalidine" : "zrexpress";
            
            const response = await fetch(`/api/tracking?tracking=${trackingNumber}&provider=${provider}`);
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch (err) {
            setError("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes("livré") || statusLower.includes("delivered")) return "text-green-600";
        if (statusLower.includes("expédié") || statusLower.includes("transit") || statusLower.includes("sorti")) return "text-blue-600";
        if (statusLower.includes("retour") || statusLower.includes("échec") || statusLower.includes("annul")) return "text-red-600";
        return "text-amber-600";
    };

    const getStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes("livré") || statusLower.includes("delivered")) return <CheckCircle2 className="text-green-600" size={24} />;
        if (statusLower.includes("expédié") || statusLower.includes("transit") || statusLower.includes("sorti")) return <Truck className="text-blue-600" size={24} />;
        if (statusLower.includes("retour") || statusLower.includes("échec")) return <AlertCircle className="text-red-600" size={24} />;
        return <Package className="text-amber-600" size={24} />;
    };

    return (
        <div className="min-h-screen bg-white pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-2xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">
                        Suivi de Commande
                    </span>
                    <h1 className="text-3xl md:text-5xl font-serif font-medium text-gray-900 mb-6">
                        Où est mon colis ?
                    </h1>
                    <p className="text-gray-500 font-light max-w-md mx-auto">
                        Entrez votre numéro de suivi ci-dessous pour localiser votre commande en temps réel.
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleTrack} className="mb-12">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]" />
                        <div className="relative flex items-center p-2">
                            <div className="pl-6">
                                <Search size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                                placeholder="YAL-XXXXXX ou ZRXXXXXXX"
                                className="w-full pl-4 pr-4 py-4 bg-transparent border-none focus:ring-0 outline-none text-lg placeholder:text-gray-300 text-gray-900 font-medium"
                            />
                            <button
                                type="submit"
                                disabled={loading || !trackingNumber.trim()}
                                className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-harp-brown transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <ArrowRight size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Formats acceptés</p>
                        <div className="flex justify-center gap-3 text-sm text-gray-500 font-mono">
                            <span className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100">YAL-XXXXXX</span>
                            <span className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100">ZRXXXXXXX</span>
                        </div>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-8 text-center animate-fade-in">
                        <AlertCircle className="text-red-500 mx-auto mb-3" size={24} />
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                )}

                {/* Tracking Result */}
                {result && result.found && (
                    <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden animate-fade-in-up">
                        {/* Status Header */}
                        <div className="p-8 bg-gray-50 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Numéro de suivi</span>
                                        <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-[10px] uppercase tracking-wider rounded font-bold">
                                            {result.provider}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-serif font-bold text-gray-900 tracking-wide">{result.tracking}</p>
                                </div>
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                                    {getStatusIcon(result.status)}
                                </div>
                            </div>
                            
                            <div className="mt-8 flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Statut</span>
                                    <span className={`font-medium ${getStatusColor(result.status)}`}>
                                        {result.status}
                                    </span>
                                </div>
                                {result.destination && (
                                    <div className="text-right flex flex-col">
                                        <span className="text-xs text-gray-400 uppercase tracking-widest mb-1">Destination</span>
                                        <span className="font-medium text-gray-900">{result.destination}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tracking History */}
                        {result.history && result.history.length > 0 && (
                            <div className="p-8">
                                <h3 className="font-serif font-medium text-gray-900 mb-8">Historique</h3>
                                <div className="relative pl-4 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                    {result.history.map((step, index) => (
                                        <div key={index} className="relative flex gap-6">
                                            <div className={`relative z-10 w-2.5 h-2.5 rounded-full mt-2 ${
                                                step.current 
                                                    ? 'bg-gray-900 ring-4 ring-gray-100' 
                                                    : step.completed 
                                                        ? 'bg-green-500' 
                                                        : 'bg-gray-300'
                                            }`} />
                                            <div className="flex-1">
                                                <p className={`font-medium ${step.current ? 'text-gray-900 text-lg' : 'text-gray-600'}`}>
                                                    {step.status}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-1 font-light">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        {step.date}
                                                    </span>
                                                    {step.location && (
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin size={14} />
                                                            {step.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Support */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500 mb-3">
                                Un problème avec votre livraison ?
                            </p>
                            <a href="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-harp-brown transition-colors border-b border-gray-900 pb-0.5 hover:border-harp-brown">
                                Contacter le support
                            </a>
                        </div>
                    </div>
                )}

                {/* Not Found */}
                {result && !result.found && (
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-12 text-center animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6">
                            <Package size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-serif font-medium text-gray-900 mb-3">Introuvable</h3>
                        <p className="text-gray-500 font-light mb-8">
                            Nous ne trouvons pas ce numéro de suivi. Vérifiez qu'il est correct.
                        </p>
                        <Link href="/contact" className="text-gray-900 font-medium border-b border-gray-900 pb-1 hover:text-harp-brown hover:border-harp-brown transition-colors">
                            Contacter le support
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
