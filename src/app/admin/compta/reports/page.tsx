"use client";

import { useState, useEffect } from "react";
import { Package, ShoppingCart, Factory, Wallet, TrendingUp, AlertTriangle } from "lucide-react";

interface ReportData {
  period: { days: number; startDate: string };
  stock: {
    totalValue: number;
    totalItems: number;
    totalQuantity: number;
    lowStockItems: number;
  };
  purchases: {
    total: number;
    count: number;
    pending: number;
  };
  charges: {
    total: number;
    count: number;
    byCategory: Array<{ category: string; _sum: { amount: number } }>;
  };
  production: {
    totalCost: number;
    totalUnits: number;
    count: number;
    byStatus: Array<{ status: string; _count: number }>;
  };
  advances: {
    total: number;
    used: number;
    remaining: number;
  };
  recent: {
    purchases: Array<{
      id: string;
      purchaseNumber: string;
      totalAmount: number;
      status: string;
      supplier: { name: string };
    }>;
    batches: Array<{
      id: string;
      batchNumber: string;
      plannedQty: number;
      status: string;
      model: { name: string };
    }>;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchReport();
  }, [period]);

  async function fetchReport() {
    try {
      setLoading(true);
      const res = await fetch(`/api/v3/compta/reports?period=${period}`, { credentials: "include" });
      const result = await res.json();
      if (result.success) setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat("fr-DZ").format(n) + " DZD";

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement des rapports...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Erreur de chargement</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif">Rapports & Analytics</h1>
          <p className="text-sm text-slate-600">Vue d&apos;ensemble de l&apos;activité comptable</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-white"
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
          <option value="365">Cette année</option>
        </select>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Package size={18} /> Stock
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.stock.totalValue)}</p>
          <p className="text-sm text-slate-500">{data.stock.totalItems} articles</p>
          {data.stock.lowStockItems > 0 && (
            <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
              <AlertTriangle size={12} /> {data.stock.lowStockItems} en alerte
            </p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <ShoppingCart size={18} /> Achats
          </div>
          <p className="text-2xl font-bold">{formatCurrency(data.purchases.total)}</p>
          <p className="text-sm text-slate-500">{data.purchases.count} commandes</p>
          {data.purchases.pending > 0 && (
            <p className="text-xs text-blue-600 mt-1">{data.purchases.pending} en attente</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Factory size={18} /> Production
          </div>
          <p className="text-2xl font-bold">{formatCurrency(data.production.totalCost)}</p>
          <p className="text-sm text-slate-500">{data.production.totalUnits} unités</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Wallet size={18} /> Avances
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.advances.remaining)}</p>
          <p className="text-sm text-slate-500">sur {formatCurrency(data.advances.total)}</p>
        </div>
      </div>

      {/* Charges breakdown */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> Répartition des Charges
        </h3>
        <div className="grid grid-cols-6 gap-3">
          {data.charges.byCategory.map((cat) => (
            <div key={cat.category} className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">{cat.category}</p>
              <p className="font-bold">{formatCurrency(cat._sum.amount || 0)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between">
          <span className="text-slate-600">Total Charges</span>
          <span className="font-bold text-lg">{formatCurrency(data.charges.total)}</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-medium mb-4">Achats Récents</h3>
          <div className="space-y-3">
            {data.recent.purchases.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-sm">{p.purchaseNumber}</p>
                  <p className="text-xs text-slate-500">{p.supplier.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(p.totalAmount)}</p>
                  <p className="text-xs text-slate-500">{p.status}</p>
                </div>
              </div>
            ))}
            {data.recent.purchases.length === 0 && (
              <p className="text-slate-500 text-sm">Aucun achat récent</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-medium mb-4">Production Récente</h3>
          <div className="space-y-3">
            {data.recent.batches.map((b) => (
              <div key={b.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-sm">{b.batchNumber}</p>
                  <p className="text-xs text-slate-500">{b.model.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{b.plannedQty} unités</p>
                  <p className="text-xs text-slate-500">{b.status}</p>
                </div>
              </div>
            ))}
            {data.recent.batches.length === 0 && (
              <p className="text-slate-500 text-sm">Aucun lot récent</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
