"use client";

import { useState, useEffect } from "react";
import { Gift, Star, Award, ChevronRight, Loader2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoyaltyConfig {
    pointsPerDinar: number;
    redeemThreshold: number;
    redeemValue: number;
    birthdayBonus: number;
    reviewBonus: number;
    firstOrderBonus: number;
}

interface Customer {
    id: string;
    phone: string;
    name?: string;
    points: number;
    totalSpent: number;
    totalOrders: number;
    redeemablePoints: number;
    redeemableValue: number;
}

interface LoyaltyWidgetProps {
    phone?: string;
    className?: string;
    onPointsRedeemed?: (discount: number) => void;
}

export function LoyaltyWidget({ phone: initialPhone, className, onPointsRedeemed }: LoyaltyWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState(initialPhone || "");
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [config, setConfig] = useState<LoyaltyConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const checkLoyalty = async (phoneNumber: string) => {
        if (!phoneNumber || phoneNumber.length < 10) return;
        
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/loyalty?phone=${encodeURIComponent(phoneNumber)}`);
            const data = await res.json();

            if (res.ok) {
                setConfig(data.config);
                if (data.exists) {
                    setCustomer(data.customer);
                } else {
                    setCustomer(null);
                }
            }
        } catch {
            setError("Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async () => {
        if (!customer || customer.redeemablePoints < (config?.redeemThreshold || 2000)) return;

        setLoading(true);
        try {
            const res = await fetch("/api/loyalty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: customer.phone,
                    action: "REDEEM",
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setCustomer(data.customer);
                if (onPointsRedeemed) {
                    const discount = (config?.redeemThreshold || 2000) / (config?.redeemThreshold || 2000) * (config?.redeemValue || 200);
                    onPointsRedeemed(discount);
                }
            }
        } catch {
            setError("Erreur lors de la conversion");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialPhone) {
            checkLoyalty(initialPhone);
        }
    }, [initialPhone]);

    // Mini badge (closed state)
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-24 right-4 z-40 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group",
                    className
                )}
            >
                <Gift size={20} />
                <span className="font-medium">Programme Fidélité</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        );
    }

    // Full widget (open state)
    return (
        <div className={cn(
            "fixed bottom-24 right-4 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Gift size={20} />
                        <span className="font-semibold">Programme Fidélité</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-white/80">
                    Gagnez des points à chaque commande !
                </p>
            </div>

            <div className="p-4">
                {/* Phone input */}
                {!customer && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Votre numéro de téléphone
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0550 12 34 56"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <button
                                onClick={() => checkLoyalty(phone)}
                                disabled={loading || phone.length < 10}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : "Vérifier"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Customer info */}
                {customer && (
                    <div className="space-y-4">
                        {/* Points balance */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Star size={20} className="text-amber-500" />
                                <span className="text-3xl font-bold text-amber-600">{customer.points.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-600">points disponibles</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
                                <p className="text-xs text-gray-500">Commandes</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <p className="text-lg font-bold text-gray-900">{customer.totalSpent.toLocaleString()}</p>
                                <p className="text-xs text-gray-500">DZD dépensés</p>
                            </div>
                        </div>

                        {/* Redeem section */}
                        {customer.redeemablePoints >= (config?.redeemThreshold || 2000) ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={18} className="text-green-600" />
                                    <span className="font-medium text-green-800">Récompense disponible !</span>
                                </div>
                                <p className="text-sm text-green-700 mb-3">
                                    Convertissez {config?.redeemThreshold || 2000} points en {config?.redeemValue || 200} DZD de réduction
                                </p>
                                <button
                                    onClick={handleRedeem}
                                    disabled={loading}
                                    className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Conversion..." : "Utiliser mes points"}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-600">
                                    Plus que <strong>{((config?.redeemThreshold || 2000) - customer.points).toLocaleString()} points</strong> pour débloquer une réduction de {config?.redeemValue || 200} DZD
                                </p>
                                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, (customer.points / (config?.redeemThreshold || 2000)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Change account */}
                        <button
                            onClick={() => setCustomer(null)}
                            className="w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                            Changer de compte
                        </button>
                    </div>
                )}

                {/* How it works */}
                {!customer && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Comment ça marche ?</p>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                                <Award size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-gray-600">1 DZD = 1 point sur chaque commande</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Gift size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-gray-600">2000 points = 200 DZD de réduction</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <Star size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-gray-600">Bonus anniversaire + premier achat</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-red-600 text-sm mt-2">{error}</p>
                )}
            </div>
        </div>
    );
}
