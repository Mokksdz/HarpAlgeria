"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Layers } from "lucide-react";

export default function NewModelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    sku: "",
    name: "",
    laborCost: 0,
    otherCost: 0,
    sellingPrice: 0,
    estimatedUnits: 100,
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
      const res = await fetch("/api/v3/compta/models", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/compta/models/${data.model.id}/bom`);
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Link href="/admin/compta/models" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">Nouveau Modèle</h1>
          <p className="text-sm text-slate-600">Créer un modèle pour calcul de coûts</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Layers className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="font-medium">Modèle Produit</p>
            <p className="text-sm text-slate-500">Après création, ajoutez la nomenclature (BOM)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20 font-mono"
              placeholder="JEBBA-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="Jebba Velours Rouge"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Coût main d&apos;œuvre/unité</label>
            <input
              type="number"
              min="0"
              value={form.laborCost}
              onChange={(e) => setForm({ ...form, laborCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Autres coûts/unité</label>
            <input
              type="number"
              min="0"
              value={form.otherCost}
              onChange={(e) => setForm({ ...form, otherCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prix de vente</label>
            <input
              type="number"
              min="0"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="4500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unités estimées</label>
            <input
              type="number"
              min="1"
              value={form.estimatedUnits}
              onChange={(e) => setForm({ ...form, estimatedUnits: parseInt(e.target.value) || 100 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            />
            <p className="text-xs text-slate-500 mt-1">Pour répartir les charges fixes</p>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              rows={2}
              placeholder="Description du modèle..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/compta/models" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-harp-brown text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Création..." : "Créer et configurer BOM"}
          </button>
        </div>
      </form>
    </div>
  );
}
