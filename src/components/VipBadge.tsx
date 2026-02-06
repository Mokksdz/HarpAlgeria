"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, Crown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const VIP_THRESHOLDS = {
  SILVER: { next: "GOLD", threshold: 50000 },
  GOLD: { next: "BLACK", threshold: 150000 },
  BLACK: { next: null, threshold: Infinity },
};

const VIP_COLORS = {
  SILVER: "bg-gray-200 text-gray-600",
  GOLD: "bg-amber-100 text-amber-700",
  BLACK: "bg-gray-900 text-white",
};

export function VipBadge() {
  const { data: session } = useSession();
  const [data, setData] = useState<{
    balance: number;
    vipLevel: string;
    progress: number;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/v3/loyalty/balance")
      .then((r) => r.json())
      .then((d) => {
        if (d.balance !== undefined) setData(d);
      })
      .catch(() => {});
  }, [session]);

  if (!session || !data) return null;

  const level = (data.vipLevel || "SILVER") as keyof typeof VIP_COLORS;
  const Icon = level === "SILVER" ? Star : Crown;
  const colors = VIP_COLORS[level] || VIP_COLORS.SILVER;
  const threshold = VIP_THRESHOLDS[level];

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110",
          colors,
        )}
      >
        <Icon size={14} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                colors,
              )}
            >
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{level}</p>
              <p className="text-xs text-gray-500">
                {data.balance.toLocaleString()} pts
              </p>
            </div>
          </div>

          {threshold.next && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{level}</span>
                <span>{threshold.next}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-harp-brown rounded-full transition-all"
                  style={{
                    width: `${Math.min(data.progress || 0, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <Link
            href="/loyalty"
            className="flex items-center justify-between text-xs text-harp-brown hover:text-harp-caramel font-medium"
          >
            <span>Mon programme fidélité</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
