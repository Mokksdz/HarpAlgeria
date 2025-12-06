"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Camera,
  Megaphone,
  Truck,
  Users,
  MoreHorizontal,
} from "lucide-react";

interface Charge {
  id: string;
  chargeNumber: string;
  category: string;
  scope: string;
  amount: number;
  description: string;
  model?: { id: string; sku: string; name: string };
  date: string;
  platform?: string;
}

interface CategoryStat {
  category: string;
  _sum: { amount: number };
  _count: number;
}

const categoryConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  ATELIER: {
    label: "Atelier",
    color: "bg-purple-100 text-purple-700",
    icon: Users,
  },
  SHOOTING: {
    label: "Shooting",
    color: "bg-pink-100 text-pink-700",
    icon: Camera,
  },
  ADS: {
    label: "Publicité",
    color: "bg-blue-100 text-blue-700",
    icon: Megaphone,
  },
  INFLUENCER: {
    label: "Influenceur",
    color: "bg-orange-100 text-orange-700",
    icon: TrendingUp,
  },
  TRANSPORT: {
    label: "Transport",
    color: "bg-green-100 text-green-700",
    icon: Truck,
  },
  OTHER: {
    label: "Autre",
    color: "bg-gray-100 text-gray-700",
    icon: MoreHorizontal,
  },
};

const scopeLabels: Record<string, string> = {
  GLOBAL: "Global",
  COLLECTION: "Collection",
  MODEL: "Modèle",
};

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchCharges();
  }, [categoryFilter]);

  async function fetchCharges() {
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/v3/compta/charges?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setCharges(data.items);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  const totalCharges = stats.reduce((sum, s) => sum + (s._sum.amount || 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif">Charges</h1>
          <p className="text-sm text-slate-600">
            Gestion des charges et allocations
          </p>
        </div>
        <Link
          href="/admin/compta/charges/new"
          className="flex items-center gap-2 bg-harp-brown text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          <Plus size={18} /> Nouvelle Charge
        </Link>
      </header>

      {/* Stats par catégorie */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(categoryConfig).map(([key, cfg]) => {
          const stat = stats.find((s) => s.category === key);
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() =>
                setCategoryFilter(categoryFilter === key ? "" : key)
              }
              className={`p-3 rounded-xl text-left transition-all ${
                categoryFilter === key ? "ring-2 ring-harp-brown" : ""
              } ${cfg.color}`}
            >
              <Icon size={18} className="mb-1" />
              <p className="text-xs font-medium">{cfg.label}</p>
              <p className="text-sm font-bold">
                {formatCurrency(stat?._sum.amount || 0)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Total */}
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
        <span className="text-slate-600">Total des charges</span>
        <span className="text-2xl font-bold">
          {formatCurrency(totalCharges)}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : charges.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucune charge trouvée
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">N° Charge</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {charges.map((c) => {
                const cat = categoryConfig[c.category] || categoryConfig.OTHER;
                const CatIcon = cat.icon;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.chargeNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${cat.color}`}
                      >
                        <CatIcon size={12} /> {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate">{c.description}</div>
                      {c.model && (
                        <div className="text-xs text-slate-500">
                          {c.model.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {scopeLabels[c.scope] || c.scope}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(c.date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
