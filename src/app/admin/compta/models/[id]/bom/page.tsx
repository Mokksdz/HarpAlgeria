"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Package, Calculator } from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  averageCost: number;
}

interface BomItem {
  id: string;
  inventoryItem: InventoryItem;
  quantity: number;
  wasteFactor: number;
  unitCost: number;
  lineCost: number;
}

interface BomData {
  modelId: string;
  modelName: string;
  bom: BomItem[];
  totalCost: number;
}

export default function ModelBomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<BomData | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [newItem, setNewItem] = useState({
    inventoryItemId: "",
    quantity: 1,
    wasteFactor: 1.05,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/v3/compta/models/${id}/bom`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
      fetch("/api/v3/compta/inventory?limit=200", {
        credentials: "include",
      }).then((r) => r.json()),
    ]).then(([bomData, invData]) => {
      if (bomData.success) setData(bomData);
      if (invData.success) setInventoryItems(invData.items);
      setLoading(false);
    });
  }, [id]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.inventoryItemId) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/v3/compta/models/${id}/bom`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const result = await res.json();
      if (result.success) {
        // Refresh data
        const bomRes = await fetch(`/api/v3/compta/models/${id}/bom`, {
          credentials: "include",
        });
        const bomData = await bomRes.json();
        if (bomData.success) setData(bomData);
        setNewItem({ inventoryItemId: "", quantity: 1, wasteFactor: 1.05 });
      } else {
        alert(result.error);
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveItem(bomItemId: string) {
    if (!confirm("Supprimer cet élément ?")) return;

    const res = await fetch(
      `/api/v3/compta/models/${id}/bom?bomItemId=${bomItemId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    const result = await res.json();
    if (result.success) {
      // Refresh
      const bomRes = await fetch(`/api/v3/compta/models/${id}/bom`, {
        credentials: "include",
      });
      const bomData = await bomRes.json();
      if (bomData.success) setData(bomData);
    } else {
      alert(result.error);
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
      <div className="text-center py-12 text-red-500">Modèle non trouvé</div>
    );

  // Filter out items already in BOM
  const availableItems = inventoryItems.filter(
    (item) => !data.bom.some((b) => b.inventoryItem.id === item.id),
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/compta/models"
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-serif">Nomenclature (BOM)</h1>
            <p className="text-sm text-slate-600">{data.modelName}</p>
          </div>
        </div>
        <Link
          href={`/admin/compta/models/${id}/costs`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Calculator size={16} /> Calculer coûts
        </Link>
      </header>

      {/* Add Item Form */}
      <form
        onSubmit={handleAddItem}
        className="bg-white p-4 rounded-xl shadow flex gap-4 items-end"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Article
          </label>
          <select
            value={newItem.inventoryItemId}
            onChange={(e) =>
              setNewItem({ ...newItem, inventoryItemId: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Sélectionner un article...</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.sku} - {item.name} ({formatCurrency(item.averageCost)}/
                {item.unit.toLowerCase()})
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Quantité
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={newItem.quantity}
            onChange={(e) =>
              setNewItem({
                ...newItem,
                quantity: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Perte %
          </label>
          <input
            type="number"
            min="1"
            max="2"
            step="0.01"
            value={newItem.wasteFactor}
            onChange={(e) =>
              setNewItem({
                ...newItem,
                wasteFactor: parseFloat(e.target.value) || 1,
              })
            }
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !newItem.inventoryItemId}
          className="flex items-center gap-2 px-4 py-2 bg-harp-brown text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
        >
          <Plus size={18} /> Ajouter
        </button>
      </form>

      {/* BOM Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {data.bom.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun composant. Ajoutez des articles à la nomenclature.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Quantité</th>
                <th className="px-4 py-3 text-right">Perte</th>
                <th className="px-4 py-3 text-right">Coût unit.</th>
                <th className="px-4 py-3 text-right">Coût ligne</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.bom.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-slate-400" />
                      <div>
                        <div className="font-medium">
                          {item.inventoryItem.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.inventoryItem.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {item.inventoryItem.type}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.quantity} {item.inventoryItem.unit.toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {Math.round((item.wasteFactor - 1) * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {formatCurrency(item.unitCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(item.lineCost)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right font-medium">
                  Total matières
                </td>
                <td className="px-4 py-3 text-right font-bold text-lg text-green-600">
                  {formatCurrency(data.totalCost)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
