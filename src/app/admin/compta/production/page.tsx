"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Play, CheckCircle, Clock, XCircle, Pause } from "lucide-react";

interface Batch {
  id: string;
  batchNumber: string;
  model: { id: string; sku: string; name: string };
  plannedQty: number;
  producedQty: number;
  status: string;
  materialsCost: number;
  totalCost: number;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  PLANNED: {
    label: "Planifié",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "En cours",
    color: "bg-blue-100 text-blue-700",
    icon: Play,
  },
  COMPLETED: {
    label: "Terminé",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  ON_HOLD: {
    label: "En pause",
    color: "bg-yellow-100 text-yellow-700",
    icon: Pause,
  },
};

export default function ProductionPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchBatches();
  }, [filter]);

  async function fetchBatches() {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/v3/compta/production?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setBatches(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif">Production</h1>
          <p className="text-sm text-slate-600">
            Gestion des lots de production
          </p>
        </div>
        <Link
          href="/admin/compta/production/new"
          className="flex items-center gap-2 bg-harp-brown text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          <Plus size={18} /> Nouveau Lot
        </Link>
      </header>

      {/* Filtres */}
      <div className="flex gap-2">
        {["", "PLANNED", "IN_PROGRESS", "COMPLETED"].map((s) => (
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
        ) : batches.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucun lot trouvé</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">N° Lot</th>
                <th className="px-4 py-3">Modèle</th>
                <th className="px-4 py-3 text-center">Quantité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Coût</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {batches.map((b) => {
                const status = statusConfig[b.status] || statusConfig.PLANNED;
                const StatusIcon = status.icon;
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{b.batchNumber}</td>
                    <td className="px-4 py-3">
                      <div>{b.model.name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {b.model.sku}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{b.producedQty}</span>
                      <span className="text-slate-400"> / {b.plannedQty}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}
                      >
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.totalCost > 0 ? (
                        <div>
                          <div className="font-medium">
                            {formatCurrency(b.totalCost)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatCurrency(
                              b.plannedQty > 0 ? b.totalCost / b.plannedQty : 0,
                            )}
                            /u
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(b.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/compta/production/${b.id}`}
                          className="px-2 py-1 bg-slate-100 rounded text-xs hover:bg-slate-200"
                        >
                          Voir
                        </Link>
                        {b.status === "PLANNED" && (
                          <Link
                            href={`/admin/compta/production/${b.id}/consume`}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                          >
                            Démarrer
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
