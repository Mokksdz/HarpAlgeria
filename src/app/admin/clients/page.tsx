"use client";

import { useEffect, useState, Fragment, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Crown,
  Mail,
  Phone,
  ShoppingBag,
  Loader2,
  FileJson,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  MapPin,
  Calendar,
  Heart,
  Coins,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customerWilaya: string;
  customerCity: string;
};

type Client = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  birthDate: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  loyaltyPoints: number;
  vipLevel: string;
  isEmailVerified: boolean;
  createdVia: string;
  orderCount: number;
  wishlistCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  lastOrderStatus: string | null;
  lastAddress: {
    wilaya: string;
    city: string;
    address: string;
  } | null;
  recentOrders: Order[];
};

type VipLevel = "ALL" | "SILVER" | "GOLD" | "BLACK";

const vipColors: Record<string, string> = {
  SILVER: "bg-gray-100 text-gray-700",
  GOLD: "bg-amber-100 text-amber-700",
  BLACK: "bg-gray-900 text-white",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function AdminClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [vipFilter, setVipFilter] = useState<VipLevel>("ALL");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          pageSize: String(pageSize),
          vipLevel: vipFilter,
        });
        if (search) params.set("search", search);

        const res = await fetch(`/api/v3/compta/clients?${params.toString()}`, {
          credentials: "include",
        });
        const json = await res.json();

        if (json?.success) {
          setItems(json.items);
          setPage(json.meta.page);
          setTotalPages(json.meta.totalPages);
          setTotal(json.meta.total);
        } else {
          console.error(json?.error || "Erreur");
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    },
    [pageSize, vipFilter, search],
  );

  useEffect(() => {
    // Initial fetch
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: String(pageSize),
          vipLevel: vipFilter,
        });
        if (search) params.set("search", search);
        const res = await fetch(`/api/v3/compta/clients?${params.toString()}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const json = await res.json();
        if (json?.success) {
          setItems(json.items);
          setPage(json.meta.page);
          setTotalPages(json.meta.totalPages);
          setTotal(json.meta.total);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      }
      setLoading(false);
    })();
    return () => controller.abort();
  }, [pageSize, vipFilter, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchPage(1);
  }

  async function onExport(format: "csv" | "json") {
    setExporting(true);
    setShowExportMenu(false);

    const params = new URLSearchParams({ format, vipLevel: vipFilter });
    if (search) params.set("search", search);

    // Open download in new tab
    window.open(`/api/v3/compta/clients/export?${params.toString()}`, "_blank");

    setTimeout(() => setExporting(false), 2000);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-medium text-gray-900 flex items-center gap-3">
            <Users className="text-harp-brown" />
            Clients
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} client{total > 1 ? "s" : ""} enregistré
            {total > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPage(page)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-harp-brown text-white rounded-lg hover:bg-harp-caramel transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Exporter
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10">
                <button
                  onClick={() => onExport("csv")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  Export CSV
                </button>
                <button
                  onClick={() => onExport("json")}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileJson size={16} className="text-blue-600" />
                  Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par email, nom ou téléphone..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-harp-brown/20 focus:border-harp-brown outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Rechercher
            </button>
          </form>

          {/* VIP Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={vipFilter}
              onChange={(e) => setVipFilter(e.target.value as VipLevel)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-harp-brown/20 focus:border-harp-brown outline-none cursor-pointer"
            >
              <option value="ALL">Tous les niveaux</option>
              <option value="SILVER">🥈 Silver</option>
              <option value="GOLD">🥇 Gold</option>
              <option value="BLACK">👑 Black</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-8 p-4"></th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total dépensé
                </th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  VIP
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2
                      size={24}
                      className="animate-spin mx-auto text-gray-400"
                    />
                    <p className="text-sm text-gray-500 mt-2">Chargement...</p>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucun client trouvé</p>
                  </td>
                </tr>
              ) : (
                items.map((client) => (
                  <Fragment key={client.id}>
                    <tr
                      className={cn(
                        "border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer",
                        expandedClient === client.id && "bg-harp-cream/30",
                      )}
                      onClick={() =>
                        setExpandedClient(
                          expandedClient === client.id ? null : client.id,
                        )
                      }
                    >
                      <td className="p-4">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          {expandedClient === client.id ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {client.name || "—"}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail size={12} />
                            {client.email}
                            {client.isEmailVerified && (
                              <span className="text-green-500 text-[10px]">
                                ✓
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Inscrit le{" "}
                            {new Date(client.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {client.phone ? (
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone size={12} />
                              {client.phone}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                          {client.birthDate && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(client.birthDate).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {client.lastAddress ? (
                          <div className="text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <MapPin size={12} />
                              {client.lastAddress.city}
                            </span>
                            <span className="text-xs text-gray-400">
                              Wilaya {client.lastAddress.wilaya}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                            <ShoppingBag size={14} />
                            {client.orderCount}
                          </span>
                          {client.lastOrderDate && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              Dernière:{" "}
                              {new Date(
                                client.lastOrderDate,
                              ).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-semibold text-green-600">
                          {client.totalSpent.toLocaleString()} DZD
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Coins size={14} className="text-amber-500" />
                          <span className="text-sm font-medium text-harp-brown">
                            {client.loyaltyPoints}
                          </span>
                        </div>
                        {client.wishlistCount > 0 && (
                          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mt-1">
                            <Heart size={10} /> {client.wishlistCount} wishlist
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                            vipColors[client.vipLevel] ||
                              "bg-gray-100 text-gray-600",
                          )}
                        >
                          {client.vipLevel === "BLACK" && <Crown size={12} />}
                          {client.vipLevel}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedClient === client.id && (
                      <tr className="bg-harp-cream/20">
                        <td colSpan={8} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Client Details */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Users size={16} />
                                Informations client
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">ID</span>
                                  <span className="font-mono text-xs text-gray-600">
                                    {client.id.slice(0, 12)}...
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Rôle</span>
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-xs",
                                      client.role === "admin"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-600",
                                    )}
                                  >
                                    {client.role}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Inscription via
                                  </span>
                                  <span className="text-gray-600">
                                    {client.createdVia}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">
                                    Email vérifié
                                  </span>
                                  <span
                                    className={
                                      client.isEmailVerified
                                        ? "text-green-600"
                                        : "text-red-500"
                                    }
                                  >
                                    {client.isEmailVerified ? "Oui ✓" : "Non"}
                                  </span>
                                </div>
                                {client.lastAddress && (
                                  <div className="pt-2 border-t">
                                    <span className="text-gray-500 block mb-1">
                                      Adresse
                                    </span>
                                    <p className="text-gray-700 text-xs">
                                      {client.lastAddress.address}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                      {client.lastAddress.city}, Wilaya{" "}
                                      {client.lastAddress.wilaya}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Recent Orders */}
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 md:col-span-2">
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Package size={16} />
                                Dernières commandes ({client.orderCount} total)
                              </h4>
                              {client.recentOrders.length > 0 ? (
                                <div className="space-y-2">
                                  {client.recentOrders
                                    .slice(0, 5)
                                    .map((order) => (
                                      <div
                                        key={order.id}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Link
                                            href={`/admin/orders?search=${order.orderNumber}`}
                                            className="font-mono text-xs text-harp-brown hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            #{order.orderNumber.slice(-8)}
                                          </Link>
                                          <span
                                            className={cn(
                                              "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                              statusColors[order.status] ||
                                                "bg-gray-100 text-gray-600",
                                            )}
                                          >
                                            {order.status}
                                          </span>
                                        </div>
                                        <div className="text-right">
                                          <span className="font-medium text-gray-900">
                                            {Number(
                                              order.total,
                                            ).toLocaleString()}{" "}
                                            DZD
                                          </span>
                                          <p className="text-[10px] text-gray-400">
                                            {new Date(
                                              order.createdAt,
                                            ).toLocaleDateString("fr-FR")}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 text-center py-4">
                                  Aucune commande
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {page} sur {totalPages} ({total} résultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPage(page - 1)}
                disabled={page === 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              <button
                onClick={() => fetchPage(page + 1)}
                disabled={page === totalPages || loading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
