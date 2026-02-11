"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Save,
  Check,
  GripVertical,
  Plus,
  X,
  LayoutGrid,
} from "lucide-react";

interface Collection {
  id: string;
  nameFr: string;
  nameAr: string;
  image: string | null;
}

export default function AdminHomepageCollections() {
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/v3/site/settings/homepage-collections");
      if (res.ok) {
        const data = await res.json();
        setAllCollections(data.collections);
        setSelectedIds(data.selectedIds);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 6) return prev;
      return [...prev, id];
    });
    setSaved(false);
  };

  const removeCollection = (id: string) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    setSaved(false);
  };

  const moveItem = (from: number, to: number) => {
    setSelectedIds((prev) => {
      const arr = [...prev];
      const [removed] = arr.splice(from, 1);
      arr.splice(to, 0, removed);
      return arr;
    });
    setSaved(false);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      moveItem(dragIndex, index);
      setDragIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError("S\u00e9lectionnez au moins une collection");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/v3/site/settings/homepage-collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionIds: selectedIds }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const selectedCollections = selectedIds
    .map((id) => allCollections.find((c) => c.id === id))
    .filter(Boolean) as Collection[];

  const availableCollections = allCollections.filter(
    (c) => !selectedIds.includes(c.id),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Selected Collections - Drag to reorder */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
          Collections affich\u00e9es sur l&apos;accueil ({selectedIds.length}/6)
        </label>

        {selectedCollections.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <LayoutGrid size={24} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              Aucune collection s\u00e9lectionn\u00e9e. Ajoutez-en ci-dessous.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedCollections.map((col, index) => (
              <div
                key={col.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 bg-white border rounded-xl p-3 transition-all ${
                  dragIndex === index
                    ? "border-harp-brown/50 shadow-md scale-[1.02]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <GripVertical
                  size={16}
                  className="text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0"
                />
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-harp-brown/10 text-harp-brown text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                {col.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={col.image}
                    alt={col.nameFr}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {col.nameFr}
                  </p>
                </div>
                <button
                  onClick={() => removeCollection(col.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Collections */}
      {availableCollections.length > 0 && (
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
            Collections disponibles
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableCollections.map((col) => (
              <button
                key={col.id}
                onClick={() => toggleCollection(col.id)}
                disabled={selectedIds.length >= 6}
                className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl p-3 hover:border-harp-brown/50 hover:bg-harp-brown/5 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                {col.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={col.image}
                    alt={col.nameFr}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <LayoutGrid size={12} className="text-gray-400" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {col.nameFr}
                </span>
                <Plus
                  size={14}
                  className="text-gray-300 group-hover:text-harp-brown transition-colors flex-shrink-0"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || selectedIds.length === 0}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <Check size={16} />
              Sauvegard\u00e9 !
            </>
          ) : (
            <>
              <Save size={16} />
              Sauvegarder
            </>
          )}
        </button>
        {saved && (
          <span className="text-sm text-green-600">
            Les modifications sont en ligne
          </span>
        )}
      </div>
    </div>
  );
}
