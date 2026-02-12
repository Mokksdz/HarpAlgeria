"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Truck,
  Package,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Send,
  MapPin,
  Phone,
  Clock,
  Loader2,
  ArrowLeft,
  Wifi,
  WifiOff,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DeliveryProvider = "zrexpress" | "yalidine";

// Full list of 69 Algerian wilayas (mirrors WILAYAS in zrexpress.ts)
const WILAYAS_LIST = [
  { id: "1", name: "Adrar", name_ar: "أدرار" },
  { id: "2", name: "Chlef", name_ar: "الشلف" },
  { id: "3", name: "Laghouat", name_ar: "الأغواط" },
  { id: "4", name: "Oum El Bouaghi", name_ar: "أم البواقي" },
  { id: "5", name: "Batna", name_ar: "باتنة" },
  { id: "6", name: "Béjaïa", name_ar: "بجاية" },
  { id: "7", name: "Biskra", name_ar: "بسكرة" },
  { id: "8", name: "Béchar", name_ar: "بشار" },
  { id: "9", name: "Blida", name_ar: "البليدة" },
  { id: "10", name: "Bouira", name_ar: "البويرة" },
  { id: "11", name: "Tamanrasset", name_ar: "تمنراست" },
  { id: "12", name: "Tébessa", name_ar: "تبسة" },
  { id: "13", name: "Tlemcen", name_ar: "تلمسان" },
  { id: "14", name: "Tiaret", name_ar: "تيارت" },
  { id: "15", name: "Tizi Ouzou", name_ar: "تيزي وزو" },
  { id: "16", name: "Alger", name_ar: "الجزائر" },
  { id: "17", name: "Djelfa", name_ar: "الجلفة" },
  { id: "18", name: "Jijel", name_ar: "جيجل" },
  { id: "19", name: "Sétif", name_ar: "سطيف" },
  { id: "20", name: "Saïda", name_ar: "سعيدة" },
  { id: "21", name: "Skikda", name_ar: "سكيكدة" },
  { id: "22", name: "Sidi Bel Abbès", name_ar: "سيدي بلعباس" },
  { id: "23", name: "Annaba", name_ar: "عنابة" },
  { id: "24", name: "Guelma", name_ar: "قالمة" },
  { id: "25", name: "Constantine", name_ar: "قسنطينة" },
  { id: "26", name: "Médéa", name_ar: "المدية" },
  { id: "27", name: "Mostaganem", name_ar: "مستغانم" },
  { id: "28", name: "M'Sila", name_ar: "المسيلة" },
  { id: "29", name: "Mascara", name_ar: "معسكر" },
  { id: "30", name: "Ouargla", name_ar: "ورقلة" },
  { id: "31", name: "Oran", name_ar: "وهران" },
  { id: "32", name: "El Bayadh", name_ar: "البيض" },
  { id: "33", name: "Illizi", name_ar: "إليزي" },
  { id: "34", name: "Bordj Bou Arreridj", name_ar: "برج بوعريريج" },
  { id: "35", name: "Boumerdès", name_ar: "بومرداس" },
  { id: "36", name: "El Tarf", name_ar: "الطارف" },
  { id: "37", name: "Tindouf", name_ar: "تندوف" },
  { id: "38", name: "Tissemsilt", name_ar: "تيسمسيلت" },
  { id: "39", name: "El Oued", name_ar: "الوادي" },
  { id: "40", name: "Khenchela", name_ar: "خنشلة" },
  { id: "41", name: "Souk Ahras", name_ar: "سوق أهراس" },
  { id: "42", name: "Tipaza", name_ar: "تيبازة" },
  { id: "43", name: "Mila", name_ar: "ميلة" },
  { id: "44", name: "Aïn Defla", name_ar: "عين الدفلى" },
  { id: "45", name: "Naâma", name_ar: "النعامة" },
  { id: "46", name: "Aïn Témouchent", name_ar: "عين تموشنت" },
  { id: "47", name: "Ghardaïa", name_ar: "غرداية" },
  { id: "48", name: "Relizane", name_ar: "غليزان" },
  { id: "49", name: "El M'Ghair", name_ar: "المغير" },
  { id: "50", name: "El Meniaa", name_ar: "المنيعة" },
  { id: "51", name: "Ouled Djellal", name_ar: "أولاد جلال" },
  { id: "52", name: "Bordj Baji Mokhtar", name_ar: "برج باجي مختار" },
  { id: "53", name: "Béni Abbès", name_ar: "بني عباس" },
  { id: "54", name: "Timimoun", name_ar: "تيميمون" },
  { id: "55", name: "Touggourt", name_ar: "تقرت" },
  { id: "56", name: "Djanet", name_ar: "جانت" },
  { id: "57", name: "In Salah", name_ar: "عين صالح" },
  { id: "58", name: "In Guezzam", name_ar: "عين قزام" },
  { id: "59", name: "Aflou", name_ar: "أفلو" },
  { id: "60", name: "Barika", name_ar: "بريكة" },
  { id: "61", name: "Ksar Chellala", name_ar: "قصر الشلالة" },
  { id: "62", name: "Messaad", name_ar: "مسعد" },
  { id: "63", name: "Aïn Oussara", name_ar: "عين وسارة" },
  { id: "64", name: "Bou Saâda", name_ar: "بوسعادة" },
  { id: "65", name: "El Abiodh Sidi Cheikh", name_ar: "الأبيض سيدي الشيخ" },
  { id: "66", name: "El Kantara", name_ar: "القنطرة" },
  { id: "67", name: "Bir El Ater", name_ar: "بئر العاتر" },
  { id: "68", name: "Ksar El Boukhari", name_ar: "قصر البخاري" },
  { id: "69", name: "El Aricha", name_ar: "العريشة" },
];

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerWilaya: string;
  deliveryType: string;
  deliveryProvider: string | null;
  trackingNumber: string | null;
  trackingStatus: string | null;
  total: number;
  status: string;
  createdAt: string;
  items: { id: string; productName: string; quantity: number }[];
}

