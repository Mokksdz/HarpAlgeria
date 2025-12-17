"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

interface PreviewItem {
  purchaseItemId: string;
  inventoryItemId: string;
  sku: string;
  name: string;
  quantityOrdered: number;
  quantityReceived: number;
  remaining: number;
  unitPrice: number;
  current: { quantity: number; averageCost: number; totalValue: number };
  afterFullReceive: {
    quantity: number;
    averageCost: number;
    totalValue: number;
  } | null;
}

interface PreviewData {
  purchase: {
    id: string;
    purchaseNumber: string;
    supplier: { name: string };
    status: string;
    totalAmount: number;
  };
  preview: PreviewItem[];
}

export default function ReceivePurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`/api/v3/compta/purchases/${id}/receive`, { credentials: "include" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) {
          setData(result);
          // Initialize quantities with remaining
          const initial: Record<string, number> = {};
          result.preview.forEach((item: PreviewItem) => {
            initial[item.purchaseItemId] = item.remaining;
          });
          setQuantities(initial);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const items = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([purchaseItemId, qty]) => ({
          purchaseItemId,
          quantityReceived: qty,
        }));

      const res = await fetch(`/api/v3/compta/purchases/${id}/receive`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const result = await res.json();
      if (result.success) {
        router.push(`/admin/compta/purchases/${id}`);
      } else {
        alert(result.error || "Erreur lors de la réception");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
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
    return (
      <div className="text-center py-12 text-red-500">Achat non trouvé</div>
    );

  const hasItemsToReceive = data.preview.some((item) => item.remaining > 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link
          href={`/admin/compta/purchases/${id}`}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">
            Réception — {data.purchase.purchaseNumber}
          </h1>
          <p className="text-sm text-slate-600">
            {data.purchase.supplier.name}
          </p>
        </div>
      </header>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
        <TrendingUp className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-blue-800">Calcul CUMP automatique</p>
          <p className="text-sm text-blue-700">
            Les coûts moyens pondérés (CUMP) seront recalculés automatiquement
            lors de la réception. Vérifiez les quantités avant de valider.
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-sm text-slate-600">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3 text-center">Commandé</th>
              <th className="px-4 py-3 text-center">Déjà reçu</th>
              <th className="px-4 py-3 text-center">À recevoir</th>
              <th className="px-4 py-3 text-right">Prix achat</th>
              <th className="px-4 py-3 text-center">Stock actuel</th>
              <th className="px-4 py-3 text-center">Nouveau stock</th>
              <th className="px-4 py-3 text-right">Nouveau CUMP</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.preview.map((item) => {
              const qty = quantities[item.purchaseItemId] || 0;
              const willReceive = qty > 0;

              // Recalculate CUMP preview based on input quantity
              let newQty = item.current.quantity;
              let newCump = item.current.averageCost;
              if (willReceive) {
                const currentValue =
                  item.current.quantity * item.current.averageCost;
                const incomingValue = qty * item.unitPrice;
                newQty = item.current.quantity + qty;
                newCump =
                  newQty > 0
                    ? (currentValue + incomingValue) / newQty
                    : item.unitPrice;
              }

              return (
                <tr
                  key={item.purchaseItemId}
                  className={item.remaining === 0 ? "opacity-50" : ""}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-slate-400" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.quantityOrdered}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500">
                    {item.quantityReceived}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.remaining > 0 ? (
                      <input
                        type="number"
                        min="0"
                        max={item.remaining}
                        value={qty}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [item.purchaseItemId]:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 px-2 py-1 border rounded text-center"
                      />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={14} /> Complet
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div>{item.current.quantity}</div>
                    <div className="text-xs text-slate-500">
                      @ {formatCurrency(item.current.averageCost)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {willReceive ? (
                      <div className="text-green-600 font-medium">
                        {Math.round(newQty * 100) / 100}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {willReceive ? (
                      <div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(Math.round(newCump * 100) / 100)}
                        </div>
                        {newCump !== item.current.averageCost && (
                          <div className="text-xs text-slate-500">
                            {newCump > item.current.averageCost ? "↑" : "↓"}
                            {Math.abs(
                              Math.round(
                                (newCump - item.current.averageCost) * 100,
                              ) / 100,
                            )}{" "}
                            DZD
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link
          href={`/admin/compta/purchases/${id}`}
          className="px-6 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
        >
          Annuler
        </Link>
        <button
          onClick={handleSubmit}
          disabled={
            submitting ||
            !hasItemsToReceive ||
            Object.values(quantities).every((q) => q === 0)
          }
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : "Valider la réception"}
        </button>
      </div>
    </div>
  );
}
