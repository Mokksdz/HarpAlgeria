"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  CheckCircle,
  Play,
} from "lucide-react";

interface Requirement {
  inventoryItemId: string;
  sku: string;
  name: string;
  unit: string;
  required: number;
  available: number;
  shortage: number;
  unitCost: number;
  totalCost: number;
  canConsume: boolean;
}

interface PreviewData {
  batch: {
    id: string;
    batchNumber: string;
    plannedQty: number;
    status: string;
  };
  model: { id: string; sku: string; name: string };
  requirements: Requirement[];
  hasShortage: boolean;
  totalMaterialsCost: number;
  canProceed: boolean;
}

export default function ConsumeProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/v3/compta/production/${id}/consume`, { credentials: "include" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setData(result);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!data?.canProceed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v3/compta/production/${id}/consume`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await res.json();
      if (result.success) {
        router.push(`/admin/compta/production/${id}`);
      } else {
        alert(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";

  if (loading)
    return (
      <div className="text-center py-12 text-slate-500">Chargement...</div>
    );
  if (!data)
    return <div className="text-center py-12 text-red-500">Lot non trouvé</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link
          href={`/admin/compta/production/${id}`}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">
            Démarrer Production — {data.batch.batchNumber}
          </h1>
          <p className="text-sm text-slate-600">
            {data.model.name} • {data.batch.plannedQty} unités
          </p>
        </div>
      </header>

      {/* Warning if shortage */}
      {data.hasShortage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle
            className="text-red-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="font-medium text-red-800">Stock insuffisant</p>
            <p className="text-sm text-red-700">
              Certains articles n&apos;ont pas assez de stock disponible. Passez
              une commande ou réduisez la quantité.
            </p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      {!data.hasShortage && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle
            className="text-green-600 flex-shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="font-medium text-green-800">Stock disponible</p>
            <p className="text-sm text-green-700">
              Toutes les matières sont disponibles. Le stock sera
              automatiquement déduit au démarrage.
            </p>
          </div>
        </div>
      )}

      {/* Requirements Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">Matières à consommer</h3>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-sm text-slate-600">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3 text-right">Requis</th>
              <th className="px-4 py-3 text-right">Disponible</th>
              <th className="px-4 py-3 text-right">Manque</th>
              <th className="px-4 py-3 text-right">Coût unit.</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.requirements.map((req) => (
              <tr
                key={req.inventoryItemId}
                className={req.shortage > 0 ? "bg-red-50" : ""}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    <div>
                      <div className="font-medium">{req.name}</div>
                      <div className="text-xs text-slate-500">{req.sku}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {req.required} {req.unit.toLowerCase()}
                </td>
                <td className="px-4 py-3 text-right">{req.available}</td>
                <td className="px-4 py-3 text-right">
                  {req.shortage > 0 ? (
                    <span className="text-red-600 font-medium">
                      -{req.shortage}
                    </span>
                  ) : (
                    <span className="text-green-600">✓</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {formatCurrency(req.unitCost)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(req.totalCost)}
                </td>
                <td className="px-4 py-3 text-center">
                  {req.canConsume ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle size={14} /> OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                      <AlertTriangle size={14} /> Manque
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right font-medium">
                Total matières
              </td>
              <td className="px-4 py-3 text-right font-bold text-lg">
                {formatCurrency(data.totalMaterialsCost)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          Coût/unité estimé:{" "}
          <span className="font-bold">
            {formatCurrency(
              Math.round(data.totalMaterialsCost / data.batch.plannedQty),
            )}
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/admin/compta/production/${id}`}
            className="px-6 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Annuler
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || !data.canProceed}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            {submitting ? "Démarrage..." : "Démarrer la production"}
          </button>
        </div>
      </div>
    </div>
  );
}
