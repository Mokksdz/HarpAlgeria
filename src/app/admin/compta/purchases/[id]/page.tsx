"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Purchase {
  id: string;
  purchaseNumber: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  supplier: { id: string; name: string; code: string };
  items: Array<{
    id: string;
    inventoryItem: { id: string; sku: string; name: string; unit: string };
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    totalPrice: number;
    unit: string;
  }>;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  advanceApplied: number;
  amountDue: number;
  status: string;
  notes?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  DRAFT: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
  ORDERED: {
    label: "Commandé",
    color: "bg-blue-100 text-blue-700",
    icon: Package,
  },
  PARTIAL: {
    label: "Partiel",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertCircle,
  },
  RECEIVED: {
    label: "Reçu",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Annulé",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
};

export default function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v3/compta/purchases/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPurchase(data.purchase);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Supprimer cet achat ?")) return;
    const res = await fetch(`/api/v3/compta/purchases/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (data.success) router.push("/admin/compta/purchases");
    else alert(data.error);
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/v3/compta/purchases/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) setPurchase(data.purchase);
    else alert(data.error);
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-DZ").format(n) + " DZD";
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "-";

  if (loading)
    return (
      <div className="text-center py-12 text-slate-500">Chargement...</div>
    );
  if (!purchase)
    return (
      <div className="text-center py-12 text-red-500">Achat non trouvé</div>
    );

  const status = statusConfig[purchase.status] || statusConfig.DRAFT;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/compta/purchases"
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif">{purchase.purchaseNumber}</h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${status.color}`}
              >
                <StatusIcon size={14} /> {status.label}
              </span>
            </div>
            <p className="text-sm text-slate-600">{purchase.supplier.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {purchase.status === "DRAFT" && (
            <>
              <button
                onClick={() => handleStatusChange("ORDERED")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Passer en commande
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          {(purchase.status === "ORDERED" || purchase.status === "PARTIAL") && (
            <Link
              href={`/admin/compta/purchases/${id}/receive`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Truck size={16} /> Recevoir
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Info */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Détails de la commande</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Fournisseur</p>
                <p className="font-medium">{purchase.supplier.name}</p>
                <p className="text-xs text-slate-400">
                  {purchase.supplier.code}
                </p>
              </div>
              <div>
                <p className="text-slate-500">N° Facture</p>
                <p className="font-medium">{purchase.invoiceNumber || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Date commande</p>
                <p className="font-medium">{formatDate(purchase.orderDate)}</p>
              </div>
              <div>
                <p className="text-slate-500">Livraison prévue</p>
                <p className="font-medium">
                  {formatDate(purchase.expectedDate)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Date réception</p>
                <p className="font-medium">
                  {formatDate(purchase.receivedDate)}
                </p>
              </div>
              {purchase.notes && (
                <div className="col-span-3">
                  <p className="text-slate-500">Notes</p>
                  <p>{purchase.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">
                Articles ({purchase.items.length})
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-sm text-slate-600">
                <tr>
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3 text-center">Commandé</th>
                  <th className="px-4 py-3 text-center">Reçu</th>
                  <th className="px-4 py-3 text-right">Prix unit.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchase.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {item.inventoryItem.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.inventoryItem.sku}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.quantityOrdered} {item.unit.toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          item.quantityReceived >= item.quantityOrdered
                            ? "text-green-600"
                            : "text-orange-600"
                        }
                      >
                        {item.quantityReceived}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow">
            <h3 className="font-medium mb-4">Montants</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <span>{formatCurrency(purchase.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Taxes</span>
                <span>{formatCurrency(purchase.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Frais livraison</span>
                <span>{formatCurrency(purchase.shippingCost)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(purchase.totalAmount)}</span>
              </div>
              {purchase.advanceApplied > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Avance appliquée</span>
                  <span>-{formatCurrency(purchase.advanceApplied)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Reste à payer</span>
                <span
                  className={
                    purchase.amountDue > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }
                >
                  {formatCurrency(purchase.amountDue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
