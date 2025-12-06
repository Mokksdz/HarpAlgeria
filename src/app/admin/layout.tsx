"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, ShoppingBag, Package, FolderOpen, LogOut, Menu, X, ExternalLink, Loader2, Truck, Settings, Calculator, Users, Palette } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { data: session, status } = useSession();
    
    // Redirect to login if not authenticated (in useEffect to avoid setState during render)
    useEffect(() => {
        if (status === "unauthenticated" && pathname !== "/admin/login") {
            router.push("/admin/login");
        }
    }, [status, pathname, router]);

    // Don't show admin layout on login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    // Show loading state
    if (status === "loading" || status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-gray-900 mx-auto mb-4" />
                    <p className="text-xs uppercase tracking-widest text-gray-400">
                        {status === "loading" ? "Chargement..." : "Redirection..."}
                    </p>
                </div>
            </div>
        );
    }

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/orders", label: "Commandes", icon: ShoppingBag },
        { href: "/admin/clients", label: "Clients", icon: Users },
        { href: "/admin/shipping", label: "Livraison", icon: Truck },
        { href: "/admin/products", label: "Produits", icon: Package },
        { href: "/admin/collections", label: "Collections", icon: FolderOpen },
        { href: "/admin/compta", label: "Comptabilité", icon: Calculator },
        { href: "/admin/settings/customization", label: "Personnalisation", icon: Palette },
        { href: "/admin/settings", label: "Paramètres", icon: Settings },
    ];

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:transform-none",
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}>
                <div className="p-8 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Image 
                                src="/logo.svg" 
                                alt="HARP" 
                                width={40} 
                                height={40}
                                className="h-8 w-auto"
                            />
                            <div className="h-8 w-px bg-gray-200 mx-1" />
                            <p className="text-xs font-serif font-medium text-gray-400 tracking-widest uppercase pt-1">Admin</p>
                        </div>
                        <button 
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-gray-400 hover:text-gray-900"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-1">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em] px-3 mb-4">Menu</p>
                    {links.map((link) => {
                        const active = isActive(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                    active
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <link.icon size={18} className={active ? "text-white" : "text-gray-400 group-hover:text-gray-900"} />
                                <span className="text-sm font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-gray-50 space-y-2">
                    <Link 
                        href="/" 
                        target="_blank"
                        className="flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors group"
                    >
                        <ExternalLink size={18} className="text-gray-400 group-hover:text-gray-900" />
                        <span className="text-sm font-medium">Voir le site</span>
                    </Link>
                    <button 
                        onClick={() => signOut({ callbackUrl: "/admin/login" })}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between lg:justify-end sticky top-0 z-30">
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900">{session?.user?.name || "Administrateur"}</p>
                            <p className="text-xs text-gray-400">{session?.user?.email || ""}</p>
                        </div>
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-serif font-bold text-gray-600 border border-gray-200">
                            {session?.user?.name?.charAt(0) || "A"}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
}
