"use client";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstallmentBadgeProps {
  price: number;
  className?: string;
}

export function InstallmentBadge({ price, className }: InstallmentBadgeProps) {
  if (price < 3000) return null;

  const installment = Math.ceil(price / 3);

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-harp-brown/80 bg-harp-sand/30 px-3 py-2 rounded-lg border border-harp-sand/50",
        className,
      )}
    >
      <CreditCard size={16} className="text-harp-caramel shrink-0" />
      <span>
        Ou payez en{" "}
        <strong className="text-harp-brown">
          3x {installment.toLocaleString()} DZD
        </strong>{" "}
        sans frais
      </span>
    </div>
  );
}
