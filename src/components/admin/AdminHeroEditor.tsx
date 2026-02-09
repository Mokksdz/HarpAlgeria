"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Eye,
  Save,
  RotateCcw,
  Loader2,
  History,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSettings {
  heroImageUrl?: string | null;
  heroImagePublicId?: string | null;
  heroMobileImageUrl?: string | null;
  heroMobilePublicId?: string | null;
  heroAltFr?: string | null;
  heroAltAr?: string | null;
  heroCaptionFr?: string | null;
  heroCaptionAr?: string | null;
  heroCtaTextFr?: string | null;
  heroCtaTextAr?: string | null;
  heroCtaUrl?: string | null;
  heroOverlayOpacity?: number | null;
  heroPreset?: string | null;
  heroActive?: boolean;
  heroVariant?: string | null;
}

interface Props {
  initial: HeroSettings | null;
}

const PRESETS = [
  { value: "classic", label: "Classique", desc: "Texte en bas à gauche" },
  { value: "minimal", label: "Minimal", desc: "Texte centré, simple" },
  { value: "glass", label: "Glass", desc: "Effet verre dépoli" },
  { value: "centered", label: "Centré", desc: "Tout centré" },
];

export default function AdminHeroEditor({ initial }: Props) {
  const [settings, setSettings] = useState<HeroSettings>({
    heroImageUrl: initial?.heroImageUrl || "",
    heroMobileImageUrl: initial?.heroMobileImageUrl || "",
    heroAltFr: initial?.heroAltFr || "",
    heroAltAr: initial?.heroAltAr || "",
    heroCaptionFr: initial?.heroCaptionFr || "",
    heroCaptionAr: initial?.heroCaptionAr || "",
    heroCtaTextFr: initial?.heroCtaTextFr || "",
    heroCtaTextAr: initial?.heroCtaTextAr || "",
    heroCtaUrl: initial?.heroCtaUrl || "",
    heroOverlayOpacity: initial?.heroOverlayOpacity ?? 0.35,
    heroPreset: initial?.heroPreset || "classic",
    heroActive: initial?.heroActive ?? true,
    heroVariant: initial?.heroVariant || "image",
  });

  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Upload image via Vercel Blob
  async function handleUpload(file: File, type: "desktop" | "mobile") {
    setUploading(type);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const result = await res.json();

      if (type === "desktop") {
        setSettings((prev) => ({
          ...prev,
          heroImageUrl: result.url,
          heroImagePublicId: null,
        }));
      } else {
        setSettings((prev) => ({
          ...prev,
          heroMobileImageUrl: result.url,
          heroMobilePublicId: null,
        }));
      }

      setMessage({ type: "success", text: "Image uploadée avec succès" });
    } catch (err: any) {
      console.error("Upload error:", err);
      setMessage({
        type: "error",
        text: err.message || "Erreur lors de l'upload",
      });
    } finally {
      setUploading(null);
    }
  }

  // Save settings
  async function save() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v3/site/settings/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setMessage({ type: "success", text: "Paramètres sauvegardés !" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  // Load history
  async function loadHistory() {
    try {
      const res = await fetch("/api/v3/site/hero/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
        setShowHistory(true);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }

  // Rollback to history version
  async function rollback(historyId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/v3/site/hero/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId }),
      });

      const data = await res.json();
      if (data.success) {
        // Reload settings
        const settingsRes = await fetch("/api/v3/site/settings/hero");
        const newSettings = await settingsRes.json();
        setSettings({
          heroImageUrl: newSettings.heroImageUrl || "",
          heroMobileImageUrl: newSettings.heroMobileImageUrl || "",
          heroAltFr: newSettings.heroAltFr || "",
          heroAltAr: newSettings.heroAltAr || "",
          heroCaptionFr: newSettings.heroCaptionFr || "",
          heroCaptionAr: newSettings.heroCaptionAr || "",
          heroCtaTextFr: newSettings.heroCtaTextFr || "",
          heroCtaTextAr: newSettings.heroCtaTextAr || "",
          heroCtaUrl: newSettings.heroCtaUrl || "",
          heroOverlayOpacity: newSettings.heroOverlayOpacity ?? 0.35,
          heroPreset: newSettings.heroPreset || "classic",
          heroActive: newSettings.heroActive ?? true,
          heroVariant: newSettings.heroVariant || "image",
        });
        setShowHistory(false);
        setMessage({ type: "success", text: "Version restaurée !" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const previewImage =
    previewMode === "mobile" && settings.heroMobileImageUrl
      ? settings.heroMobileImageUrl
      : settings.heroImageUrl;

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={cn(
            "p-4 rounded-lg flex items-center justify-between",
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700",
          )}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white border rounded-xl p-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.heroActive}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    heroActive: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-gray-300 text-harp-brown focus:ring-harp-brown"
              />
              <span className="font-medium">Hero actif</span>
            </label>
          </div>

          {/* Images */}
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-harp-brown flex items-center gap-2">
              <ImageIcon size={18} />
              Images
            </h3>

            {/* Desktop Image */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                <Monitor size={14} />
                Image Desktop
              </label>
              <input
                type="file"
                ref={desktopInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleUpload(e.target.files[0], "desktop")
                }
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.heroImageUrl || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroImageUrl: e.target.value,
                    }))
                  }
                  placeholder="URL de l'image ou uploader"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => desktopInputRef.current?.click()}
                  disabled={uploading === "desktop"}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  {uploading === "desktop" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Image */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block flex items-center gap-2">
                <Smartphone size={14} />
                Image Mobile (optionnel)
              </label>
              <input
                type="file"
                ref={mobileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleUpload(e.target.files[0], "mobile")
                }
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.heroMobileImageUrl || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroMobileImageUrl: e.target.value,
                    }))
                  }
                  placeholder="URL de l'image mobile"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => mobileInputRef.current?.click()}
                  disabled={uploading === "mobile"}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  {uploading === "mobile" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Alt Text */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Alt FR
                </label>
                <input
                  type="text"
                  value={settings.heroAltFr || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroAltFr: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Alt AR
                </label>
                <input
                  type="text"
                  value={settings.heroAltAr || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroAltAr: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-harp-brown">Texte</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Titre FR
                </label>
                <input
                  type="text"
                  value={settings.heroCaptionFr || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroCaptionFr: e.target.value,
                    }))
                  }
                  placeholder="Nouvelle Collection"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Titre AR
                </label>
                <input
                  type="text"
                  value={settings.heroCaptionAr || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroCaptionAr: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Bouton FR
                </label>
                <input
                  type="text"
                  value={settings.heroCtaTextFr || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroCtaTextFr: e.target.value,
                    }))
                  }
                  placeholder="Découvrir"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  Bouton AR
                </label>
                <input
                  type="text"
                  value={settings.heroCtaTextAr || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      heroCtaTextAr: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Lien du bouton
              </label>
              <input
                type="text"
                value={settings.heroCtaUrl || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    heroCtaUrl: e.target.value,
                  }))
                }
                placeholder="/shop"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Style */}
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-harp-brown">Style</h3>

            {/* Preset */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        heroPreset: preset.value,
                      }))
                    }
                    className={cn(
                      "p-3 border rounded-lg text-left transition-all",
                      settings.heroPreset === preset.value
                        ? "border-harp-brown bg-harp-brown/5"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <div className="font-medium text-sm">{preset.label}</div>
                    <div className="text-xs text-gray-500">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">
                Opacité overlay:{" "}
                {Math.round((settings.heroOverlayOpacity || 0) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.heroOverlayOpacity || 0}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    heroOverlayOpacity: parseFloat(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-harp-brown flex items-center gap-2">
              <Eye size={18} />
              Aperçu
            </h3>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  previewMode === "desktop"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200",
                )}
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  previewMode === "mobile"
                    ? "bg-white shadow-sm"
                    : "hover:bg-gray-200",
                )}
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div
            className={cn(
              "relative overflow-hidden rounded-xl border bg-gray-100 mx-auto transition-all",
              previewMode === "desktop"
                ? "w-full aspect-[16/9]"
                : "w-[280px] aspect-[9/16]",
            )}
          >
            {previewImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: `rgba(0,0,0,${settings.heroOverlayOpacity || 0})`,
                  }}
                />
                <div
                  className={cn(
                    "absolute inset-0 flex p-6",
                    settings.heroPreset === "centered"
                      ? "items-center justify-center text-center"
                      : settings.heroPreset === "minimal"
                        ? "items-center justify-center text-center"
                        : "items-end",
                  )}
                >
                  <div className="text-white">
                    <h2
                      className={cn(
                        "font-serif font-bold",
                        previewMode === "desktop" ? "text-3xl" : "text-xl",
                      )}
                    >
                      {settings.heroCaptionFr || "Titre du Hero"}
                    </h2>
                    {settings.heroCtaTextFr && (
                      <button className="mt-4 px-6 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium">
                        {settings.heroCtaTextFr}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune image</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-harp-brown text-white rounded-xl font-medium hover:bg-harp-brown/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Enregistrer
            </button>
            <button
              onClick={loadHistory}
              className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <History size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Historique des versions</h3>
              <button onClick={() => setShowHistory(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Aucun historique
                </p>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(h.createdAt).toLocaleString("fr-FR")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {h.snapshot.heroCaptionFr || "Sans titre"}
                      </div>
                    </div>
                    <button
                      onClick={() => rollback(h.id)}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Restaurer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
