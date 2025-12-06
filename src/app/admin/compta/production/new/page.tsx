"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Factory } from "lucide-react";

interface Model {
  id: string;
  sku: string;
  name: string;
  laborCost: number;
}

export default function NewProductionPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    modelId: "",
    plannedQty: 100,
    plannedDate: "",
    laborCost: 0,
    overheadCost: 0,
    notes: "",
  });

  useEffect(() => {
    fetch("/api/v3/compta/models?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setModels(data.items);
      });
  }, []);

  function handleModelChange(modelId: string) {
    const model = models.find((m) => m.id === modelId);
    setForm({
      ...form,
      modelId,
      laborCost: model?.laborCost || 0,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.modelId || form.plannedQty <= 0) {
      setError("Sélectionnez un modèle et entrez une quantité");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v3/compta/production", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plannedDate: form.plannedDate ? new Date(form.plannedDate).toISOString() : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/admin/compta/production/${data.batch.id}`);
      } else {
        setError(data.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  const selectedModel = models.find((m) => m.id === form.modelId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Link href="/admin/compta/production" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">Nouveau Lot de Production</h1>
          <p className="text-sm text-slate-600">Planifier un nouveau lot</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Factory className="text-purple-600" size={24} />
          </div>
          <div>
            <p className="font-medium">Lot de Production</p>
            <p className="text-sm text-slate-500">Les matières seront consommées au démarrage</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Modèle *</label>
            <select
              value={form.modelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              required
            >
              <option value="">Sélectionner un modèle...</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.sku} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantité prévue *</label>
            <input
              type="number"
              min="1"
              value={form.plannedQty}
              onChange={(e) => setForm({ ...form, plannedQty: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date prévue</label>
            <input
              type="date"
              value={form.plannedDate}
              onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Coût main d&apos;œuvre (total)</label>
            <input
              type="number"
              min="0"
              value={form.laborCost}
              onChange={(e) => setForm({ ...form, laborCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Frais atelier (total)</label>
            <input
              type="number"
              min="0"
              value={form.overheadCost}
              onChange={(e) => setForm({ ...form, overheadCost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="0"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
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
        {selectedModel && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Aperçu</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Modèle</p>
                <p className="font-medium">{selectedModel.name}</p>
              </div>
              <div>
                <p className="text-slate-500">Unités</p>
                <p className="font-medium">{form.plannedQty}</p>
              </div>
              <div>
                <p className="text-slate-500">Coût MO/unité</p>
                <p className="font-medium">
                  {form.plannedQty > 0 ? Math.round(form.laborCost / form.plannedQty) : 0} DZD
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/compta/production" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-harp-brown text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Création..." : "Créer le lot"}
          </button>
        </div>
      </form>
    </div>
  );
}
