"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  RefreshCw,
  X,
  Minus,
  PlusIcon,
} from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  available: number;
  reserved: number;
  averageCost: number;
  totalValue: number;
}

interface Stats {
  totalValue: number;
  totalQuantity: number;
  totalItems: number;
}

const typeLabels: Record<string, string> = {
  FABRIC: "Tissu",
  ACCESSORY: "Accessoire",
  PACKAGING: "Emballage",
  FINISHED: "Produit fini",
  TRIM: "Mercerie",
  LABEL: "Étiquette",
};

export default function StockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Adjustment modal state
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"ADD" | "REMOVE" | "SET">("ADD");
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [typeFilter]);

  async function fetchInventory() {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/v3/compta/inventory?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchInventory();
  }

  function openAdjustModal(item: InventoryItem) {
    setAdjustItem(item);
    setAdjustType("ADD");
    setAdjustQty(0);
    setAdjustReason("");
  }

  function closeAdjustModal() {
    setAdjustItem(null);
    setAdjustQty(0);
    setAdjustReason("");
  }

  async function handleAdjust() {
    if (!adjustItem || adjustQty <= 0 || !adjustReason.trim()) return;

    setAdjusting(true);
    try {
      const res = await fetch("/api/v3/compta/inventory/adjustment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: adjustItem.id,
          adjustmentType: adjustType,
          quantity: adjustQty,
          reason: adjustReason.trim(),
        }),
      });

      const result = await res.json();
      if (result.success) {
        closeAdjustModal();
        fetchInventory();
      } else {
        alert(result.error || "Erreur lors de l'ajustement");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setAdjusting(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif">Inventaire Stock</h1>
          <p className="text-sm text-slate-600">
            Gestion des articles et mouvements
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/compta/stock/reconcile"
            className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            <RefreshCw size={18} /> Réconcilier
          </Link>
          <Link
            href="/admin/compta/stock/new"
            className="flex items-center gap-2 bg-harp-brown text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            <Plus size={18} /> Nouvel Article
          </Link>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-slate-500">Valeur Totale</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(stats.totalValue)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-slate-500">Articles</p>
            <p className="text-xl font-bold">{stats.totalItems}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-slate-500">Quantité Totale</p>
            <p className="text-xl font-bold">
              {Math.round(stats.totalQuantity)}
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Rechercher par SKU ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-harp-brown/20"
          />
        </form>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border"
        >
          <option value="">Tous types</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun article trouvé
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Qté</th>
                <th className="px-4 py-3 text-right">Réservé</th>
                <th className="px-4 py-3 text-right">CUMP</th>
                <th className="px-4 py-3 text-right">Valeur</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/compta/stock/${item.id}`}
                      className="font-mono text-sm hover:text-harp-brown"
                    >
                      {item.sku}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-slate-400" />
                      {item.name}
                      {item.available < 10 && (
                        <span title="Stock bas">
                          <AlertTriangle
                            size={14}
                            className="text-orange-500"
                          />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {typeLabels[item.type] || item.type}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {item.quantity} {item.unit.toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-orange-600">
                    {item.reserved > 0 ? item.reserved : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {formatCurrency(item.averageCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {formatCurrency(item.totalValue)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openAdjustModal(item)}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      Ajuster
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjustment Modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ajuster le stock</h2>
              <button
                onClick={closeAdjustModal}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium">{adjustItem.name}</div>
              <div className="text-sm text-slate-500">{adjustItem.sku}</div>
              <div className="text-sm mt-1">
                Stock actuel :{" "}
                <span className="font-bold">{adjustItem.quantity}</span>{" "}
                {adjustItem.unit.toLowerCase()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Type d'ajustement
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustType("ADD")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    adjustType === "ADD"
                      ? "bg-green-100 text-green-700 border-2 border-green-300"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <PlusIcon size={16} /> Ajouter
                </button>
                <button
                  onClick={() => setAdjustType("REMOVE")}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    adjustType === "REMOVE"
                      ? "bg-red-100 text-red-700 border-2 border-red-300"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Minus size={16} /> Retirer
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantité</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={adjustQty || ""}
                onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0"
              />
              {adjustType === "REMOVE" && adjustQty > adjustItem.available && (
                <p className="text-red-500 text-xs mt-1">
                  Quantité supérieure au stock disponible (
                  {adjustItem.available})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Raison *</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg resize-none"
                rows={2}
                placeholder="Ex: Inventaire physique, casse, correction..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeAdjustModal}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjusting || adjustQty <= 0 || !adjustReason.trim()}
                className="flex-1 py-2 bg-harp-brown text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {adjusting ? "..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
