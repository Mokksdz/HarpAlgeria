"use client";

import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FolderOpen,
  Layers,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<{ id: string; nameFr: string; nameAr: string; image: string | null; products?: { id: string }[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => {
        setCollections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch collections", err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette collection ?"))
      return;

    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCollections(collections.filter((c) => c.id !== id));
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const filteredCollections = collections.filter(
    (c) =>
      c.nameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameAr.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-gray-900">
            Collections
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Organisez vos produits par collection
          </p>
        </div>
        <Link
          href="/admin/collections/new"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium shadow-sm"
        >
          <Plus size={18} />
          Nouvelle collection
        </Link>
      </div>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Collections
            </p>
            <p className="text-2xl font-serif font-medium text-gray-900">
              {collections.length}
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
              placeholder="Rechercher une collection..."
              className="w-full pl-10 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 outline-none placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-widest text-gray-500">
              <th className="py-4 px-6 font-medium">Collection</th>
              <th className="py-4 px-6 font-medium text-right">Nom Arabe</th>
              <th className="py-4 px-6 font-medium">Produits</th>
              <th className="py-4 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-400">
                  Chargement...
                </td>
              </tr>
            ) : filteredCollections.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-400">
                  Aucune collection trouvée.
                </td>
              </tr>
            ) : (
              filteredCollections.map((collection) => (
                <tr
                  key={collection.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        {collection.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={collection.image}
                            alt={collection.nameFr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FolderOpen size={20} />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {collection.nameFr}
                      </span>
                    </div>
                  </td>
                  <td
                    className="py-4 px-6 font-medium text-right text-gray-600"
                    dir="rtl"
                  >
                    {collection.nameAr}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                      {collection.products?.length || 0} produits
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <Link
                        href={`/admin/collections/${collection.id}/edit`}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(collection.id)}
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
