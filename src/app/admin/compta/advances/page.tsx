"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Clock, CheckCircle, ArrowRight, Wallet } from "lucide-react";

interface Advance {
  id: string;
  advanceNumber: string;
  supplier: { id: string; name: string; code: string };
  amount: number;
  amountUsed: number;
  amountRemaining: number;
  status: string;
  paymentMethod: string;
  paymentDate: string;
}

interface Stats {
  totalAdvances: number;
  totalUsed: number;
  totalRemaining: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Non utilisée", color: "bg-gray-100 text-gray-700" },
  PARTIAL: { label: "Partielle", color: "bg-yellow-100 text-yellow-700" },
  APPLIED: { label: "Utilisée", color: "bg-green-100 text-green-700" },
  REFUNDED: { label: "Remboursée", color: "bg-blue-100 text-blue-700" },
};

const paymentLabels: Record<string, string> = {
  CASH: "Espèces",
  CHECK: "Chèque",
  TRANSFER: "Virement",
  CCP: "CCP",
  CARD: "Carte",
};

export default function AdvancesPage() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAdvances();
  }, [filter]);

  async function fetchAdvances() {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/v3/compta/advances?${params}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setAdvances(data.items);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat("fr-DZ").format(n) + " DZD";
  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif">Avances Fournisseurs</h1>
          <p className="text-sm text-slate-600">Gestion des avances et applications</p>
        </div>
        <Link
          href="/admin/compta/advances/new"
          className="flex items-center gap-2 bg-harp-brown text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          <Plus size={18} /> Nouvelle Avance
        </Link>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Wallet size={16} /> Total Avances
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.totalAdvances)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <CheckCircle size={16} /> Utilisé
            </div>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.totalUsed)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Clock size={16} /> Disponible
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRemaining)}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2">
        {["", "PENDING", "PARTIAL", "APPLIED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filter === s ? "bg-harp-brown text-white" : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {s === "" ? "Toutes" : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : advances.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Aucune avance trouvée</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">N° Avance</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-right">Utilisé</th>
                <th className="px-4 py-3 text-right">Restant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {advances.map((a) => {
                const status = statusConfig[a.status] || statusConfig.PENDING;
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{a.advanceNumber}</td>
                    <td className="px-4 py-3">
                      <div>{a.supplier.name}</div>
                      <div className="text-xs text-slate-500">{a.supplier.code}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(a.amount)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(a.amountUsed)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {formatCurrency(a.amountRemaining)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{paymentLabels[a.paymentMethod] || a.paymentMethod}</div>
                      <div className="text-xs text-slate-500">{formatDate(a.paymentDate)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {a.amountRemaining > 0 && (
                        <Link
                          href={`/admin/compta/advances/${a.id}/apply`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                          Appliquer <ArrowRight size={12} />
                        </Link>
                      )}
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
