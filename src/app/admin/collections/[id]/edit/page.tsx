"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Loader2,
  X,
  Image as ImageIcon,
  Save,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nameFr: "",
    nameAr: "",
    image: "",
  });

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await fetch(`/api/collections/${id}`);
        if (!res.ok) throw new Error("Collection not found");
        const data = await res.json();

        setFormData({
          nameFr: data.nameFr,
          nameAr: data.nameAr,
          image: data.image || "",
        });
      } catch (error) {
        console.error("Error fetching collection:", error);
        alert("Erreur lors du chargement de la collection");
        router.push("/admin/collections");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, image: data.url }));
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/admin/collections");
      } else {
        alert("Erreur lors de la modification de la collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      alert("Erreur lors de la modification de la collection");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-300 mb-4" />
        <p className="text-sm text-gray-500 uppercase tracking-widest">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/admin/collections"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Retour aux collections</span>
        </Link>

        <h1 className="text-3xl font-serif font-medium text-gray-900">
          Modifier la Collection
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Mettez à jour les informations de la collection
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8"
      >
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900 border-b border-gray-50 pb-4">
            Informations générales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Nom (Français)
              </label>
              <input
                required
                name="nameFr"
                value={formData.nameFr}
                onChange={handleChange}
                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2" dir="rtl">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                الاسم (بالعربية)
              </label>
              <input
                required
                name="nameAr"
                value={formData.nameAr}
                onChange={handleChange}
                className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Image de couverture
            </label>

            {/* Image Preview */}
            {formData.image ? (
              <div className="relative w-full max-w-md aspect-video bg-gray-50 rounded-xl overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, image: "" }))
                  }
                  className="absolute top-3 right-3 p-2 bg-white text-red-500 rounded-lg hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md aspect-video border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer gap-3"
              >
                <div className="p-3 bg-gray-100 rounded-full">
                  <ImageIcon size={24} className="text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Cliquez pour uploader
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG jusqu'à 5MB
                  </p>
                </div>
              </div>
            )}

            {/* Upload controls */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFileUpload(e.target.files[0])
              }
              className="hidden"
            />

            <div className="flex gap-3 max-w-md">
              <div className="relative flex-1">
                <input
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="Ou coller une URL..."
                  className="w-full bg-gray-50 border-none p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none text-sm text-gray-600"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50 flex items-center justify-end gap-4">
          <Link
            href="/admin/collections"
            className="px-6 py-2.5 text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={16} />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
