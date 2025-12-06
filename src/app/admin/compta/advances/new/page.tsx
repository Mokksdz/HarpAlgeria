"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Wallet } from "lucide-react";

interface Supplier {
  id: string;
  code: string;
  name: string;
}

export default function NewAdvancePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    supplierId: "",
    amount: 0,
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/v3/compta/suppliers?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSuppliers(data.items);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId || form.amount <= 0) {
      setError("Sélectionnez un fournisseur et entrez un montant");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v3/compta/advances", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentDate: new Date(form.paymentDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/admin/compta/advances");
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
        <Link
          href="/admin/compta/advances"
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif">Nouvelle Avance</h1>
          <p className="text-sm text-slate-600">
            Enregistrer une avance fournisseur
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
          <div className="p-3 bg-green-100 rounded-xl">
            <Wallet className="text-green-600" size={24} />
          </div>
          <div>
            <p className="font-medium">Avance Fournisseur</p>
            <p className="text-sm text-slate-500">
              Cette avance pourra être appliquée sur de futurs achats
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fournisseur *
            </label>
            <select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              required
            >
              <option value="">Sélectionner un fournisseur...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Montant (DZD) *
            </label>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="50000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mode de paiement
            </label>
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            >
              <option value="CASH">Espèces</option>
              <option value="CHECK">Chèque</option>
              <option value="TRANSFER">Virement</option>
              <option value="CCP">CCP</option>
              <option value="CARD">Carte</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date paiement
            </label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) =>
                setForm({ ...form, paymentDate: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Référence
            </label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
              placeholder="N° chèque, virement..."
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

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href="/admin/compta/advances"
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
            {loading ? "Enregistrement..." : "Créer l'avance"}
          </button>
        </div>
      </form>
    </div>
  );
}
