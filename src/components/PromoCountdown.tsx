"use client";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoCountdownProps {
  endDate: string | Date;
  className?: string;
}

export function PromoCountdown({ endDate, className }: PromoCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) return null;

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const tl = calculateTimeLeft();
      if (!tl) clearInterval(timer);
      setTimeLeft(tl);
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  // Format based on time remaining
  const isUrgent = timeLeft.days === 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
        isUrgent
          ? "bg-harp-sand/60 text-harp-brown animate-pulse"
          : "bg-harp-sand/40 text-harp-caramel",
        className,
      )}
    >
      <Clock
        size={14}
        className={isUrgent ? "text-harp-brown" : "text-harp-caramel"}
      />
      <span>
        {isUrgent
          ? `Offre expire dans ${String(timeLeft.hours).padStart(2, "0")}:${String(timeLeft.minutes).padStart(2, "0")}:${String(timeLeft.seconds).padStart(2, "0")}`
          : `Offre expire dans ${timeLeft.days}j ${timeLeft.hours}h ${String(timeLeft.minutes).padStart(2, "0")}m`}
      </span>
    </div>
  );
}
