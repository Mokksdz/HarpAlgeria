"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, ArrowRight, CheckCircle } from "lucide-react";

interface Advance {
  id: string;
  advanceNumber: string;
  supplier: { id: string; name: string; code: string };
  amount: number;
  amountRemaining: number;
}

interface Purchase {
  id: string;
  purchaseNumber: string;
  invoiceNumber?: string;
  totalAmount: number;
  amountDue: number;
  status: string;
}

export default function ApplyAdvancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [advance, setAdvance] = useState<Advance | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v3/compta/advances/${id}`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
      fetch("/api/v3/compta/purchases?status=ORDERED&limit=50", {
        credentials: "include",
      }).then((r) => r.json()),
    ]).then(([advData, purchData]) => {
      if (advData.success) {
        setAdvance(advData.advance);
        setAmount(advData.advance.amountRemaining);
      }
      if (purchData.success) {
        // Filter purchases from same supplier with amount due
        const filtered = purchData.items.filter(
          (p: Purchase) => p.amountDue > 0,
        );
        setPurchases(filtered);
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPurchase || amount <= 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v3/compta/advances/${id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: selectedPurchase,
          amount,
        }),
      });

      const result = await res.json();
      if (result.success) {
        router.push("/admin/compta/advances");
      } else {
        alert(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";

  if (loading)
    return (
      <div className="text-center py-12 text-slate-500">Chargement...</div>
    );
  if (!advance)
    return (
      <div className="text-center py-12 text-red-500">Avance non trouvée</div>
    );

  const selectedPurchaseData = purchases.find((p) => p.id === selectedPurchase);
  const maxAmount = Math.min(
    advance.amountRemaining,
    selectedPurchaseData?.amountDue || 0,
  );

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
          <h1 className="text-2xl font-serif">Appliquer Avance</h1>
          <p className="text-sm text-slate-600">{advance.advanceNumber}</p>
        </div>
      </header>

      {/* Advance Info */}
      <div className="bg-green-50 p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-green-100 rounded-xl">
          <Wallet className="text-green-600" size={24} />
        </div>
        <div className="flex-1">
          <p className="font-medium">{advance.supplier.name}</p>
          <p className="text-sm text-green-700">
            Disponible:{" "}
            <span className="font-bold">
              {formatCurrency(advance.amountRemaining)}
            </span>
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Achat à régler
          </label>
          <select
            value={selectedPurchase}
            onChange={(e) => {
              setSelectedPurchase(e.target.value);
              const p = purchases.find((p) => p.id === e.target.value);
              if (p) setAmount(Math.min(advance.amountRemaining, p.amountDue));
            }}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            required
          >
            <option value="">Sélectionner un achat...</option>
            {purchases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.purchaseNumber} — Dû: {formatCurrency(p.amountDue)}
              </option>
            ))}
          </select>
        </div>

        {selectedPurchaseData && (
          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total achat</span>
              <span>{formatCurrency(selectedPurchaseData.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Reste dû</span>
              <span className="text-orange-600 font-medium">
                {formatCurrency(selectedPurchaseData.amountDue)}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Montant à appliquer
          </label>
          <input
            type="number"
            min="1"
            max={maxAmount}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-harp-brown/20"
            required
          />
          {selectedPurchaseData && (
            <p className="text-xs text-slate-500 mt-1">
              Maximum: {formatCurrency(maxAmount)}
            </p>
          )}
        </div>

        {/* Preview */}
        {selectedPurchaseData && amount > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Après application:
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex-1">
                <p className="text-slate-600">Avance restante</p>
                <p className="font-bold text-blue-600">
                  {formatCurrency(advance.amountRemaining - amount)}
                </p>
              </div>
              <ArrowRight className="text-slate-400" size={20} />
              <div className="flex-1">
                <p className="text-slate-600">Achat restant dû</p>
                <p className="font-bold text-green-600">
                  {formatCurrency(selectedPurchaseData.amountDue - amount)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href="/admin/compta/advances"
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={
              submitting ||
              !selectedPurchase ||
              amount <= 0 ||
              amount > maxAmount
            }
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle size={18} />
            {submitting ? "Application..." : "Appliquer l'avance"}
          </button>
        </div>
      </form>
    </div>
  );
}
