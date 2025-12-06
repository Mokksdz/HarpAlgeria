"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: { id: string; name: string; code: string };
  totalAmount: number;
  amountDue: number;
  status: string;
  createdAt: string;
  items: Array<{ id: string }>;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  DRAFT: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
  ORDERED: {
    label: "Commandé",
    color: "bg-blue-100 text-blue-700",
    icon: Package,
  },
  PARTIAL: {
    label: "Partiel",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertCircle,
  },
  RECEIVED: {
    label: "Reçu",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchPurchases();
  }, [filter]);

  async function fetchPurchases() {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/v3/compta/purchases?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setPurchases(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ", { style: "decimal" }).format(n) + " DZD";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif">Achats Fournisseurs</h1>
          <p className="text-sm text-slate-600">
            Gestion des commandes et réceptions
          </p>
        </div>
        <Link
          href="/admin/compta/purchases/new"
          className="flex items-center gap-2 bg-harp-brown text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          <Plus size={18} /> Nouvel Achat
        </Link>
      </header>

      {/* Filtres */}
      <div className="flex gap-2">
        {["", "DRAFT", "ORDERED", "PARTIAL", "RECEIVED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === s
                ? "bg-harp-brown text-white"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {s === "" ? "Tous" : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : purchases.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun achat trouvé
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">N° Achat</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purchases.map((p) => {
                const status = statusConfig[p.status] || statusConfig.DRAFT;
                const StatusIcon = status.icon;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      {p.purchaseNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div>{p.supplier.name}</div>
                      <div className="text-xs text-slate-500">
                        {p.supplier.code}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{formatCurrency(p.totalAmount)}</div>
                      {p.amountDue > 0 && (
                        <div className="text-xs text-orange-600">
                          Dû: {formatCurrency(p.amountDue)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}
                      >
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/compta/purchases/${p.id}`}
                          className="p-1.5 rounded hover:bg-slate-100"
                          title="Voir"
                        >
                          <Eye size={16} />
                        </Link>
                        {(p.status === "ORDERED" || p.status === "PARTIAL") && (
                          <Link
                            href={`/admin/compta/purchases/${p.id}/receive`}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                          >
                            Recevoir
                          </Link>
                        )}
                      </div>
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
