"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";

interface Supplier {
  id: string;
  code: string;
  name: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  averageCost: number;
}

interface PurchaseItem {
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantityOrdered: number;
  unitPrice: number;
  unit: string;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    supplierId: "",
    invoiceNumber: "",
    expectedDate: "",
    taxAmount: 0,
    shippingCost: 0,
    notes: "",
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/v3/compta/suppliers?limit=100", {
        credentials: "include",
      }).then((r) => r.json()),
      fetch("/api/v3/compta/inventory?limit=200", {
        credentials: "include",
      }).then((r) => r.json()),
    ]).then(([suppData, invData]) => {
      if (suppData.success) setSuppliers(suppData.items);
      if (invData.success) setInventoryItems(invData.items);
    });
  }, []);

  function addItem() {
    setItems([
      ...items,
      { inventoryItemId: "", quantityOrdered: 1, unitPrice: 0, unit: "PIECE" },
    ]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(
    index: number,
    field: keyof PurchaseItem,
    value: string | number | InventoryItem | undefined,
  ) {
    const updated = [...items];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;

    // Auto-fill price from inventory item
    if (field === "inventoryItemId") {
      const invItem = inventoryItems.find((i) => i.id === value);
      if (invItem) {
        updated[index].unitPrice = invItem.averageCost;
        updated[index].unit = invItem.unit;
        updated[index].inventoryItem = invItem;
      }
    }
    setItems(updated);
  }

  const subtotal = items.reduce(
    (sum, i) => sum + i.quantityOrdered * i.unitPrice,
    0,
  );
  const total = subtotal + form.taxAmount + form.shippingCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId) {
      setError("Sélectionnez un fournisseur");
      return;
    }
    if (items.length === 0) {
      setError("Ajoutez au moins un article");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v3/compta/purchases", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedDate: form.expectedDate
            ? new Date(form.expectedDate).toISOString()
            : undefined,
          items: items.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            quantityOrdered: i.quantityOrdered,
            unitPrice: i.unitPrice,
            unit: i.unit,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/compta/purchases/${data.purchase.id}`);
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link
          href="/admin/compta/purchases"
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">Nouvel Achat</h1>
          <p className="text-sm text-slate-600">
            Créer une nouvelle commande fournisseur
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="col-span-2 space-y-6">
          {/* Supplier & Info */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fournisseur *
                </label>
                <select
                  value={form.supplierId}
                  onChange={(e) =>
                    setForm({ ...form, supplierId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  N° Facture
                </label>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
                  placeholder="FAC-2024-XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date livraison prévue
                </label>
                <input
                  type="date"
                  value={form.expectedDate}
                  onChange={(e) =>
                    setForm({ ...form, expectedDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
                  placeholder="Notes internes..."
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Articles</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-harp-brown hover:underline"
              >
                <Plus size={16} /> Ajouter article
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Aucun article. Cliquez sur &quot;Ajouter article&quot;
              </p>
            ) : (
              <table className="w-full">
                <thead className="text-left text-sm text-slate-600 border-b">
                  <tr>
                    <th className="pb-2">Article</th>
                    <th className="pb-2 w-24">Qté</th>
                    <th className="pb-2 w-32">Prix unit.</th>
                    <th className="pb-2 w-32 text-right">Total</th>
                    <th className="pb-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2">
                        <select
                          value={item.inventoryItemId}
                          onChange={(e) =>
                            updateItem(index, "inventoryItemId", e.target.value)
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm"
                          required
                        >
                          <option value="">Sélectionner...</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.sku} - {inv.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantityOrdered}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantityOrdered",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm"
                          required
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-2 py-1.5 border rounded text-sm"
                          required
                        />
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(item.quantityOrdered * item.unitPrice)}
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow sticky top-6">
            <h3 className="font-medium mb-4">Récapitulatif</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Taxes</span>
                <input
                  type="number"
                  min="0"
                  value={form.taxAmount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      taxAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-2 py-1 border rounded text-right text-sm"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Frais livraison</span>
                <input
                  type="number"
                  min="0"
                  value={form.shippingCost}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      shippingCost: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-2 py-1 border rounded text-right text-sm"
                />
              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-harp-brown text-white py-3 rounded-xl hover:bg-opacity-90 disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Création..." : "Créer l'achat"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
