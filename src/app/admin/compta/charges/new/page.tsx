"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Receipt } from "lucide-react";

interface Model {
  id: string;
  sku: string;
  name: string;
}

const categories = [
  { value: "ATELIER", label: "Atelier" },
  { value: "SHOOTING", label: "Shooting" },
  { value: "ADS", label: "Publicité" },
  { value: "INFLUENCER", label: "Influenceur" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "LABOR", label: "Main d'œuvre" },
  { value: "RENT", label: "Loyer" },
  { value: "UTILITIES", label: "Charges" },
  { value: "PACKAGING", label: "Emballage" },
  { value: "SAMPLES", label: "Échantillons" },
  { value: "OTHER", label: "Autre" },
];

export default function NewChargePage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    category: "ADS",
    scope: "GLOBAL",
    amount: 0,
    description: "",
    modelId: "",
    date: new Date().toISOString().split("T")[0],
    platform: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/v3/compta/models?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setModels(data.items);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.amount <= 0 || !form.description) {
      setError("Entrez un montant et une description");
      return;
    }
    if (form.scope === "MODEL" && !form.modelId) {
      setError("Sélectionnez un modèle pour une charge modèle");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v3/compta/charges", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: new Date(form.date).toISOString(),
          modelId: form.scope === "MODEL" ? form.modelId : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/admin/compta/charges");
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
        <Link href="/admin/compta/charges" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">Nouvelle Charge</h1>
          <p className="text-sm text-slate-600">Enregistrer une dépense</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Receipt className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="font-medium">Charge / Dépense</p>
            <p className="text-sm text-slate-500">Sera comptabilisée dans les coûts de revient</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              required
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scope *</label>
            <select
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              required
            >
              <option value="GLOBAL">Global (toute l&apos;entreprise)</option>
              <option value="MODEL">Modèle spécifique</option>
            </select>
          </div>

          {form.scope === "MODEL" && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Modèle *</label>
              <select
                value={form.modelId}
                onChange={(e) => setForm({ ...form, modelId: e.target.value })}
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
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Montant (DZD) *</label>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="10000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="Campagne Facebook Décembre, Shooting nouvelle collection..."
              required
            />
          </div>

          {(form.category === "ADS" || form.category === "INFLUENCER") && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Plateforme</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              >
                <option value="">Non spécifié</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
                <option value="GOOGLE">Google</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          )}

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

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/compta/charges" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-harp-brown text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Enregistrement..." : "Créer la charge"}
          </button>
        </div>
      </form>
    </div>
  );
}
