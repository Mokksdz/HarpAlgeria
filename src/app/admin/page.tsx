"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Package,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Plus,
  Eye,
  BarChart3,
  FolderOpen,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  totalRevenue: number;
  recentOrders: any[];
  topProducts: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/orders?pageSize=100"),
        fetch("/api/products?pageSize=100"),
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();

      // Handle paginated response format { items, meta }
      const ordersArray = Array.isArray(ordersData)
        ? ordersData
        : ordersData.items || [];
      const productsArray = Array.isArray(productsData)
        ? productsData
        : productsData.items || [];

      const pendingOrders = ordersArray.filter(
        (o: any) => o.status === "PENDING",
      ).length;
      const confirmedOrders = ordersArray.filter(
        (o: any) => o.status === "CONFIRMED",
      ).length;
      const shippedOrders = ordersArray.filter(
        (o: any) => o.status === "SHIPPED",
      ).length;
      const deliveredOrders = ordersArray.filter(
        (o: any) => o.status === "DELIVERED",
      ).length;
      const lowStockProducts = productsArray.filter(
        (p: any) => (p.stock || 0) < 5,
      ).length;
      const totalRevenue = ordersArray
        .filter((o: any) => o.status !== "CANCELLED")
        .reduce((acc: number, o: any) => acc + (o.total || 0), 0);

      setStats({
        totalOrders: ordersArray.length,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        totalProducts: productsArray.length,
        lowStockProducts,
        totalRevenue,
        recentOrders: ordersArray.slice(0, 5),
        topProducts: productsArray.slice(0, 4),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<
      string,
      { bg: string; text: string; icon: any; label: string }
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
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          badge.bg,
          badge.text,
        )}
      >
        <badge.icon size={12} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-gray-50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gray-50 rounded-xl h-96" />
          <div className="bg-gray-50 rounded-xl h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            {getGreeting()}, Admin
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="p-2.5 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            Nouveau produit
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Revenu Total"
          value={`${stats.totalRevenue.toLocaleString()} DZD`}
          icon={DollarSign}
          color="emerald"
          trend="+12% vs mois dernier"
        />
        <KpiCard
          label="Commandes"
          value={stats.totalOrders.toString()}
          icon={ShoppingBag}
          color="blue"
          badge={
            stats.pendingOrders > 0
              ? `${stats.pendingOrders} en attente`
              : undefined
          }
        />
        <KpiCard
          label="Produits"
          value={stats.totalProducts.toString()}
          icon={Package}
          color="purple"
          alert={
            stats.lowStockProducts > 0
              ? `${stats.lowStockProducts} stock bas`
              : undefined
          }
        />
        <KpiCard
          label="Livrées"
          value={stats.deliveredOrders.toString()}
          icon={CheckCircle}
          color="gray"
          sub="Commandes finalisées"
        />
      </div>

      {/* Order Pipeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-serif font-medium text-xl text-gray-900">
            Pipeline des commandes
          </h3>
          <Link
            href="/admin/orders"
            className="text-sm text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            Voir détails <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <PipelineStep
            label="En attente"
            count={stats.pendingOrders}
            color="amber"
            icon={Clock}
          />
          <PipelineStep
            label="Confirmées"
            count={stats.confirmedOrders}
            color="blue"
            icon={CheckCircle}
          />
          <PipelineStep
            label="Expédiées"
            count={stats.shippedOrders}
            color="purple"
            icon={Truck}
          />
          <PipelineStep
            label="Livrées"
            count={stats.deliveredOrders}
            color="emerald"
            icon={CheckCircle}
            isLast
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-medium text-xl text-gray-900">
              Commandes récentes
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-widest text-gray-500">
                  <th className="py-4 px-6 font-medium">Réf</th>
                  <th className="py-4 px-6 font-medium">Client</th>
                  <th className="py-4 px-6 font-medium">Montant</th>
                  <th className="py-4 px-6 font-medium">Statut</th>
                  <th className="py-4 px-6 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-gray-400 text-sm"
                    >
                      Aucune commande récente
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs text-gray-500">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {order.customerName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {order.total?.toLocaleString()} DZD
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/admin/orders`}
                          className="text-gray-300 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 inline-flex transition-all"
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="space-y-6">
            <h3 className="font-serif font-medium text-xl text-gray-900">
              Actions rapides
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
              <Link
                href="/admin/products/new"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                  Ajouter un produit
                </span>
              </Link>
              <Link
                href="/admin/collections/new"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <FolderOpen size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                  Nouvelle collection
                </span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors">
                  <ShoppingBag size={20} />
                </div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                  Gérer les commandes
                </span>
              </Link>
              <div className="h-px bg-gray-100 my-2" />
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2.5 bg-gray-50 text-gray-400 rounded-lg group-hover:text-gray-600 transition-colors">
                  <Eye size={20} />
                </div>
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900">
                  Voir la boutique
                </span>
              </Link>
            </div>
          </div>

          {/* Top Products */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-medium text-xl text-gray-900">
                Produits populaires
              </h3>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aucun produit
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.topProducts.map((product: any) => {
                    const images = JSON.parse(product.images || "[]");
                    return (
                      <Link
                        key={product.id}
                        href={`/admin/products/${product.id}/edit`}
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package
                              size={20}
                              className="m-auto text-gray-300"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-harp-brown transition-colors">
                            {product.nameFr}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.price?.toLocaleString()} DZD
                          </p>
                        </div>
                        <MoreHorizontal
                          size={16}
                          className="text-gray-300 group-hover:text-gray-600"
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  badge,
  alert,
  sub,
}: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-6">
        <div
          className={cn(
            "p-3 rounded-xl transition-colors",
            colors[color] || "bg-gray-50 text-gray-600",
          )}
        >
          <Icon size={22} />
        </div>
        {badge && (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold tracking-wide border border-blue-100">
            {badge}
          </span>
        )}
        {alert && (
          <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-semibold tracking-wide border border-red-100">
            {alert}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">{label}</h3>
        <p className="text-3xl font-serif font-medium text-gray-900">{value}</p>
        {trend && (
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <ArrowUpRight size={12} /> {trend}
          </p>
        )}
        {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
      </div>
    </div>
  );
}

function PipelineStep({ label, count, color, icon: Icon, isLast }: any) {
  const colors: any = {
    amber: "hover:border-amber-200 hover:bg-amber-50/50",
    blue: "hover:border-blue-200 hover:bg-blue-50/50",
    purple: "hover:border-purple-200 hover:bg-purple-50/50",
    emerald: "hover:border-emerald-200 hover:bg-emerald-50/50",
  };

  const iconColors: any = {
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
    emerald: "text-emerald-600 bg-emerald-50",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 transition-all duration-300 cursor-pointer bg-white",
        colors[color],
      )}
    >
      <div
        className={cn(
          "p-3 rounded-full mb-4 transition-colors",
          iconColors[color],
        )}
      >
        <Icon size={24} />
      </div>
      <span className="text-3xl font-serif font-medium text-gray-900 mb-1">
        {count}
      </span>
      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
        {label}
      </span>

      {!isLast && (
        <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gray-200 z-10" />
      )}
    </div>
  );
}
