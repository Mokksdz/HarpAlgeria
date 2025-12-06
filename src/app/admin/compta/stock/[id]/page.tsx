"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  Edit,
  AlertTriangle,
} from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  reserved: number;
  averageCost: number;
  totalValue: number;
  location?: string;
  notes?: string;
  transactions: Array<{
    id: string;
    type: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    reason?: string;
    reference?: string;
    createdAt: string;
  }>;
  bom: Array<{
    id: string;
    model: { id: string; sku: string; name: string };
    quantity: number;
  }>;
}

const typeLabels: Record<string, string> = {
  FABRIC: "Tissu",
  ACCESSORY: "Accessoire",
  PACKAGING: "Emballage",
  FINISHED: "Produit fini",
  TRIM: "Mercerie",
  LABEL: "Étiquette",
};

const txTypeLabels: Record<string, { label: string; color: string }> = {
  PURCHASE: { label: "Achat", color: "text-green-600" },
  SALE: { label: "Vente", color: "text-blue-600" },
  PRODUCTION_IN: { label: "Prod. entrée", color: "text-green-600" },
  PRODUCTION_OUT: { label: "Prod. sortie", color: "text-orange-600" },
  ADJUSTMENT: { label: "Ajustement", color: "text-purple-600" },
  RETURN: { label: "Retour", color: "text-gray-600" },
  TRANSFER: { label: "Transfert", color: "text-gray-600" },
};

export default function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v3/compta/inventory/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setItem(data.item);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";
  const formatDate = (d: string) => new Date(d).toLocaleString("fr-FR");

  if (loading)
    return (
      <div className="text-center py-12 text-slate-500">Chargement...</div>
    );
  if (!item)
    return (
      <div className="text-center py-12 text-red-500">Article non trouvé</div>
    );

  const available = Number(item.quantity) - Number(item.reserved);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/compta/stock"
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif">{item.name}</h1>
              {available < 10 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                  <AlertTriangle size={12} /> Stock bas
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 font-mono">{item.sku}</p>
          </div>
        </div>
        <Link
          href={`/admin/compta/stock/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
        >
          <Edit size={16} /> Modifier
        </Link>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Info */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Informations</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Type</p>
                <p className="font-medium">
                  {typeLabels[item.type] || item.type}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Unité</p>
                <p className="font-medium">{item.unit}</p>
              </div>
              <div>
                <p className="text-slate-500">Emplacement</p>
                <p className="font-medium">{item.location || "-"}</p>
              </div>
              {item.notes && (
                <div className="col-span-3">
                  <p className="text-slate-500">Notes</p>
                  <p>{item.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* BOM Usage */}
          {item.bom.length > 0 && (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-medium">
                  Utilisé dans ({item.bom.length} modèles)
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Modèle</th>
                    <th className="px-4 py-2 text-right">Quantité/unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {item.bom.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/compta/models/${b.model.id}/bom`}
                          className="hover:text-harp-brown"
                        >
                          {b.model.name}
                        </Link>
                        <span className="text-xs text-slate-500 ml-2">
                          {b.model.sku}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{b.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">Historique des mouvements</h3>
            </div>
            {item.transactions.length === 0 ? (
              <p className="p-4 text-slate-500">Aucun mouvement</p>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2 text-right">Quantité</th>
                    <th className="px-4 py-2 text-right">Coût unit.</th>
                    <th className="px-4 py-2">Raison</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {item.transactions.slice(0, 20).map((tx) => {
                    const txType = txTypeLabels[tx.type] || {
                      label: tx.type,
                      color: "text-gray-600",
                    };
                    const isPositive =
                      ["PURCHASE", "PRODUCTION_IN", "RETURN"].includes(
                        tx.type,
                      ) || tx.quantity > 0;
                    return (
                      <tr key={tx.id}>
                        <td className="px-4 py-2 text-slate-500">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-2">
                          <span className={txType.color}>{txType.label}</span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={`flex items-center justify-end gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}
                          >
                            {isPositive ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            {isPositive ? "+" : ""}
                            {tx.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(tx.unitCost)}
                        </td>
                        <td className="px-4 py-2 text-slate-500 truncate max-w-[200px]">
                          {tx.reason || tx.reference || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4">
              <Package className="text-blue-600" size={20} />
              <h3 className="font-medium">Stock</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Quantité totale</p>
                <p className="text-2xl font-bold">
                  {item.quantity} {item.unit.toLowerCase()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Disponible</p>
                  <p className="text-lg font-medium text-green-600">
                    {available}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Réservé</p>
                  <p className="text-lg font-medium text-orange-600">
                    {item.reserved}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Valorisation</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">CUMP</span>
                <span className="font-medium">
                  {formatCurrency(item.averageCost)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-slate-600">Valeur totale</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrency(item.totalValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <Link
            href="/admin/compta/stock/adjustment"
            className="block w-full px-4 py-3 text-center bg-slate-100 rounded-lg hover:bg-slate-200 text-sm"
          >
            Faire un ajustement
          </Link>
        </div>
      </div>
    </div>
  );
}