interface ProviderStatus {
  zrexpress: boolean | null;
  yalidine: boolean | null;
}

export default function ShippingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({
    zrexpress: null,
    yalidine: null,
  });
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "shipped">("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier la connexion aux deux services
  const checkConnections = async () => {
    // Check ZR Express
    try {
      const zrRes = await fetch("/api/shipping");
      if (zrRes.ok) {
        const zrData = await zrRes.json();
        setProviderStatus((prev) => ({
          ...prev,
          zrexpress: zrData.connected || false,
        }));
      } else if (zrRes.status === 401) {
        // Shipping API: waiting for authentication
      } else {
        setProviderStatus((prev) => ({ ...prev, zrexpress: false }));
      }
    } catch {
      setProviderStatus((prev) => ({ ...prev, zrexpress: false }));
    }

    // Check Yalidine
    try {
      const yalRes = await fetch("/api/shipping/yalidine");
      if (yalRes.ok) {
        const yalData = await yalRes.json();
        setProviderStatus((prev) => ({
          ...prev,
          yalidine: yalData.connected || false,
        }));
      } else if (yalRes.status === 401) {
        // Yalidine API: waiting for authentication
      } else {
        setProviderStatus((prev) => ({ ...prev, yalidine: false }));
      }
    } catch {
      setProviderStatus((prev) => ({ ...prev, yalidine: false }));
    }
  };

  // Charger les commandes
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/orders?pageSize=100");
      const data = await res.json();
      const ordersList = Array.isArray(data) ? data : data.items || [];
      setOrders(ordersList);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Sync all active shipments at once
  const syncAllTracking = async () => {
    const activeOrders = orders.filter(
      (o) => o.trackingNumber && (o.status === "CONFIRMED" || o.status === "SHIPPED"),
    );
    if (activeOrders.length === 0) return;

    setSyncingAll(true);
    try {
      await Promise.all(
        activeOrders.map(async (order) => {
          try {
            await fetch("/api/tracking", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            });
          } catch {
            // Individual errors are ok
          }
        }),
      );
      await fetchOrders(true);
    } catch (error) {
      console.error("Error syncing all:", error);
    } finally {
      setSyncingAll(false);
    }
  };

  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      checkConnections();
    }
    fetchOrders();
  }, [status, fetchOrders]);

  // Auto-polling every 60 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchOrders(true);
    }, 60_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchOrders]);

  // Créer une expédition avec le provider sélectionné
  const createShipment = async (order: Order, provider: DeliveryProvider) => {
    setCreating(order.id);

    try {
      const productsList = order.items
        .map((item) => `${item.quantity}x ${item.productName}`)
        .join(", ");

      let apiUrl = "/api/shipping";
      let providerName = "ZR Express";
      let requestBody: Record<string, unknown> = {};

      if (provider === "yalidine") {
        apiUrl = "/api/shipping/yalidine";
        providerName = "Yalidine";
        requestBody = {
          orderId: order.id,
          orderData: {
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            address: order.customerAddress || order.customerCity || "N/A",
            commune: order.customerCity,
            wilaya: order.customerWilaya,
            total: order.total,
            deliveryType:
              order.deliveryType === "STOP_DESK" ? "STOP_DESK" : "DOMICILE",
            items: order.items,
            fromWilaya: "Alger",
          },
        };
      } else {
        requestBody = {
          orderId: order.id,
          orderData: {
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            address: order.customerAddress || order.customerCity || "N/A",
            commune: order.customerCity,
            wilayaId: getWilayaId(order.customerWilaya),
            total: order.total,
            deliveryType: order.deliveryType || "DOMICILE",
            products: productsList,
          },
        };
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.success) {
        await fetch(`/api/orders/${order.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingNumber: data.tracking,
            status: "SHIPPED",
            deliveryProvider: providerName,
          }),
        });
        fetchOrders();

        if (data.label) {
          const openLabel = confirm(
            `✅ Expédition créée via ${providerName}!\nTracking: ${data.tracking}\n\nVoulez-vous ouvrir le bordereau ?`,
          );
          if (openLabel) {
            window.open(data.label, "_blank");
          }
        } else {
          alert(
            `✅ Expédition créée via ${providerName}!\nTracking: ${data.tracking}`,
          );
        }
      } else {
        alert("❌ Erreur: " + (data.error || "Échec de création"));
      }
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert("❌ Erreur de connexion");
    } finally {
      setCreating(null);
    }
  };

  // Synchroniser le statut via le endpoint unifié
  const syncTracking = async (order: Order) => {
    if (!order.trackingNumber) return;

    setSyncing(order.id);
    try {
      const res = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrders(true);
      }
    } catch (error) {
      console.error("Error syncing:", error);
    } finally {
      setSyncing(null);
    }
  };

  // Obtenir le lien de suivi selon le provider
  const getTrackingUrl = (order: Order): string => {
    if (!order.trackingNumber) return "#";
    const isYalidine =
      order.deliveryProvider === "Yalidine" ||
      order.trackingNumber.startsWith("yal-");
    if (isYalidine) {
      return `https://yalidine.app/track/${order.trackingNumber}`;
    }
    return `https://zrexpress.com/suivi/${order.trackingNumber}`;
  };

  // Helper pour obtenir l'ID de wilaya
  const getWilayaId = (wilayaName: string): string => {
    if (!wilayaName) return "16";
    const name = wilayaName.toLowerCase().trim();

    // Try exact match on name first, then partial match
    const match = WILAYAS_LIST.find(
      (w) =>
        w.name.toLowerCase() === name ||
        w.id === name ||
        w.name_ar === wilayaName,
    ) || WILAYAS_LIST.find(
      (w) => w.name.toLowerCase().includes(name) || name.includes(w.name.toLowerCase()),
    );

    return match?.id || wilayaName;
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "pending")
      return !order.trackingNumber && order.status !== "CANCELLED";
    if (filter === "shipped") return !!order.trackingNumber;
    return true;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-100",
      CONFIRMED: "bg-blue-50 text-blue-700 border-blue-100",
      SHIPPED: "bg-purple-50 text-purple-700 border-purple-100",
      DELIVERED: "bg-green-50 text-green-700 border-green-100",
      CANCELLED: "bg-red-50 text-red-700 border-red-100",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-100";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-serif font-medium text-gray-900">
              Gestion des Livraisons
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-gray-500 text-sm">
              Gérez vos expéditions via Yalidine et ZR Express
            </p>
            {lastRefresh && (
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                Maj {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        {/* Connection Status + Sync All */}
        <div className="flex items-center gap-3">
          <button
            onClick={syncAllTracking}
            disabled={syncingAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-all"
            title="Synchroniser tous les statuts"
          >
            <RefreshCw size={12} className={syncingAll ? "animate-spin" : ""} />
            {syncingAll ? "Sync..." : "Sync tout"}
          </button>
          {/* Yalidine Status */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
              providerStatus.yalidine === true
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : providerStatus.yalidine === false
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-gray-50 text-gray-600 border-gray-100",
            )}
          >
            {providerStatus.yalidine === true ? (
              <Wifi size={12} />
            ) : providerStatus.yalidine === false ? (
              <WifiOff size={12} />
            ) : (
              <Loader2 size={12} className="animate-spin" />
            )}
            <span>Yalidine</span>
          </div>

          {/* ZR Express Status */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
              providerStatus.zrexpress === true
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : providerStatus.zrexpress === false
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-gray-50 text-gray-600 border-gray-100",
            )}
          >
            {providerStatus.zrexpress === true ? (
              <Wifi size={12} />
            ) : providerStatus.zrexpress === false ? (
              <WifiOff size={12} />
            ) : (
              <Loader2 size={12} className="animate-spin" />
            )}
            <span>ZR Express</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">À expédier</p>
            <p className="text-2xl font-serif font-medium text-gray-900">
              {
                orders.filter(
                  (o) => !o.trackingNumber && o.status !== "CANCELLED",
                ).length
              }
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">En transit</p>
            <p className="text-2xl font-serif font-medium text-gray-900">
              {
                orders.filter((o) => o.trackingNumber && o.status === "SHIPPED")
                  .length
              }
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Livrées</p>
            <p className="text-2xl font-serif font-medium text-gray-900">
              {orders.filter((o) => o.status === "DELIVERED").length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Box size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total expédiées</p>
            <p className="text-2xl font-serif font-medium text-gray-900">
              {orders.filter((o) => o.trackingNumber).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-100 pb-4">
        {[
          { key: "all", label: "Toutes" },
          { key: "pending", label: "À expédier" },
          { key: "shipped", label: "Expédiées" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as "all" | "pending" | "shipped")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              filter === f.key
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-widest text-gray-500">
                <th className="py-4 px-6 font-medium">Commande</th>
                <th className="py-4 px-6 font-medium">Client</th>
                <th className="py-4 px-6 font-medium">Destination</th>
                <th className="py-4 px-6 font-medium">Tracking</th>
                <th className="py-4 px-6 font-medium">Statut</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs text-gray-500 mb-1">
                        #{order.id.slice(-8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-900">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {order.customerPhone}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-1.5">
                        <MapPin
                          size={14}
                          className="text-gray-400 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm text-gray-900 font-medium">
                            {order.customerCity}, {order.customerWilaya}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">
                            {order.customerAddress}
                          </p>
                          {order.deliveryType && (
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                              {order.deliveryType === "DESK" || order.deliveryType === "STOP_DESK" ? "Point relais" : "Domicile"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {order.trackingNumber ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-100">
                            <Package size={10} className="text-gray-400" />
                            {order.trackingNumber}
                          </span>
                          {order.trackingStatus && (
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                              {order.trackingStatus}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">
                          Non expédié
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          getStatusColor(order.status),
                        )}
                      >
                        {order.status === "DELIVERED" && (
                          <CheckCircle size={12} />
                        )}
                        {order.status === "SHIPPED" && <Truck size={12} />}
                        {order.status === "PENDING" && <Clock size={12} />}
                        {order.status === "CONFIRMED" && (
                          <CheckCircle size={12} />
                        )}
                        {order.status === "CANCELLED" && <WifiOff size={12} />}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!order.trackingNumber &&
                        order.status !== "CANCELLED" ? (
                          <div className="flex items-center gap-2">
                            {/* Show customer's chosen provider */}
                            {order.deliveryProvider && (
                              <span
                                className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border",
                                  order.deliveryProvider === "Yalidine"
                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                    : "bg-orange-50 text-orange-700 border-orange-100",
                                )}
                              >
                                {order.deliveryProvider}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                const provider: DeliveryProvider =
                                  order.deliveryProvider === "ZR Express" || order.deliveryProvider === "zrexpress"
                                    ? "zrexpress"
                                    : "yalidine";
                                const providerLabel = provider === "zrexpress" ? "ZR Express" : "Yalidine";
                                if (!confirm(`Expédier la commande #${order.id.slice(0, 8)} via ${providerLabel} ?\n\n${order.customerName} — ${order.customerCity}, ${order.customerWilaya}\nTotal: ${order.total} DA`)) return;
                                createShipment(order, provider);
                              }}
                              disabled={creating === order.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                            >
                              {creating === order.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              Expédier
                            </button>
                          </div>
                        ) : order.trackingNumber ? (
                          <div className="flex items-center justify-end gap-1">
                            {/* Provider Badge */}
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border mr-1",
                                order.deliveryProvider === "Yalidine"
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : "bg-orange-50 text-orange-700 border-orange-100",
                              )}
                            >
                              {order.deliveryProvider || "ZR"}
                            </span>
                            <button
                              onClick={() => syncTracking(order)}
                              disabled={syncing === order.id}
                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Synchroniser le statut"
                            >
                              <RefreshCw
                                size={16}
                                className={
                                  syncing === order.id ? "animate-spin" : ""
                                }
                              />
                            </button>
                            <a
                              href={getTrackingUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Suivre le colis"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
