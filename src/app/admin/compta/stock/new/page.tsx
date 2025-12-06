"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package } from "lucide-react";

const types = [
  { value: "FABRIC", label: "Tissu" },
  { value: "ACCESSORY", label: "Accessoire" },
  { value: "PACKAGING", label: "Emballage" },
  { value: "FINISHED", label: "Produit fini" },
  { value: "TRIM", label: "Mercerie" },
  { value: "LABEL", label: "Étiquette" },
];

const units = [
  { value: "METER", label: "Mètre" },
  { value: "ROLL", label: "Rouleau" },
  { value: "PIECE", label: "Pièce" },
  { value: "KG", label: "Kilogramme" },
  { value: "LITER", label: "Litre" },
  { value: "SET", label: "Lot" },
];

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    sku: "",
    name: "",
    type: "FABRIC",
    unit: "METER",
    quantity: 0,
    averageCost: 0,
    minStock: 10,
    location: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku || !form.name) {
      setError("SKU et nom requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v3/compta/inventory", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/compta/stock/${data.item.id}`);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Link
          href="/admin/compta/stock"
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">Nouvel Article</h1>
          <p className="text-sm text-slate-600">
            Ajouter un article à l&apos;inventaire
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Package className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="font-medium">Article Inventaire</p>
            <p className="text-sm text-slate-500">
              Matière première, accessoire ou produit fini
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) =>
                setForm({ ...form, sku: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20 font-mono"
              placeholder="TISSU-VEL-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="Velours Rouge Premium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Unité
            </label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            >
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantité initiale
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Coût unitaire (DZD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.averageCost}
              onChange={(e) =>
                setForm({
                  ...form,
                  averageCost: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Seuil alerte
            </label>
            <input
              type="number"
              min="0"
              value={form.minStock}
              onChange={(e) =>
                setForm({ ...form, minStock: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Emplacement
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="MAGASIN, ATELIER..."
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              rows={2}
              placeholder="Notes internes..."
            />
          </div>
        </div>

        {/* Preview */}
        {form.quantity > 0 && form.averageCost > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Valeur initiale</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(form.quantity * form.averageCost)}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href="/admin/compta/stock"
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-harp-brown text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Création..." : "Créer l'article"}
          </button>
        </div>
      </form>
    </div>
  );
}
