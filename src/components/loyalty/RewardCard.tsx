"use client";

import { Gift, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardCardProps {
  reward: {
    id: string;
    nameFr: string;
    descriptionFr?: string;
    cost: number;
  };
  userBalance: number;
  onRedeem: (id: string) => void;
}

export function RewardCard({ reward, userBalance, onRedeem }: RewardCardProps) {
  const canAfford = userBalance >= reward.cost;

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-harp-gold transition-all group bg-white">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900">{reward.nameFr}</h4>
        <span className="bg-harp-beige text-harp-brown text-xs font-bold px-2 py-1 rounded-lg">
          {reward.cost} pts
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4 min-h-[2.5em]">
        {reward.descriptionFr}
      </p>

      <button
        onClick={() => onRedeem(reward.id)}
        disabled={!canAfford}
        className={cn(
          "w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
          canAfford
            ? "bg-harp-brown text-white hover:bg-harp-caramel"
            : "bg-gray-100 text-gray-400 cursor-not-allowed",
        )}
      >
        {canAfford ? (
          <>
            Obtenir <Gift size={14} />
          </>
        ) : (
          <>
            Points insuffisants <Lock size={14} />
          </>
        )}
      </button>
    </div>
  );
}
