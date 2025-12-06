import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a price value (number, string, or Decimal) into a DZD currency string.
 * Handles Prisma Decimal types which might be passed as objects or strings.
 */
export function formatPrice(amount: number | string | any): string {
  if (amount === null || amount === undefined) return "0 DZD";

  const value =
    typeof amount === "object" && "toNumber" in amount
      ? amount.toNumber()
      : Number(amount);

  if (isNaN(value)) return "0 DZD";

  return (
    new Intl.NumberFormat("fr-DZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value) + " DZD"
  );
}
