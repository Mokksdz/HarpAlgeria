"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Save, Check, Image as ImageIcon } from "lucide-react";

interface FeaturedSettings {
  featuredImageUrl?: string | null;
  featuredImagePublicId?: string | null;
  featuredBadgeFr?: string | null;
  featuredBadgeAr?: string | null;
  featuredTitleFr?: string | null;
  featuredTitleAr?: string | null;
  featuredDescFr?: string | null;
  featuredDescAr?: string | null;
  featuredCtaUrl?: string | null;
}

export default function AdminFeaturedEditor({
  initial,
}: {
  initial: FeaturedSettings | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    featuredImageUrl: initial?.featuredImageUrl || "",
    featuredBadgeFr: initial?.featuredBadgeFr || "",
    featuredBadgeAr: initial?.featuredBadgeAr || "",
    featuredTitleFr: initial?.featuredTitleFr || "",
    featuredTitleAr: initial?.featuredTitleAr || "",
    featuredDescFr: initial?.featuredDescFr || "",
    featuredDescAr: initial?.featuredDescAr || "",
    featuredCtaUrl: initial?.featuredCtaUrl || "",
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, featuredImageUrl: data.url }));
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/v3/site/settings/featured", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Image de la section
        </label>
        {formData.featuredImageUrl ? (
          <div className="relative aspect-video max-w-md rounded-xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={formData.featuredImageUrl}
              alt="Featured"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors shadow-sm"
            >
              Changer
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full max-w-md border-2 border-dashed border-gray-200 rounded-xl p-8 hover:border-gray-400 hover:bg-gray-50 transition-all group"
          >
            <div className="text-center">
              {uploading ? (
                <Loader2
                  size={24}
                  className="mx-auto mb-3 animate-spin text-gray-400"
                />
              ) : (
                <ImageIcon size={24} className="mx-auto mb-3 text-gray-400" />
              )}
              <p className="text-gray-600 text-sm">
                {uploading
                  ? "Upload en cours..."
                  : "Cliquez pour uploader une image"}
              </p>
            </div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Badge (FR/AR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Badge (FR)
          </label>
          <input
            value={formData.featuredBadgeFr}
            onChange={(e) =>
              setFormData({ ...formData, featuredBadgeFr: e.target.value })
            }
            placeholder="La Pièce du Moment"
            className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2" dir="rtl">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Badge (AR)
          </label>
          <input
            value={formData.featuredBadgeAr}
            onChange={(e) =>
              setFormData({ ...formData, featuredBadgeAr: e.target.value })
            }
            placeholder="قطعة الموسم"
            className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Title (FR/AR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Titre (FR)
          </label>
          <input
            value={formData.featuredTitleFr}
            onChange={(e) =>
              setFormData({ ...formData, featuredTitleFr: e.target.value })
            }
            placeholder="L'Ensemble Signature"
            className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2" dir="rtl">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Titre (AR)
          </label>
          <input
            value={formData.featuredTitleAr}
            onChange={(e) =>
              setFormData({ ...formData, featuredTitleAr: e.target.value })
            }
            placeholder="الطقم المميز"
            className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Description (FR/AR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Description (FR)
          </label>
          <textarea
            value={formData.featuredDescFr}
            onChange={(e) =>
              setFormData({ ...formData, featuredDescFr: e.target.value })
            }
            rows={3}
            placeholder="Description de la section..."
            className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all resize-none placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-2" dir="rtl">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Description (AR)
          </label>
          <textarea
            value={formData.featuredDescAr}
            onChange={(e) =>
              setFormData({ ...formData, featuredDescAr: e.target.value })
            }
            rows={3}
            placeholder="وصف القسم..."
            className="w-full bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all resize-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* CTA URL */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Lien du bouton
        </label>
        <input
          value={formData.featuredCtaUrl}
          onChange={(e) =>
            setFormData({ ...formData, featuredCtaUrl: e.target.value })
          }
          placeholder="/shop"
          className="w-full max-w-md bg-white border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all placeholder:text-gray-400"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
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
              Sauvegardé !
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
