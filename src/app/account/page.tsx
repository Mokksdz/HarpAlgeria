"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  MapPin,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  subtotal: number | string;
  shippingPrice: number | string;
  trackingNumber: string | null;
  trackingStatus: string | null;
  deliveryProvider: string | null;
  customerWilaya: string;
  customerCity: string;
  items: OrderItem[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "En attente",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirm\u00e9e",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: Package,
  },
  SHIPPED: {
    label: "Exp\u00e9di\u00e9e",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: Truck,
  },
  DELIVERED: {
    label: "Livr\u00e9e",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Annul\u00e9e",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: XCircle,
  },
};

const STEP_KEYS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

function statusIndex(status: string): number {
  if (status === "CANCELLED") return -1;
  return STEP_KEYS.indexOf(status as (typeof STEP_KEYS)[number]);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function OrderProgressBar({ status }: { status: string }) {
  const idx = statusIndex(status);
  if (idx === -1) return null; // cancelled - no progress bar

  return (
    <div className="flex items-center gap-1 mt-4">
      {STEP_KEYS.map((step, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-1.5 w-full rounded-full transition-colors",
                done ? "bg-[#5D4E37]" : "bg-gray-200",
                active && status === "SHIPPED" && "animate-pulse"
              )}
            />
            <span
              className={cn(
                "text-[10px] leading-tight hidden sm:block",
                done ? "text-[#5D4E37] font-medium" : "text-gray-400"
              )}
            >
              {STATUS_MAP[step]?.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const info = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
  const StatusIcon = info.icon;
  const ref = order.id.slice(0, 8).toUpperCase();

  const date = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemsSummary = order.items
    .map((i) => `${i.productName} (${i.size}/${i.color}) x${i.quantity}`)
    .join(", ");

  return (
    <div className="border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-[#F5F0E8]/60 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-semibold text-[#5D4E37]">
            #{ref}
          </span>
          <span className="text-sm text-gray-500">{date}</span>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border",
            info.bg,
            info.color
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {info.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Items */}
        <p className="text-sm text-gray-600 line-clamp-2">{itemsSummary}</p>

        {/* Delivery + Total row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {order.customerCity}, {order.customerWilaya}
            </span>
          </div>
          <span className="font-semibold text-[#5D4E37]">
            {formatPrice(order.total)}
          </span>
        </div>

        {/* Tracking */}
        {order.trackingNumber && (
          <Link
            href={`/suivi?tracking=${order.trackingNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C4A882] hover:text-[#5D4E37] transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            Suivi : {order.trackingNumber}
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}

        {/* Progress */}
        <OrderProgressBar status={order.status} />
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="border border-gray-100 rounded-xl overflow-hidden animate-pulse"
        >
          <div className="h-14 bg-[#F5F0E8]/40" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-1.5 bg-gray-100 rounded w-full mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/magic-link-request");
    }
    // Redirect admins to the admin dashboard
    if (
      status === "authenticated" &&
      (session?.user as { role?: string })?.role === "admin"
    ) {
      router.push("/admin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchOrders() {
      try {
        const res = await fetch("/api/v3/account/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setOrdersLoading(false);
      }
    }

    fetchOrders();
  }, [status]);

  const loading = status === "loading" || status === "unauthenticated";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5C4033]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-[#5C4033]">Mon Compte</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-medium mb-4">
                Informations personnelles
              </h2>
              <div className="space-y-2 text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">Email:</span>{" "}
                  {session?.user?.email}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Statut:</span>{" "}
                  {session?.user?.image === "black" ? "Membre Black" : "Membre"}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium mb-4">Mes avantages</h2>
              <div className="bg-[#F9F7F2] p-6 rounded-lg">
                <p className="text-gray-600 mb-2">Programme de fidélité</p>
                <Link
                  href="/loyalty"
                  className="text-[#5C4033] underline text-sm"
                >
                  Voir mes points et récompenses
                </Link>
              </div>
            </div>
          </div>

          {/* ---- Order History ---- */}
          <div className="mt-12 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-medium mb-6">
              Mes commandes récentes
            </h2>

            {ordersLoading ? (
              <OrdersSkeleton />
            ) : orders.length === 0 ? (
              <div className="text-center py-10 bg-[#F5F0E8]/40 rounded-xl">
                <Package className="w-10 h-10 mx-auto text-[#C4A882] mb-3" />
                <p className="text-gray-500 mb-3">
                  Aucune commande pour le moment.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5D4E37] hover:text-[#C4A882] transition-colors"
                >
                  Découvrir la boutique
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
