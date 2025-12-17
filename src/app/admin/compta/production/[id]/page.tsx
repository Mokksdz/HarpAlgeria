"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Clock,
  Pause,
  Package,
} from "lucide-react";

interface Batch {
  id: string;
  batchNumber: string;
  model: { id: string; sku: string; name: string };
  plannedQty: number;
  producedQty: number;
  wasteQty: number;
  status: string;
  materialsCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  costPerUnit: number;
  plannedDate?: string;
  startedAt?: string;
  completedAt?: string;
  consumptions: Array<{
    id: string;
    inventoryItemId: string;
    plannedQty: number;
    actualQty: number;
    unitCost: number;
    totalCost: number;
  }>;
  notes?: string;
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
  CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-700", icon: Clock },
  ON_HOLD: {
    label: "En pause",
    color: "bg-yellow-100 text-yellow-700",
    icon: Pause,
  },
};

export default function ProductionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    producedQty: 0,
    wasteQty: 0,
  });
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetch(`/api/v3/compta/production/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBatch(data.batch);
          setCompleteForm({
            producedQty: data.batch.plannedQty,
            wasteQty: 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/v3/compta/production/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) setBatch(data.batch);
    else alert(data.error);
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/v3/compta/production/${id}/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeForm),
      });
      const data = await res.json();
      if (data.success) {
        setBatch(data.batch);
        setShowCompleteModal(false);
      } else {
        alert(data.error);
      }
    } finally {
      setCompleting(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "-";

  if (loading)
    return (
      <div className="text-center py-12 text-slate-500">Chargement...</div>
    );
  if (!batch)
    return <div className="text-center py-12 text-red-500">Lot non trouvé</div>;

  const status = statusConfig[batch.status] || statusConfig.PLANNED;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/compta/production"
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif">{batch.batchNumber}</h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${status.color}`}
              >
                <StatusIcon size={14} /> {status.label}
              </span>
            </div>
            <p className="text-sm text-slate-600">{batch.model.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {batch.status === "PLANNED" && (
            <Link
              href={`/admin/compta/production/${id}/consume`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Play size={16} /> Démarrer la production
            </Link>
          )}
          {batch.status === "IN_PROGRESS" && (
            <>
              <button
                onClick={() => setShowCompleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <CheckCircle size={16} /> Terminer
              </button>
              <button
                onClick={() => handleStatusChange("ON_HOLD")}
                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm"
              >
                Pause
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Info */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Détails du lot</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Modèle</p>
                <p className="font-medium">{batch.model.name}</p>
                <p className="text-xs text-slate-400">{batch.model.sku}</p>
              </div>
              <div>
                <p className="text-slate-500">Quantité prévue</p>
                <p className="font-medium text-lg">{batch.plannedQty} unités</p>
              </div>
              <div>
                <p className="text-slate-500">Quantité produite</p>
                <p className="font-medium text-lg text-green-600">
                  {batch.producedQty} unités
                </p>
              </div>
              <div>
                <p className="text-slate-500">Date prévue</p>
                <p className="font-medium">{formatDate(batch.plannedDate)}</p>
              </div>
              <div>
                <p className="text-slate-500">Démarré le</p>
                <p className="font-medium">{formatDate(batch.startedAt)}</p>
              </div>
              <div>
                <p className="text-slate-500">Terminé le</p>
                <p className="font-medium">{formatDate(batch.completedAt)}</p>
              </div>
            </div>
          </div>

          {/* Consumptions */}
          {batch.consumptions.length > 0 && (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-medium">Matières consommées</h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Article</th>
                    <th className="px-4 py-3 text-right">Quantité</th>
                    <th className="px-4 py-3 text-right">Coût unit.</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batch.consumptions.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-slate-400" />
                          <span>{c.inventoryItemId.slice(-8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{c.actualQty}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(c.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(c.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Costs Summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Coûts</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Matières</span>
                <span>{formatCurrency(batch.materialsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Main d&apos;œuvre</span>
                <span>{formatCurrency(batch.laborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Frais atelier</span>
                <span>{formatCurrency(batch.overheadCost)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(batch.totalCost)}</span>
              </div>
              {batch.plannedQty > 0 && (
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-slate-600">Coût/unité</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(
                      Math.round(batch.totalCost / batch.plannedQty),
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Progression</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between text-sm">
                <span>
                  {batch.producedQty} / {batch.plannedQty}
                </span>
                <span>
                  {Math.round((batch.producedQty / batch.plannedQty) * 100)}%
                </span>
              </div>
              <div className="overflow-hidden h-3 bg-slate-100 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min((batch.producedQty / batch.plannedQty) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-medium mb-4">Terminer le lot</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantité produite *
                </label>
                <input
                  type="number"
                  min="0"
                  max={batch.plannedQty}
                  value={completeForm.producedQty}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      producedQty: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantité déchets
                </label>
                <input
                  type="number"
                  min="0"
                  value={completeForm.wasteQty}
                  onChange={(e) =>
                    setCompleteForm({
                      ...completeForm,
                      wasteQty: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Quantité planifiée:</span>
                  <span className="font-medium">{batch.plannedQty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Total (produit + déchets):
                  </span>
                  <span className="font-medium">
                    {completeForm.producedQty + completeForm.wasteQty}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleComplete}
                disabled={completing || completeForm.producedQty <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {completing ? "En cours..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
