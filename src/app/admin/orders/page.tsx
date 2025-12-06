"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Package,
  Search,
  RefreshCw,
  ExternalLink,
  LucideIcon,
  Lock,
  Unlock,
  Send,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerWilaya: string;
  deliveryProvider?: string;
  deliveryType?: string;
  shippingPrice?: number;
  trackingNumber?: string;
  trackingStatus?: string;
  total: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reservingOrderId, setReservingOrderId] = useState<string | null>(null);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders?pageSize=100")
      .then((res) => {
        if (res.ok) return res.json();
        return { items: [] };
      })
      .then((data) => {
        const ordersList = Array.isArray(data) ? data : data.items || [];
        setOrders(ordersList);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch orders", err);
        setLoading(false);
      });
  }, []);

  const toggleOrder = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(
          orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: newStatus,
                  trackingNumber: data.trackingNumber || o.trackingNumber,
                  trackingStatus: data.trackingStatus || o.trackingStatus,
                }
              : o,
          ),
        );

        if (data.shipmentCreated) {
          const provider = data.deliveryProvider || "transporteur";
          const message = `✅ Commande confirmée !\n\n📦 Expédition créée sur ${provider}\n🔢 Tracking: ${data.trackingNumber}`;

          if (data.label) {
            const openLabel = confirm(
              message + "\n\nVoulez-vous ouvrir le bordereau ?",
            );
            if (openLabel) {
              window.open(data.label, "_blank");
            }
          } else {
            alert(message);
          }
        } else if (data.shipmentError) {
          alert(
            `⚠️ Commande confirmée mais erreur création expédition:\n${data.shipmentError}\n\nVous pouvez créer l'expédition manuellement depuis la page Livraison.`,
          );
        } else if (newStatus === "CONFIRMED") {
          alert("✅ Commande confirmée !");
        }
      } else {
        alert("Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const handleSyncOrder = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.newStatus) {
          setOrders(
            orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    trackingStatus: data.newStatus,
                    status: data.orderStatus || o.status,
                  }
                : o,
            ),
          );
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    const ordersWithTracking = orders.filter((o) => o.trackingNumber);

    for (const order of ordersWithTracking) {
      await handleSyncOrder(order.id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setSyncingAll(false);
    alert(`✅ ${ordersWithTracking.length} commande(s) synchronisée(s)`);
  };

  const handleReserveStock = async (orderId: string) => {
    setReservingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "CONFIRMED",
                }
              : o,
          ),
        );
        alert(
          `✅ Stock réservé avec succès!\n\n${data.reservedItems || 0} matières réservées`,
        );
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Reserve error:", error);
      alert("Erreur lors de la réservation du stock");
    } finally {
      setReservingOrderId(null);
    }
  };

  const handleShipOrder = async (orderId: string) => {
    setShippingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "SHIPPED",
                }
              : o,
          ),
        );
        alert(`✅ Commande expédiée!\n\nStock consommé avec succès.`);
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Ship error:", error);
      alert("Erreur lors de l'expédition");
    } finally {
      setShippingOrderId(null);
    }
  };

  const handleCancelReservation = async (orderId: string) => {
    if (!confirm("Annuler la réservation de stock pour cette commande?"))
      return;

    try {
      const res = await fetch(`/api/orders/${orderId}/ship`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "PENDING",
                }
              : o,
          ),
        );
        alert(`✅ Réservation annulée`);
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Cancel reservation error:", error);
      alert("Erreur lors de l'annulation");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<
      string,
      { bg: string; text: string; icon: LucideIcon; label: string }
    > = {
      PENDING: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        icon: Clock,
        label: "En attente",
      },
      CONFIRMED: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        icon: CheckCircle,
        label: "Confirmée",
      },
      SHIPPED: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        icon: Truck,
        label: "Expédiée",
      },
      DELIVERED: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        icon: CheckCircle,
        label: "Livrée",
      },
      CANCELLED: {
        bg: "bg-red-50",
        text: "text-red-700",
        icon: XCircle,
        label: "Annulée",
      },
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          badge.bg,
          badge.text,
        )}
      >
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const statusFilters = [
    { value: "ALL", label: "Toutes" },
    { value: "PENDING", label: "En attente" },
    { value: "CONFIRMED", label: "Confirmées" },
    { value: "SHIPPED", label: "Expédiées" },
    { value: "DELIVERED", label: "Livrées" },
    { value: "CANCELLED", label: "Annulées" },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            Commandes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length} commande{orders.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
        >
          <RefreshCw size={16} className={syncingAll ? "animate-spin" : ""} />
          {syncingAll ? "Synchronisation..." : "Sync Livraisons"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Total
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">
            {orderStats.pending}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            En attente
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">
            {orderStats.confirmed}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Confirmées
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-purple-600">
            {orderStats.shipped}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Expédiées
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">
            {orderStats.delivered}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            Livrées
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2 md:pb-0 p-1">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  statusFilter === filter.value
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-widest text-gray-500 bg-gray-50/50">
              <th className="py-4 px-6 font-medium">Commande</th>
              <th className="py-4 px-6 font-medium">Client</th>
              <th className="py-4 px-6 font-medium">Date</th>
              <th className="py-4 px-6 font-medium">Total</th>
              <th className="py-4 px-6 font-medium">Statut</th>
              <th className="py-4 px-6 font-medium"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs uppercase tracking-wider">
                      Chargement...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                      <Package size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        Aucune commande trouvée
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Essayez de modifier vos filtres de recherche
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr
                    className={cn(
                      "hover:bg-gray-50/50 cursor-pointer transition-colors",
                      expandedOrder === order.id ? "bg-gray-50/50" : "",
                    )}
                    onClick={() => toggleOrder(order.id)}
                  >
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.customerPhone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {order.total?.toLocaleString()} DZD
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-6 text-right text-gray-400">
                      {expandedOrder === order.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr className="bg-gray-50/30">
                      <td colSpan={6} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Customer Info */}
                          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-serif font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <Package size={16} className="text-gray-400" />
                              Livraison
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="text-gray-900 font-medium">
                                  {order.customerAddress}
                                </p>
                                <p className="text-gray-500">
                                  {order.customerCity}, Wilaya{" "}
                                  {order.customerWilaya}
                                </p>
                              </div>
                              <div className="pt-3 border-t border-gray-50">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">
                                    Transporteur
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {order.deliveryProvider}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-500">Type</span>
                                  <span className="font-medium text-gray-900">
                                    {order.deliveryType === "HOME"
                                      ? "Domicile"
                                      : "Bureau"}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Frais</span>
                                  <span className="font-medium text-gray-900">
                                    {order.shippingPrice} DZD
                                  </span>
                                </div>
                              </div>
                              {/* Tracking Info */}
                              {order.trackingNumber && (
                                <div className="pt-3 mt-3 border-t border-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                                        Tracking
                                      </p>
                                      <p className="font-mono text-sm font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded inline-block">
                                        {order.trackingNumber}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSyncOrder(order.id);
                                        }}
                                        disabled={syncingOrderId === order.id}
                                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                                        title="Actualiser"
                                      >
                                        <RefreshCw
                                          size={14}
                                          className={
                                            syncingOrderId === order.id
                                              ? "animate-spin"
                                              : ""
                                          }
                                        />
                                      </button>
                                      <a
                                        href={`/suivi?tracking=${order.trackingNumber}`}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
                                        title="Voir le suivi"
                                      >
                                        <ExternalLink size={14} />
                                      </a>
                                    </div>
                                  </div>
                                  {order.trackingStatus && (
                                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                      <Truck size={12} /> {order.trackingStatus}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Items */}
                          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-serif font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <Package size={16} className="text-gray-400" />
                              Articles ({order.items?.length || 0})
                            </h4>
                            <div className="space-y-3">
                              {order.items?.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-sm group"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {item.productName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.size} • {item.color} • x
                                      {item.quantity}
                                    </p>
                                  </div>
                                  <span className="font-medium text-gray-900">
                                    {(
                                      item.price * item.quantity
                                    ).toLocaleString()}{" "}
                                    DZD
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Total
                              </span>
                              <span className="text-lg font-serif font-bold text-gray-900">
                                {order.total?.toLocaleString()} DZD
                              </span>
                            </div>
                          </div>

                          {/* Status Update */}
                          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-serif font-medium text-gray-900 mb-4 flex items-center gap-2">
                              <RefreshCw size={16} className="text-gray-400" />
                              Mise à jour
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  Statut
                                </label>
                                <select
                                  value={order.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(
                                      order.id,
                                      e.target.value,
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:border-gray-900 outline-none bg-white transition-colors"
                                >
                                  <option value="PENDING">En attente</option>
                                  <option value="CONFIRMED">Confirmée</option>
                                  <option value="SHIPPED">Expédiée</option>
                                  <option value="DELIVERED">Livrée</option>
                                  <option value="CANCELLED">Annulée</option>
                                </select>
                              </div>

                              {/* Stock Actions */}
                              <div className="pt-4 border-t border-gray-50">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                  Actions Stock
                                </label>
                                <div className="space-y-2">
                                  {order.status === "PENDING" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReserveStock(order.id);
                                      }}
                                      disabled={reservingOrderId === order.id}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all text-sm font-medium"
                                    >
                                      <Lock
                                        size={14}
                                        className={
                                          reservingOrderId === order.id
                                            ? "animate-pulse"
                                            : ""
                                        }
                                      />
                                      {reservingOrderId === order.id
                                        ? "Réservation..."
                                        : "Réserver le stock"}
                                    </button>
                                  )}

                                  {order.status === "CONFIRMED" && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShipOrder(order.id);
                                        }}
                                        disabled={shippingOrderId === order.id}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all text-sm font-medium"
                                      >
                                        <Send
                                          size={14}
                                          className={
                                            shippingOrderId === order.id
                                              ? "animate-pulse"
                                              : ""
                                          }
                                        />
                                        {shippingOrderId === order.id
                                          ? "Expédition..."
                                          : "Expédier (consommer stock)"}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelReservation(order.id);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                      >
                                        <Unlock size={14} />
                                        Annuler réservation
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-gray-50">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">
                                    Sous-total
                                  </span>
                                  <span>
                                    {(
                                      order.total - (order.shippingPrice || 0)
                                    ).toLocaleString()}{" "}
                                    DZD
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                  <span className="text-gray-500">
                                    Livraison
                                  </span>
                                  <span>
                                    {order.shippingPrice?.toLocaleString()} DZD
                                  </span>
                                </div>
                                <div className="flex justify-between font-serif font-bold text-lg mt-3 pt-3 border-t border-gray-50 text-gray-900">
                                  <span>Total</span>
                                  <span>
                                    {order.total?.toLocaleString()} DZD
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
