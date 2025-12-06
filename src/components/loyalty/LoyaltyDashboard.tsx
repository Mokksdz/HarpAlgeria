"use client";

import { useState, useEffect } from "react";
import { Crown, Gift, History, TrendingUp, Lock, Check } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface LoyaltyState {
  balance: number;
  vipLevel: "SILVER" | "GOLD" | "BLACK";
  benefits: string[];
  nextLevel: { name: string; threshold: number } | null;
  progress: number;
  history: any[];
}

import { RewardCard } from "./RewardCard";
import { ProfileCompletionBanner } from "./ProfileCompletionBanner";

export function LoyaltyDashboard() {
  const { data: session } = useSession();
  const [loyalty, setLoyalty] = useState<LoyaltyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [resLoyalty, resRewards, resProfile] = await Promise.all([
        fetch("/api/v3/loyalty/balance"),
        fetch("/api/v3/loyalty/rewards"),
        fetch("/api/v3/account/profile")
      ]);
      
      if (resLoyalty.ok) setLoyalty(await resLoyalty.json());
      if (resRewards.ok) setRewards(await resRewards.json());
      if (resProfile.ok) setUserProfile(await resProfile.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const redeem = async (rewardId: string) => {
    try {
      const res = await fetch("/api/v3/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId })
      });
      
      if (res.ok) {
        fetchData();
        alert("Récompense débloquée avec succès !");
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) {
    // ... login prompt ...
    return (
      <div className="p-8 text-center border rounded-2xl bg-gray-50">
        <Crown size={48} className="mx-auto mb-4 text-harp-gold" />
        <h2 className="text-2xl font-serif mb-2 text-harp-brown">Rejoignez HARP REWARDS</h2>
        <p className="text-gray-600 mb-6">Connectez-vous pour accéder à vos avantages exclusifs.</p>
        <a href="/login" className="inline-block bg-harp-brown text-white px-8 py-3 rounded-xl font-medium hover:bg-harp-brown/90 transition-colors">
          Se connecter
        </a>
      </div>
    );
  }

  if (loading || !loyalty) return <div className="p-12 text-center text-gray-400">Chargement de votre statut VIP...</div>;

  return (
    <div className="space-y-8">
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner 
        initialName={userProfile?.name}
        initialPhone={userProfile?.phone}
        initialBirthDate={userProfile?.birthDate}
      />

      {/* VIP Status Card - Clean Design */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Left: Status */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              loyalty.vipLevel === "BLACK" ? "bg-gray-900" : 
              loyalty.vipLevel === "GOLD" ? "bg-amber-500" : 
              "bg-harp-brown"
            )}>
              <Crown className="text-white" size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Votre statut</p>
              <h2 className="text-2xl font-serif font-bold text-harp-brown">{loyalty.vipLevel}</h2>
            </div>
          </div>
          
          {/* Right: Points */}
          <div className="text-left md:text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Points disponibles</p>
            <div className="text-4xl font-serif font-bold text-harp-brown">
              {loyalty.balance.toLocaleString()}
              <span className="text-lg text-gray-400 ml-1">pts</span>
            </div>
          </div>
        </div>

        {/* Progress to next level */}
        {loyalty.nextLevel && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-gray-500">
                Progression vers <span className="font-medium text-harp-brown">{loyalty.nextLevel.name}</span>
              </span>
              <span className="font-medium text-harp-brown">{Math.round(loyalty.progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  loyalty.vipLevel === "SILVER" ? "bg-harp-brown" :
                  loyalty.vipLevel === "GOLD" ? "bg-amber-500" : "bg-gray-900"
                )}
                style={{ width: `${Math.max(2, loyalty.progress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Plus que {(loyalty.nextLevel.threshold * (1 - loyalty.progress / 100)).toLocaleString()} points
            </p>
          </div>
        )}
      </div>

      {/* Benefits & Actions Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Benefits */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-serif text-xl text-harp-brown mb-6 flex items-center gap-2">
            <TrendingUp size={20} />
            Vos Avantages
          </h3>
          <ul className="space-y-4">
            {loyalty.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                <div className="p-1 bg-green-100 rounded-full mt-0.5 text-green-600">
                  <Check size={12} strokeWidth={3} />
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Rewards Shop */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-serif text-xl text-harp-brown mb-6 flex items-center gap-2">
            <Gift size={20} />
            Boutique Récompenses
          </h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <RewardCard 
                  key={reward.id} 
                  reward={reward} 
                  userBalance={loyalty.balance} 
                  onRedeem={redeem} 
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-400 italic">
                Aucune récompense disponible pour le moment.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-serif text-xl text-harp-brown mb-6 flex items-center gap-2">
          <History size={20} />
          Historique des points
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loyalty.history.length > 0 ? (
                loyalty.history.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.reason === "PURCHASE" && "Commande confirmée"}
                      {item.reason === "SIGNUP" && "Bienvenue chez HARP"}
                      {item.reason === "REWARD_REDEMPTION" && "Récompense débloquée"}
                      {item.reason === "WISHLIST_ADD" && "Ajout Wishlist"}
                      {!["PURCHASE", "SIGNUP", "REWARD_REDEMPTION", "WISHLIST_ADD"].includes(item.reason) && item.reason}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right font-bold font-mono",
                      item.amount > 0 ? "text-green-600" : "text-red-500"
                    )}>
                      {item.amount > 0 ? "+" : ""}{item.amount}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                    Aucun historique disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
