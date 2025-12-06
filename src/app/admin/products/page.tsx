"use client";

import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  Filter,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/products?pageSize=100")
      .then((res) => res.json())
      .then((data) => {
        const productsList = Array.isArray(data) ? data : data.items || [];
        setProducts(productsList);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.nameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.collection?.nameFr?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            Produits
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez votre catalogue produit
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium shadow-sm"
        >
          <Plus size={18} />
          Nouveau produit
        </Link>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Produits</p>
            <p className="text-2xl font-serif font-medium text-gray-900">
              {products.length}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher par nom, collection..."
              className="w-full pl-10 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 outline-none placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="pr-1">
            <button className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-widest text-gray-500">
              <th className="py-4 px-6 font-medium">Produit</th>
              <th className="py-4 px-6 font-medium">Collection</th>
              <th className="py-4 px-6 font-medium">Prix</th>
              <th className="py-4 px-6 font-medium">Stock</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  Aucun produit trouvé.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={JSON.parse(product.images || "[]")[0]}
                          alt={product.nameFr}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-gray-900">
                        {product.nameFr}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {product.collection ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-100">
                        <Tag size={12} />
                        {product.collection.nameFr}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {product.price?.toLocaleString()} DZD
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                          (product.stock || 0) === 0
                            ? "bg-red-50 text-red-700 border-red-100"
                            : (product.stock || 0) < 5
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-100",
                        )}
                      >
                        {product.stock || 0} en stock
                      </span>
                      {(product.stock || 0) < 5 && (
                        <AlertCircle size={14} className="text-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
