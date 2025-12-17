"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Factory,
  Wallet,
  AlertTriangle,
  Boxes,
  Receipt,
  Plus,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  stock: { totalValue: number; totalItems: number; lowStockItems: number };
  purchases: { total: number; pending: number };
  charges: { total: number };
  production: { totalCost: number; count: number };
  advances: { remaining: number };
}

export default function ComptaPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v3/compta/reports?period=30", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d.success && setData(d))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("fr-DZ").format(n);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header avec titre + action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            Vue d'ensemble
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Activité des 30 derniers jours
          </p>
        </div>
        <Link
          href="/admin/compta/purchases/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvel achat</span>
        </Link>
      </div>

      {/* Alerte stock bas - Plus discrète */}
      {data?.stock.lowStockItems && data.stock.lowStockItems > 0 && (
        <Link
          href="/admin/compta/stock?lowStock=true"
          className="flex items-center gap-4 p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl hover:bg-amber-50 transition-all group"
        >
          <div className="p-3 bg-white border border-amber-100 text-amber-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              Stock critique détecté
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-medium text-amber-600">
                {data.stock.lowStockItems} article
                {data.stock.lowStockItems > 1 ? "s" : ""}
              </span>{" "}
              en rupture imminente
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm group-hover:border-amber-200 transition-colors">
            Gérer le stock
            <ArrowRight
              size={16}
              className="text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all"
            />
          </div>
        </Link>
      )}

      {/* KPIs compacts en grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Valeur Stock"
          value={loading ? "—" : fmt(data?.stock.totalValue || 0)}
          unit="DZD"
          sub={`${data?.stock.totalItems || 0} articles`}
          icon={Boxes}
          color="emerald"
        />
        <KpiCard
          label="Achats (30j)"
          value={loading ? "—" : fmt(data?.purchases.total || 0)}
          unit="DZD"
          sub={
            data?.purchases.pending
              ? `${data.purchases.pending} en attente`
              : "Tout réglé"
          }
          icon={ShoppingCart}
          color="blue"
          badge={data?.purchases.pending}
        />
        <KpiCard
          label="Coût Production"
          value={loading ? "—" : fmt(data?.production.totalCost || 0)}
          unit="DZD"
          sub={`${data?.production.count || 0} lots produits`}
          icon={Factory}
          color="purple"
        />
        <KpiCard
          label="Avances Dispo"
          value={loading ? "—" : fmt(data?.advances.remaining || 0)}
          unit="DZD"
          sub="Portefeuille"
          icon={Wallet}
          color="amber"
        />
      </div>

      {/* Accès rapides - Grille compacte */}
      <div className="pt-4">
        <h2 className="text-lg font-serif font-medium text-gray-900 mb-6">
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            href="/admin/compta/purchases/new"
            label="Nouvel achat"
            desc="Enregistrer une dépense"
            icon={ShoppingCart}
          />
          <QuickAction
            href="/admin/compta/production/new"
            label="Nouveau lot"
            desc="Lancer une production"
            icon={Factory}
          />
          <QuickAction
            href="/admin/compta/charges/new"
            label="Nouvelle charge"
            desc="Frais généraux"
            icon={Receipt}
          />
          <QuickAction
            href="/admin/compta/stock"
            label="Voir le stock"
            desc="Inventaire complet"
            icon={Boxes}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  color,
  badge,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  icon: React.ElementType;
  color: "emerald" | "blue" | "purple" | "amber";
  badge?: number;
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div
          className={cn(
            "p-3 rounded-xl border transition-colors",
            colors[color],
          )}
        >
          <Icon size={22} strokeWidth={1.5} />
        </div>
        {badge && badge > 0 && (
          <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {badge} Pending
          </span>
        )}
      </div>
      <div className="space-y-1 relative z-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <p className="text-2xl font-serif font-medium text-gray-900">
            {value}
          </p>
          <span className="text-xs font-medium text-gray-400 uppercase">
            {unit}
          </span>
        </div>
        {sub && <p className="text-xs text-gray-500 font-medium mt-1">{sub}</p>}
      </div>

      {/* Decorative background gradient */}
      <div
        className={cn(
          "absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-2xl",
          color === "emerald" && "bg-emerald-500",
          color === "blue" && "bg-blue-500",
          color === "purple" && "bg-purple-500",
          color === "amber" && "bg-amber-500",
        )}
      />
    </div>
  );
}

function QuickAction({
  href,
  label,
  desc,
  icon: Icon,
}: {
  href: string;
  label: string;
  desc: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-4 p-6 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-md transition-all group text-left"
    >
      <div className="p-3 bg-gray-50 rounded-xl text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div>
        <span className="block text-base font-medium text-gray-900 mb-1 group-hover:translate-x-1 transition-transform">
          {label}
        </span>
        <span className="block text-xs text-gray-500">{desc}</span>
      </div>
    </Link>
  );
}
