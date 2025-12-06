"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Factory,
  Wallet,
  FileText,
  Boxes,
  Receipt,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  { href: "/admin/compta", label: "Vue d'ensemble", icon: BarChart3 },
  { href: "/admin/compta/stock", label: "Inventaire", icon: Boxes },
  { href: "/admin/compta/purchases", label: "Achats", icon: ShoppingCart },
  { href: "/admin/compta/production", label: "Production", icon: Factory },
  { href: "/admin/compta/models", label: "Modèles", icon: FileText },
  { href: "/admin/compta/charges", label: "Charges", icon: Receipt },
  { href: "/admin/compta/advances", label: "Avances", icon: Wallet },
  { href: "/admin/compta/reports", label: "Rapports", icon: BarChart3 },
];

export default function AdminComptaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      {/* Sub-navigation moderne - Style Notion/Figma */}
      <div className="relative border-b border-gray-100">
        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 pb-1">
          <nav className="flex items-center gap-1 min-w-max">
            {modules.map((m) => {
              const isActive = pathname === m.href;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <m.icon size={16} className={isActive ? "text-white" : "text-gray-400"} />
                  <span>{m.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Fade indicators for scroll */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
      </div>
      
      {children}
    </div>
  );
}
