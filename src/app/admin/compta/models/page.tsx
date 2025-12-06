"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calculator, Layers, Factory } from "lucide-react";

interface Model {
  id: string;
  sku: string;
  name: string;
  collection?: { id: string; nameFr: string };
  sellingPrice?: number;
  laborCost: number;
  estimatedUnits: number;
  _count: { bom: number; charges: number; batches: number };
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/v3/compta/models?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setModels(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif">Modèles & Nomenclature</h1>
          <p className="text-sm text-slate-600">
            Gestion des modèles, BOM et coûts
          </p>
        </div>
        <Link
          href="/admin/compta/models/new"
          className="flex items-center gap-2 bg-harp-brown text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
        >
          <Plus size={18} /> Nouveau Modèle
        </Link>
      </header>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Rechercher par SKU ou nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchModels()}
          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-harp-brown/20"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-slate-500 py-8">Chargement...</div>
      ) : models.length === 0 ? (
        <div className="text-center text-slate-500 py-8">
          Aucun modèle trouvé
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">{model.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">
                    {model.sku}
                  </p>
                </div>
                {model.collection && (
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                    {model.collection.nameFr}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                <div className="flex items-center gap-1 text-slate-600">
                  <Layers size={14} />
                  <span>{model._count.bom} composants</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Calculator size={14} />
                  <span>{model._count.charges} charges</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600">
                  <Factory size={14} />
                  <span>{model._count.batches} lots</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div>
                  {model.sellingPrice ? (
                    <span className="font-bold text-green-600">
                      {formatCurrency(model.sellingPrice)}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm">
                      Prix non défini
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/compta/models/${model.id}/bom`}
                    className="px-3 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200"
                  >
                    BOM
                  </Link>
                  <Link
                    href={`/admin/compta/models/${model.id}/costs`}
                    className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Coûts
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
