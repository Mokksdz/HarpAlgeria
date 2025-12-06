"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Save, TrendingUp, Layers, Truck, Users, Megaphone } from "lucide-react";

interface CostData {
  model: { id: string; sku: string; name: string };
  breakdown: {
    fabricCost: number;
    accessoryCost: number;
    packagingCost: number;
    materialsCost: number;
    laborCost: number;
    atelierCost: number;
    productionCost: number;
    adsCost: number;
    shootingCost: number;
    influencerCost: number;
    marketingCost: number;
    transportCost: number;
    otherCost: number;
    returnMargin: number;
    totalCost: number;
  };
  suggestedPrices: {
    margin30: number;
    margin40: number;
    margin50: number;
  };
  currentPrice: number | null;
  currentMargin: number | null;
  currentMarginPercent: number | null;
}

export default function ModelCostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/v3/compta/models/${id}/costs`, { credentials: "include" })
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setData(result);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSnapshot() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v3/compta/models/${id}/costs`, { method: "POST", credentials: "include" });
      const result = await res.json();
      if (result.success) {
        alert("Snapshot créé avec succès !");
      } else {
        alert(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat("fr-DZ").format(n) + " DZD";

  if (loading) return <div className="text-center py-12 text-slate-500">Chargement...</div>;
  if (!data) return <div className="text-center py-12 text-red-500">Modèle non trouvé</div>;

  const { breakdown } = data;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/compta/models" className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-serif">Analyse des Coûts</h1>
            <p className="text-sm text-slate-600">{data.model.name} ({data.model.sku})</p>
          </div>
        </div>
        <button
          onClick={handleSnapshot}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-harp-brown text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
        >
          <Camera size={18} /> {saving ? "Enregistrement..." : "Créer Snapshot"}
        </button>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <div className="col-span-2 space-y-4">
          {/* Materials */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="text-blue-600" size={20} />
              <h3 className="font-medium">Matières premières</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <CostItem label="Tissus" value={breakdown.fabricCost} />
              <CostItem label="Accessoires" value={breakdown.accessoryCost} />
              <CostItem label="Emballage" value={breakdown.packagingCost} />
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-medium">
              <span>Total matières</span>
              <span className="text-blue-600">{formatCurrency(breakdown.materialsCost)}</span>
            </div>
          </div>

          {/* Production */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-purple-600" size={20} />
              <h3 className="font-medium">Production</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CostItem label="Main d'œuvre" value={breakdown.laborCost} />
              <CostItem label="Frais atelier" value={breakdown.atelierCost} />
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-medium">
              <span>Total production</span>
              <span className="text-purple-600">{formatCurrency(breakdown.productionCost)}</span>
            </div>
          </div>

          {/* Marketing */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="text-orange-600" size={20} />
              <h3 className="font-medium">Marketing</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <CostItem label="Publicité" value={breakdown.adsCost} />
              <CostItem label="Shooting" value={breakdown.shootingCost} />
              <CostItem label="Influenceurs" value={breakdown.influencerCost} />
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-medium">
              <span>Total marketing</span>
              <span className="text-orange-600">{formatCurrency(breakdown.marketingCost)}</span>
            </div>
          </div>

          {/* Other */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="text-slate-600" size={20} />
              <h3 className="font-medium">Autres coûts</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <CostItem label="Transport" value={breakdown.transportCost} />
              <CostItem label="Autres" value={breakdown.otherCost} />
              <CostItem label="Marge retours" value={breakdown.returnMargin} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Total */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white">
            <p className="text-slate-400 text-sm mb-1">Coût de revient total</p>
            <p className="text-3xl font-bold">{formatCurrency(breakdown.totalCost)}</p>
          </div>

          {/* Suggested Prices */}
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Prix suggérés</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm">Marge 30%</span>
                <span className="font-bold">{formatCurrency(data.suggestedPrices.margin30)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm">Marge 40%</span>
                <span className="font-bold">{formatCurrency(data.suggestedPrices.margin40)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm">Marge 50%</span>
                <span className="font-bold">{formatCurrency(data.suggestedPrices.margin50)}</span>
              </div>
            </div>
          </div>

          {/* Current Margin */}
          {data.currentPrice && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="font-medium mb-4">Situation actuelle</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Prix de vente</span>
                  <span className="font-medium">{formatCurrency(data.currentPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Coût de revient</span>
                  <span className="font-medium">{formatCurrency(breakdown.totalCost)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-slate-600">Marge</span>
                  <span className={`font-bold ${data.currentMarginPercent && data.currentMarginPercent >= 30 ? "text-green-600" : "text-red-600"}`}>
                    {data.currentMargin ? formatCurrency(data.currentMargin) : "-"} ({data.currentMarginPercent}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/admin/compta/models/${id}/bom`}
              className="px-4 py-3 text-center bg-slate-100 rounded-lg hover:bg-slate-200 text-sm"
            >
              Modifier la nomenclature
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostItem({ label, value }: { label: string; value: number }) {
  const formatCurrency = (n: number) => new Intl.NumberFormat("fr-DZ").format(n) + " DZD";
  return (
    <div className="bg-slate-50 p-3 rounded-lg">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="font-medium">{formatCurrency(value)}</p>
    </div>
  );
}
